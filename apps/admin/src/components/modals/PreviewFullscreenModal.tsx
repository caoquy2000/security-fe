"use client";

import React from "react";

export default function PreviewFullscreenModal({
  open,
  title,
  excerpt,
  thumbnailUrl,
  html,
  onClose,
}: {
  open: boolean;
  title: string;
  excerpt: string;
  thumbnailUrl?: string;
  html: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />

      {/* Fullscreen sheet */}
      <div className="absolute inset-0 flex flex-col bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
          <div>
            <div className="text-sm font-semibold text-black">Preview</div>
            <div className="text-xs text-black/60">
              Xem trước nội dung hiển thị ngoài website
            </div>
          </div>

          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/15 bg-white hover:bg-black/5"
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-5 py-6">
            {/* Article header preview */}
            <h1 className="text-3xl font-extrabold leading-tight text-black">
              {title || "(Chưa có tiêu đề)"}
            </h1>

            {excerpt ? (
              <p className="mt-3 text-base text-black/70">{excerpt}</p>
            ) : null}

            {thumbnailUrl ? (
              <div className="mt-5 overflow-hidden rounded-2xl border border-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnailUrl}
                  alt="thumbnail"
                  className="h-auto w-full object-cover"
                />
              </div>
            ) : null}

            <div className="my-6 border-t border-black/10" />

            {/* Rendered HTML */}
            <article
              className={[
                "text-[15px] leading-7 text-black",
                // style cho HTML output (không cần typography plugin)
                "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3",
                "[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3",
                "[&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2",
                "[&_p]:my-3",
                "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6",
                "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6",
                "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-black/20 [&_blockquote]:pl-4 [&_blockquote]:text-black/70",
                "[&_a]:text-black [&_a]:underline [&_a]:underline-offset-4",
                "[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-black/10",
                "[&_figure]:my-4",
                "[&_figcaption]:mt-2 [&_figcaption]:text-xs [&_figcaption]:text-black/60",
              ].join(" ")}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}