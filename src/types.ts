export type SuiteCard = {
  id: string;
  title: string;
  description: string;
  url: string;
  /** Accent color (#rrggbb); omit or undefined = default neutral card */
  color?: string;
};
