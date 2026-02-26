import edjsHTML from "editorjs-html";
import DOMPurify from "dompurify";

export type EditorJsData = {
  time?: number;
  blocks: Array<any>;
  version?: string;
};

// Renderers cho các block bạn đang dùng (paragraph/header/list/quote/image)
const parser = edjsHTML({
  paragraph: (block: any) => `<p>${block?.data?.text ?? ""}</p>`,
  header: (block: any) => {
    const level = Number(block?.data?.level || 2);
    const safeLevel = Math.min(6, Math.max(1, level));
    return `<h${safeLevel}>${block?.data?.text ?? ""}</h${safeLevel}>`;
  },
  list: (block: any) => {
    const style = block?.data?.style === "ordered" ? "ol" : "ul";
    const items: any[] = Array.isArray(block?.data?.items) ? block.data.items : [];
    const li = items.map((x) => `<li>${String(x ?? "")}</li>`).join("");
    return `<${style}>${li}</${style}>`;
  },
  quote: (block: any) => {
    const text = block?.data?.text ?? "";
    const caption = block?.data?.caption ?? "";
    return `<blockquote><p>${text}</p>${caption ? `<cite>${caption}</cite>` : ""}</blockquote>`;
  },
  image: (block: any) => {
    const url = block?.data?.file?.url || block?.data?.url || "";
    const caption = block?.data?.caption || "";
    if (!url) return "";
    return `
      <figure>
        <img src="${url}" alt="${caption || "image"}" />
        ${caption ? `<figcaption>${caption}</figcaption>` : ""}
      </figure>
    `;
  },
});

function ensureObjectData(input: any): EditorJsData {
  // nếu API trả string JSON -> parse
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch {
      return { blocks: [] };
    }
  }

  if (!input || typeof input !== "object") return { blocks: [] };

  const blocks = Array.isArray(input.blocks) ? input.blocks : [];

  // normalize tối thiểu để tránh "paragraph invalid"
  const normalized = blocks
    .map((b: any) => {
      if (!b || typeof b !== "object") return null;
      const type = typeof b.type === "string" ? b.type : "paragraph";
      const data = b.data && typeof b.data === "object" ? b.data : {};

      if (type === "paragraph") {
        return { ...b, type, data: { text: typeof data.text === "string" ? data.text : "" } };
      }
      return { ...b, type, data };
    })
    .filter(Boolean);

  return {
    time: typeof input.time === "number" ? input.time : Date.now(),
    version: typeof input.version === "string" ? input.version : "2.x",
    blocks: normalized as any[],
  };
}

export function editorJsToSafeHtml(input: any): string {
  const data = ensureObjectData(input);

  let parsed: any;
  try {
    parsed = parser.parse(data as any);
  } catch (e) {
    console.error("editorJsToSafeHtml parse error:", e, data);
    return "";
  }

  // ✅ parser.parse có thể trả array | string | object
  const html =
    Array.isArray(parsed)
      ? parsed.join("")
      : typeof parsed === "string"
      ? parsed
      : parsed && typeof parsed === "object"
      ? Object.values(parsed).join("")
      : "";

  // sanitize (XSS – chèn script độc hại)
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}