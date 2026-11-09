import { TaskApi } from './task-api';
import { backendRequest, backendUrl } from './backend-request';

describe('backendRequest', () => {
  afterEach(() => vi.unstubAllGlobals());

  function answer(response: Response | Error) {
    const fetchMock = vi.fn(async () => {
      if (response instanceof Error) {
        throw response;
      }
      return response;
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('should map the status codes of the backend', async () => {
    const cases: [Response, unknown][] = [
      [Response.json({ a: 1 }), { kind: 'ok', payload: { a: 1 } }],
      [new Response(null, { status: 204 }), { kind: 'ok', payload: null }],
      [
        Response.json({ detail: 'title: blank' }, { status: 422 }),
        { kind: 'invalid', detail: 'title: blank' },
      ],
      [new Response('broken', { status: 400 }), { kind: 'invalid', detail: '' }],
      [
        Response.json({ detail: 'version' }, { status: 409 }),
        { kind: 'conflict', detail: 'version' },
      ],
      [new Response('', { status: 403 }), { kind: 'forbidden' }],
      [new Response('', { status: 404 }), { kind: 'not-found' }],
      [new Response('', { status: 503 }), { kind: 'unavailable' }],
      [new Response('<!doctype html>'), { kind: 'unavailable' }],
    ];

    for (const [response, expected] of cases) {
      answer(response);
      expect(await backendRequest('tasks')).toEqual(expected);
    }
  });

  it('should report network errors as unavailable', async () => {
    answer(new TypeError('Failed to fetch'));

    expect(await backendRequest('tasks')).toEqual({ kind: 'unavailable' });
  });

  it('should send JSON with the content type and keep given headers', async () => {
    const fetchMock = answer(Response.json({}));

    await backendRequest('tasks', { method: 'POST', body: '{}', headers: [['X-Test', '1']] });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe(backendUrl('tasks'));
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.get('X-Test')).toBe('1');
  });
});

describe('TaskApi', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('should reject answers of the wrong shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json([{ id: 1 }])),
    );

    expect(await new TaskApi().list('2026-11-09')).toEqual({ kind: 'invalid-shape' });
  });

  it('should send the explicit brain-dump target and the version on delete', async () => {
    const fetchMock = vi.fn(async () => Response.json([]));
    vi.stubGlobal('fetch', fetchMock);
    const api = new TaskApi();

    await api.move(['a'], null);
    await api.list(null);

    const [moveUrl, moveInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(moveUrl).toBe(backendUrl('tasks/move'));
    expect(JSON.parse(moveInit.body as string)).toEqual({
      ids: ['a'],
      planDate: null,
      backlog: true,
    });
    expect((fetchMock.mock.calls[1] as unknown as [string])[0]).toBe(backendUrl('tasks'));

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect(await api.delete('a', 3)).toEqual({ kind: 'ok', data: null });
    expect((fetchMock.mock.calls[2] as unknown as [string])[0]).toBe(
      backendUrl('tasks/a?version=3'),
    );
  });
});
