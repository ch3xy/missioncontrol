export type ShortcutId =
  | 'velo'
  | 'dash'
  | 'sevdesk'
  | 'calendar'
  | 'local-tool-1'
  | 'local-tool-2';

export interface AppShortcut {
  id: ShortcutId;
  label: string;
  description: string;
  url?: string;
  route?: string;
  icon: string;
  external: boolean;
}
