import { apiFetch } from "./api";

export type ArticleStatus = "draft" | "published" | "archived";

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail_url: string;
  status: ArticleStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;

  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;

  content?: any; // Editor.js JSON
};

export type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type AdminBody = {
  title: string;
  slug?: string;
  excerpt: string;
  content: any;
  thumbnail_url: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
};

export function adminListArticles(params: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}) {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page));
  qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  return apiFetch<Paginated<Article>>(`/admin/articles?${qs.toString()}`);
}

export function adminGetArticle(id: string) {
  return apiFetch<Article>(`/admin/articles/${id}`);
}

export function adminCreateArticle(body: AdminBody) {
  return apiFetch<Article>(`/admin/articles`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function adminUpdateArticle(id: string, body: AdminBody) {
  return apiFetch<Article>(`/admin/articles/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function adminPublishArticle(id: string) {
  return apiFetch<Article>(`/admin/articles/${id}/publish`, { method: "POST" });
}

export function adminUnpublishArticle(id: string) {
  return apiFetch<Article>(`/admin/articles/${id}/unpublish`, { method: "POST" });
}

export function adminDeleteArticle(id: string) {
  return apiFetch<void>(`/admin/articles/${id}`, { method: "DELETE" });
}