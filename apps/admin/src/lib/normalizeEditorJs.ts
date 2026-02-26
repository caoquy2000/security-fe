export type EditorJsData = {
  time?: number;
  blocks: Array<any>;
  version?: string;
};

export function normalizeEditorJsData(input: any): EditorJsData {
  const fallback: EditorJsData = {
    time: Date.now(),
    version: "2.x",
    blocks: [{ type: "paragraph", data: { text: "" } }],
  };

  // nếu input là string JSON (từ API về)
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch {
      return fallback;
    }
  }

  if (!input || typeof input !== "object") return fallback;

  const rawBlocks = Array.isArray((input as any).blocks) ? (input as any).blocks : [];

  const blocks = rawBlocks
    .map((b: any) => {
      if (!b || typeof b !== "object") return null;

      const type = typeof b.type === "string" ? b.type : "paragraph";
      const data = b.data && typeof b.data === "object" ? b.data : {};

      // Normalize theo tool bạn đang dùng
      if (type === "paragraph") {
        return { type, data: { text: typeof data.text === "string" ? data.text : "" } };
      }

      if (type === "header") {
        const level = typeof data.level === "number" ? data.level : 2;
        return {
          type,
          data: {
            text: typeof data.text === "string" ? data.text : "",
            level: Math.min(6, Math.max(1, level)),
          },
        };
      }

      if (type === "list") {
        return {
          type,
          data: {
            style: data.style === "ordered" ? "ordered" : "unordered",
            items: Array.isArray(data.items) ? data.items.map((x: any) => String(x ?? "")) : [],
          },
        };
      }

      if (type === "quote") {
        return {
          type,
          data: {
            text: typeof data.text === "string" ? data.text : "",
            caption: typeof data.caption === "string" ? data.caption : "",
            alignment: data.alignment === "center" ? "center" : "left",
          },
        };
      }

      if (type === "image") {
        const url = data?.file?.url || data?.url || "";
        return {
          type,
          data: {
            file: url ? { url } : undefined,
            url: url || undefined,
            caption: typeof data.caption === "string" ? data.caption : "",
            withBorder: !!data.withBorder,
            withBackground: !!data.withBackground,
            stretched: !!data.stretched,
          },
        };
      }

      // tool khác: giữ nguyên data (nếu có)
      return { type, data };
    })
    .filter(Boolean) as any[];

  return {
    time: typeof (input as any).time === "number" ? (input as any).time : Date.now(),
    version: typeof (input as any).version === "string" ? (input as any).version : "2.x",
    blocks: blocks.length ? blocks : fallback.blocks,
  };
}