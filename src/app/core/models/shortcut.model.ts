export type ShortcutId = 'velo' | 'dash' | 'sevdesk' | 'calendar';

export interface AppShortcut {
  id: ShortcutId;
  label: string;
  description: string;
  url?: string;
  route?: string;
  icon: string;
  external: boolean;
}
