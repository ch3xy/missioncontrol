import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { createMemoryStorage } from '../testing/memory-storage';
import { Shell } from './shell';

describe('Shell', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('should render grouped navigation with settings in the footer', async () => {
    const element = await render();

    const groups = Array.from(element.querySelectorAll('.nav-group-label')).map((label) =>
      label.textContent?.trim(),
    );
    expect(groups).toEqual(['Übersicht', 'Apps']);
    expect(element.querySelector('.nav-footer')?.textContent).toContain('Einstellungen');
    expect(element.querySelector('.nav-version')?.textContent?.trim()).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('should persist the collapsed sidebar state', async () => {
    const element = await render();
    const collapseButton = element.querySelector<HTMLButtonElement>('.collapse-btn');

    collapseButton?.click();

    expect(localStorage.getItem('missioncontrol-nav-collapsed')).toBe('true');
  });

  it('should apply the theme to the document', async () => {
    await render();

    expect(['light', 'dark']).toContain(document.documentElement.getAttribute('data-theme'));
  });
});
