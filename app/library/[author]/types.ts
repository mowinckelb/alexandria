export interface PulseCard {
  alltime: { name: string; pct: number; why: string };
  this_month: Array<{ name: string; why: string }>;
  ideas: number;
  ideas_delta: number;
  themes?: string[];
  fragments?: Array<{ source: string; idea: string }>;
  month: string;
}
