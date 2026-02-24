export interface Project {
  name: string;
  content: string;
  suggestBy: string;
  staff: string;
  amount: number;
  category: string;
  status: string;
  photos: string;
  id?: string; // Optional for internal use
}

export interface Case {
  name: string;
  budget: number;
  awardedAmount: number;
  status: string;
  vendor: string;
  constCost: number;
  pollutionCost: number;
  mgmtCost: number;
  customCost: number;
  totalAwarded: number;
}

export interface Payment {
  caseName: string;
  stage: string;
  amount: number;
  date: string;
  invoice: string;
  id: string;
}

export interface Settings {
  categories: Record<string, number>;
  suggesters: Record<string, number>;
  staff: string[];
}

export interface AnalysisItem {
  total: number;
  used: number;
}

export interface Analysis {
  categories: Record<string, AnalysisItem>;
  suggesters: Record<string, AnalysisItem>;
}

export interface APIResponse {
  projects: any[][];
  cases: any[][];
  payments: any[][];
  settings: Settings;
  analysis: Analysis;
}

export type PageType = 'entry' | 'summary' | 'budget' | 'case' | 'pay' | 'settings';
