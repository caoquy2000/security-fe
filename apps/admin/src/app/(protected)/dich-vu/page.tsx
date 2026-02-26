"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  adminListArticles,
  adminCreateArticle,
  adminUpdateArticle,
  adminGetArticle,
  adminPublishArticle,
  adminUnpublishArticle,
  adminDeleteArticle,
  Article,
} from "@/lib/articles";
import EditorJs, { EditorJsHandle } from "@/components/editor/EditorJS";
import { editorJsToSafeHtml } from "@/lib/editorjsToHtml";
import PreviewFullscreenModal from "@/components/modals/PreviewFullscreenModal";

type Status = "" | "draft" | "published" | "archived";

function StatusBadge({ status }: { status: string }) {
  const isPub = status === "published";
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border",
        isPub ? "bg-black text-white border-black" : "bg-white text-black border-black/20",
      ].join(" ")}
    >
      <span className={["h-2 w-2 rounded-full", isPub ? "bg-white" : "bg-black/40"].join(" ")} />
      {status}
    </span>
  );
}

function IconBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/15 bg-white hover:bg-black/5 disabled:opacity-50",
        className,
      ].join(" ")}
    />
  );
}

function PageBtn({
  active,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...rest}
      className={[
        "h-9 w-9 rounded-full text-sm font-semibold border",
        active ? "bg-black text-white border-black" : "bg-white text-black border-black/15 hover:bg-black/5",
        rest.disabled ? "opacity-50" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
}) {
  // windowed pagination: hiển thị tối đa 7 nút số
  const nums = useMemo(() => {
    const max = 7;
    if (pages <= max) return Array.from({ length: pages }, (_, i) => i + 1);
    const left = Math.max(1, page - 2);
    const right = Math.min(pages, page + 2);

    const arr: number[] = [];
    arr.push(1);
    if (left > 2) arr.push(-1); // ellipsis marker
    for (let i = left; i <= right; i++) if (i !== 1 && i !== pages) arr.push(i);
    if (right < pages - 1) arr.push(-1);
    if (pages !== 1) arr.push(pages);
    return arr;
  }, [page, pages]);

  return (
    <div className="flex items-center gap-2">
      <IconBtn onClick={() => onPage(1)} disabled={page <= 1} aria-label="First">
        «
      </IconBtn>
      <IconBtn onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Prev">
        ‹
      </IconBtn>

      <div className="flex items-center gap-2">
        {nums.map((n, idx) =>
          n === -1 ? (
            <span key={`e-${idx}`} className="px-1 text-black/40">
              …
            </span>
          ) : (
            <PageBtn key={n} active={n === page} onClick={() => onPage(n)}>
              {n}
            </PageBtn>
          )
        )}
      </div>

      <IconBtn onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next">
        ›
      </IconBtn>
      <IconBtn onClick={() => onPage(pages)} disabled={page >= pages} aria-label="Last">
        »
      </IconBtn>
    </div>
  );
}

function Modal({
  open,
  title,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        {/* container */}
        <div
          className={[
            "w-full max-w-4xl rounded-2xl border border-black/10 bg-white shadow-xl",
            "flex flex-col",
            // giới hạn chiều cao modal theo viewport
            "max-h-[calc(100vh-2rem)]",
          ].join(" ")}
        >
          {/* header sticky */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white px-5 py-4">
            <h2 className="text-base font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/15 bg-white hover:bg-black/5"
              aria-label="Close"
              type="button"
            >
              ✕
            </button>
          </div>

          {/* body scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {children}
          </div>

          {/* footer sticky (optional) */}
          {footer ? (
            <div className="sticky bottom-0 z-10 border-t border-black/10 bg-white px-5 py-4">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ServicesAsArticlesPage() {

  const editorRef = useRef<EditorJsHandle | null>(null);

  // list state
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Article[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("");

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // modal preview 
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    thumbnail_url: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    canonical_url: "",
  });

  const [content, setContent] = useState<any>();
  console.log('Content editor -> ', content)

  const fetchList = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminListArticles({
        page,
        limit: meta.limit,
        status: status || undefined,
        search: search || undefined,
      });
      setRows(res.data);
      setMeta(res.meta);
    } catch (e: any) {
      alert(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    fetchList(1);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      excerpt: "",
      thumbnail_url: "",
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      canonical_url: "",
    });
    const init = { blocks: [{ type: "paragraph", data: { text: "" } }] };
    setContent(init);
    setModalOpen(true);
    setTimeout(() => editorRef.current?.renderNow(init), 0);
  };

  const openEdit = async (id: string) => {
    setEditingId(id);
    setModalOpen(true);
    setSaving(true);
    try {
      const a = await adminGetArticle(id);
      setForm({
        title: a.title || "",
        slug: a.slug || "",
        excerpt: a.excerpt || "",
        thumbnail_url: a.thumbnail_url || "",
        meta_title: a.meta_title || "",
        meta_description: a.meta_description || "",
        meta_keywords: a.meta_keywords || "",
        canonical_url: a.canonical_url || "",
      });
      // content should be JSON object (not base64). Nếu backend trả base64 thì cần fix DTO ở backend.
      const data = a.content ?? { blocks: [{ type: "paragraph", data: { text: "" } }] };
      setContent(data);

      setTimeout(() => editorRef.current?.renderNow(data), 0);
    } catch (e: any) {
      alert(e?.message || "Load article failed");
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!form.title.trim()) return alert("Title không được trống");
    setSaving(true);
    try {
      if (!editingId) {
        await adminCreateArticle({ ...form, content });
      } else {
        await adminUpdateArticle(editingId, { ...form, content });
      }
      setModalOpen(false);
      await fetchList(meta.page);
    } catch (e: any) {
      alert(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (a: Article) => {
    try {
      if (a.status === "published") await adminUnpublishArticle(a.id);
      else await adminPublishArticle(a.id);
      await fetchList(meta.page);
    } catch (e: any) {
      alert(e?.message || "Publish failed");
    }
  };

  const remove = async (a: Article) => {
    if (!confirm(`Xoá bài "${a.title}"?`)) return;
    try {
      await adminDeleteArticle(a.id);
      await fetchList(Math.min(meta.page, meta.pages));
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  };

  const openPreview = async () => {
    const latest = await editorRef.current?.saveNow();
    const html = editorJsToSafeHtml(latest || content);
    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Dịch vụ (Articles)</h1>
          <p className="mt-1 text-sm text-black/60">
            Trang này đang quản lý bài viết dịch vụ (article) từ backend: draft/published, SEO + nội dung WYSIWYG.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + Thêm bài viết
        </button>
      </div>

      {/* Toolbar (căn Reset chuẩn) */}
      <div className="mb-4 rounded-2xl border border-black/10 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_auto_auto] md:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Tìm kiếm</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo title/excerpt/slug..."
              className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as Status);
              }}
              className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black"
            >
              <option value="">Tất cả</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <button
            onClick={() => fetchList(1)}
            className="h-10 rounded-xl border border-black/20 bg-white px-4 text-sm font-semibold hover:bg-black/5"
          >
            Tìm
          </button>

          <button
            onClick={resetFilters}
            className="h-10 rounded-xl border border-black/20 bg-white px-4 text-sm font-semibold hover:bg-black/5"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
        <div className="border-b border-black/10 px-4 py-3 text-sm text-black/70">
          Tổng: <span className="font-semibold text-black">{meta.total}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full">
            <thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-black/60">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-black/60" colSpan={5}>
                    Đang tải...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-black/60" colSpan={5}>
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : (
                rows.map((a) => (
                  <tr key={a.id} className="border-t border-black/10 hover:bg-black/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-black">{a.title}</div>
                      <div className="mt-0.5 line-clamp-1 text-xs text-black/60">{a.excerpt}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-black/70">{a.slug}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-black/70">
                      {new Date(a.updated_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(a.id)}
                          className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5"
                        >
                          Sửa
                        </button>

                        <button
                          onClick={() => togglePublish(a)}
                          className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5"
                        >
                          {a.status === "published" ? "Unpublish" : "Publish"}
                        </button>

                        <button
                          onClick={() => remove(a)}
                          className="rounded-xl border border-red-500/30 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination: mũi tên + số bo tròn */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 px-4 py-3">
          <div className="text-sm text-black/70">
            Trang <b className="text-black">{meta.page}</b> / <b className="text-black">{meta.pages}</b>
          </div>

          <Pagination
            page={meta.page}
            pages={meta.pages}
            onPage={(p) => fetchList(Math.max(1, Math.min(meta.pages, p)))}
          />
        </div>
      </div>

      {/* Modal */}
      <PreviewFullscreenModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={form.title}
        excerpt={form.excerpt}
        thumbnailUrl={form.thumbnail_url}
        html={previewHtml}
      />
      <Modal
        open={modalOpen}
        title={editingId ? "Chỉnh sửa bài viết" : "Tạo bài viết"}
        onClose={() => setModalOpen(false)}
        footer={
           <div className="flex justify-end gap-2">
            <button
              onClick={openPreview}
              className="h-10 rounded-xl border border-black/20 bg-white px-4 text-sm font-semibold hover:bg-black/5"
              type="button"
            >
              Preview
            </button>

            <button
              onClick={() => setModalOpen(false)}
              className="h-10 rounded-xl border border-black/20 bg-white px-4 text-sm font-semibold hover:bg-black/5"
              type="button"
            >
              Huỷ
            </button>

            <button
              onClick={save}
              disabled={saving}
              className="h-10 rounded-xl bg-black px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              type="button"
            >
              {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo bài"}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          {/* Basic fields */}
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-black/60">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-black/60">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-black/60">Excerpt</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-black/60">Thumbnail URL</label>
                <input
                  value={form.thumbnail_url}
                  onChange={(e) => setForm((p) => ({ ...p, thumbnail_url: e.target.value }))}
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* Editor.js */}
          <EditorJs 
            ref={editorRef}
            initialValue={content}
            onChange={setContent} 
          />

          {/* SEO */}
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="mb-2 text-sm font-semibold">SEO</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-black/60">Meta title</label>
                <input
                  value={form.meta_title}
                  onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))}
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-black/60">Canonical URL</label>
                <input
                  value={form.canonical_url}
                  onChange={(e) => setForm((p) => ({ ...p, canonical_url: e.target.value }))}
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-black/60">Meta description</label>
                <textarea
                  value={form.meta_description}
                  onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-black/60">Meta keywords</label>
                <input
                  value={form.meta_keywords}
                  onChange={(e) => setForm((p) => ({ ...p, meta_keywords: e.target.value }))}
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}