import { TestBed } from '@angular/core/testing';
import { DEFAULT_SETTINGS } from '../models/settings.model';
import { InMemorySettingsApi } from '../../testing/in-memory-settings-api';
import { SettingsApi, SettingsApiResult, settingsApiUrl } from './settings-api';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  function api(): InMemorySettingsApi {
    return TestBed.inject(SettingsApi) as InMemorySettingsApi;
  }

  async function loadedService(): Promise<SettingsService> {
    const service = TestBed.inject(SettingsService);
    await service.whenLoaded();
    return service;
  }

  it('should expose default external urls before and after loading', async () => {
    const service = TestBed.inject(SettingsService);

    expect(service.status()).toBe('loading');
    expect(service.settings()).toEqual(DEFAULT_SETTINGS);

    await service.whenLoaded();

    expect(service.status()).toBe('ready');
    expect(service.externalUrls()).toEqual({
      velo: DEFAULT_SETTINGS.veloUrl,
      dash: DEFAULT_SETTINGS.dashUrl,
      sevdesk: DEFAULT_SETTINGS.sevDeskUrl,
      localTool1: DEFAULT_SETTINGS.localTool1Url,
      localTool2: DEFAULT_SETTINGS.localTool2Url,
    });
  });

  it('should load the settings stored in the backend and map empty strings to undefined', async () => {
    api().stored = {
      ...DEFAULT_SETTINGS,
      veloUrl: 'http://localhost:4301',
      calendarSourceUrl: '',
      veloApiUrl: 'https://arrow.local/velo',
      dailyTargetHours: 7.5,
    };

    const service = await loadedService();

    expect(service.settings().veloUrl).toBe('http://localhost:4301');
    expect(service.settings().calendarSourceUrl).toBeUndefined();
    expect(service.settings().veloApiUrl).toBe('https://arrow.local/velo');
    expect(service.settings().dailyTargetHours).toBe(7.5);
  });

  it('should save through the backend and send every optional field as a string', async () => {
    const service = await loadedService();

    const result = await service.updateSettings({
      ...DEFAULT_SETTINGS,
      veloUrl: 'http://localhost:4301',
      localTool1Label: 'Docs',
      localTool1Url: 'http://localhost:8080',
    });

    expect(result).toEqual({ ok: true });
    expect(api().requests.at(-1)).toMatchObject({
      veloUrl: 'http://localhost:4301',
      calendarSourceUrl: '',
      veloSourceUrl: '',
      dashSourceUrl: '',
      veloApiUrl: '',
      dashApiUrl: '',
    });
    expect(service.localTools()[0]).toEqual({
      id: 'local-tool-1',
      label: 'Docs',
      url: 'http://localhost:8080',
    });
  });

  it('should keep the defaults and refuse saving when the backend is unavailable', async () => {
    api().available = false;
    const service = await loadedService();

    expect(service.status()).toBe('unavailable');
    expect(service.settings()).toEqual(DEFAULT_SETTINGS);

    const result = await service.updateSettings({ ...DEFAULT_SETTINGS, veloUrl: 'http://x.test' });

    expect(result).toEqual({ ok: false, reason: 'unavailable' });
    expect(service.settings().veloUrl).toBe(DEFAULT_SETTINGS.veloUrl);
  });

  it('should become ready after a successful reload', async () => {
    api().available = false;
    const service = await loadedService();
    api().available = true;

    await service.reload();

    expect(service.status()).toBe('ready');
  });

  it('should report validation errors of the backend and keep the stored settings', async () => {
    const service = await loadedService();
    vi.spyOn(api(), 'put').mockResolvedValue({
      kind: 'invalid',
      detail: 'veloUrl: must be an http or https URL',
    });

    const result = await service.updateSettings({ ...DEFAULT_SETTINGS, veloUrl: 'http://x.test' });

    expect(result).toEqual({
      ok: false,
      reason: 'invalid',
      detail: 'veloUrl: must be an http or https URL',
    });
    expect(service.settings().veloUrl).toBe(DEFAULT_SETTINGS.veloUrl);
  });

  it('should ignore a load answer that arrives after a newer save', async () => {
    const service = await loadedService();
    let answerSave: (result: SettingsApiResult) => void = () => undefined;
    let answerLoad: (result: SettingsApiResult) => void = () => undefined;
    vi.spyOn(api(), 'put').mockReturnValueOnce(new Promise((resolve) => (answerSave = resolve)));
    vi.spyOn(api(), 'get').mockReturnValueOnce(new Promise((resolve) => (answerLoad = resolve)));

    const save = service.updateSettings({ ...DEFAULT_SETTINGS, veloUrl: 'http://new.test' });
    const reload = service.reload();
    answerSave({ kind: 'ok', payload: { ...DEFAULT_SETTINGS, veloUrl: 'http://new.test' } });
    await save;
    answerLoad({ kind: 'ok', payload: { ...DEFAULT_SETTINGS, veloUrl: 'http://old.test' } });
    await reload;

    expect(service.settings().veloUrl).toBe('http://new.test');
  });

  it('should not save before the settings are loaded', async () => {
    const service = TestBed.inject(SettingsService);
    const put = vi.spyOn(api(), 'put');

    expect(await service.updateSettings(DEFAULT_SETTINGS)).toEqual({
      ok: false,
      reason: 'unavailable',
    });
    expect(put).not.toHaveBeenCalled();
  });

  it('should reload after a save whose outcome is unknown', async () => {
    const service = await loadedService();
    vi.spyOn(api(), 'put').mockResolvedValue({ kind: 'unavailable' });
    const get = vi.spyOn(api(), 'get');

    await service.updateSettings({ ...DEFAULT_SETTINGS, veloUrl: 'http://x.test' });
    await service.whenLoaded();

    expect(get).toHaveBeenCalled();
    expect(service.status()).toBe('ready');
  });

  it('should export and import settings JSON', async () => {
    const service = await loadedService();

    await service.updateSettings({
      ...DEFAULT_SETTINGS,
      veloUrl: 'http://localhost:4401',
      localTool1Label: 'NAS',
      localTool1Url: 'http://localhost:8080',
    });
    const exportedSettings = service.exportSettings();

    await service.resetSettings();
    expect(service.settings().veloUrl).toBe(DEFAULT_SETTINGS.veloUrl);

    expect(await service.importSettings(exportedSettings)).toEqual({ ok: true });
    expect(service.settings().veloUrl).toBe('http://localhost:4401');
    expect(service.settings().localTool1Label).toBe('NAS');
    expect(await service.importSettings('{broken')).toBeNull();
  });

  it('should fall back to the default refresh interval for unknown values', async () => {
    const service = await loadedService();

    await service.importSettings(JSON.stringify({ autoRefreshMinutes: 7 }));
    expect(service.settings().autoRefreshMinutes).toBe(DEFAULT_SETTINGS.autoRefreshMinutes);

    await service.importSettings(JSON.stringify({ autoRefreshMinutes: 0 }));
    expect(service.settings().autoRefreshMinutes).toBe(0);
  });

  it('should reject imports that are not a settings object', async () => {
    const service = await loadedService();
    await service.updateSettings({ ...DEFAULT_SETTINGS, veloUrl: 'http://localhost:4401' });

    for (const raw of ['null', '[]', '"x"', '42']) {
      expect(await service.importSettings(raw)).toBeNull();
    }
    expect(service.settings().veloUrl).toBe('http://localhost:4401');
  });

  it('should drop values of the wrong type from an import', async () => {
    const service = await loadedService();

    await service.importSettings(
      JSON.stringify({ veloApiUrl: 123, calendarSourceUrl: ['a'], veloUrl: false }),
    );

    expect(service.settings().veloApiUrl).toBeUndefined();
    expect(service.settings().calendarSourceUrl).toBeUndefined();
    expect(service.settings().veloUrl).toBe(DEFAULT_SETTINGS.veloUrl);
  });

  it('should resolve the API against the base href', () => {
    expect(settingsApiUrl()).toBe(new URL('api/v1/settings', document.baseURI).href);
  });
});

describe('SettingsApi', () => {
  afterEach(() => vi.unstubAllGlobals());

  function realApi(): SettingsApi {
    TestBed.overrideProvider(SettingsApi, { useFactory: () => new SettingsApi() });
    return TestBed.inject(SettingsApi);
  }

  it('should map the backend answers', async () => {
    const answers = [
      Response.json({ veloUrl: 'http://a.test' }),
      Response.json({ detail: 'dailyTargetHours: must be at most 24' }, { status: 422 }),
      Response.json({ detail: 'Origin not allowed' }, { status: 403 }),
      new Response('', { status: 503 }),
      new Response('<!doctype html>'),
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => answers.shift()),
    );
    const api = realApi();

    expect(await api.get()).toEqual({ kind: 'ok', payload: { veloUrl: 'http://a.test' } });
    expect(await api.put({})).toEqual({
      kind: 'invalid',
      detail: 'dailyTargetHours: must be at most 24',
    });
    expect(await api.put({})).toEqual({ kind: 'forbidden' });
    expect(await api.get()).toEqual({ kind: 'unavailable' });
    expect(await api.get()).toEqual({ kind: 'unavailable' });
  });

  it('should report a network error as unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    expect(await realApi().get()).toEqual({ kind: 'unavailable' });
  });

  it('should send PUT with a JSON body', async () => {
    const fetchMock = vi.fn(async () => Response.json({}));
    vi.stubGlobal('fetch', fetchMock);

    await realApi().put({ veloUrl: 'http://a.test' });

    expect(fetchMock).toHaveBeenCalledWith(
      settingsApiUrl(),
      expect.objectContaining({ method: 'PUT', body: '{"veloUrl":"http://a.test"}' }),
    );
  });
});
