import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
});

export interface Block {
  id: string;
  type: "text" | "table" | "code";
  content: string;
  position: number;
}

export interface Page {
  _id: string;
  title: string;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
}

export const pageApi = {
  getAll: () => api.get<Page[]>("/pages").then((res) => res.data),
  getById: (id: string) =>
    api.get<Page>(`/pages/${id}`).then((res) => res.data),
  create: (title: string) =>
    api.post<Page>("/pages", { title }).then((res) => res.data),
  update: (id: string, data: Partial<Page>) =>
    api.put<Page>(`/pages/${id}`, data).then((res) => res.data),
  delete: (id: string) => api.delete(`/pages/${id}`).then((res) => res.data),
};
