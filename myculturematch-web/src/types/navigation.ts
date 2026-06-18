export interface NavItem {
  name: string;
  icon: string;
  path: string;
  badge?: string | null;
  active?: boolean;
}
