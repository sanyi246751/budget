import { APIResponse, Settings } from '../types';

const API_URL = (import.meta as any).env.VITE_GAS_API_URL;

if (!API_URL) {
  console.error("VITE_GAS_API_URL is not defined in environment variables.");
}

export const apiService = {
  async fetchAll(): Promise<APIResponse> {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "readAll" })
    });
    if (!res.ok) throw new Error("Failed to fetch data");
    return res.json();
  },

  async addProject(data: {
    name: string;
    amount: string;
    category: string;
    suggestBy: string;
    staff: string;
    content: string;
    fileDataList: { data: string; type: string }[];
    isAutoCase: boolean;
  }) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "add", ...data })
    });
    return res.json();
  },

  async updateProject(data: any) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "updateProject", ...data })
    });
    return res.json();
  },

  async deleteProject(name: string) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "deleteProject", name })
    });
    return res.json();
  },

  async createCase(data: {
    newName: string;
    budget: number;
    vendor: string;
    status: string;
    total: number;
    oldName: string;
  }) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "updateFullCase", ...data })
    });
    return res.json();
  },

  async assignProject(projectName: string, tenderName: string) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "assignProject",
        projectName,
        tenderName
      })
    });
    return res.json();
  },

  async deleteCase(name: string) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "deleteCase", name })
    });
    return res.json();
  },

  async saveSettings(config: Settings) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "saveSettings", config })
    });
    return res.json();
  },

  async savePayment(data: {
    tenderName: string;
    stage: string;
    amount: string;
    date: string;
    invoice: string;
  }) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "savePayment", ...data })
    });
    return res.json();
  },

  async deletePayment(id: string) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "deletePayment", id })
    });
    return res.json();
  }
};
