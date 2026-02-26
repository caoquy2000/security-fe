"use client";

import { EditorJsData, normalizeEditorJsData } from "@/lib/normalizeEditorJs";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

export type EditorJsHandle = {
  saveNow: () => Promise<EditorJsData>;
  renderNow: (data: any) => Promise<void>;
};

type Props = {
  initialValue?: any; // chỉ dùng lúc mount (không sync liên tục)
  onChange?: (data: EditorJsData) => void; // optional (debounce)
};

const EditorJs = forwardRef<EditorJsHandle, Props>(function EditorJs(
  { initialValue, onChange },
  ref
) {
  const holderId = useMemo(
    () => `editorjs-${Math.random().toString(36).slice(2)}`,
    []
  );

  const editorRef = useRef<any>(null);
  const saveTimer = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    saveNow: async () => {
      const editor = editorRef.current;
      if (!editor) return normalizeEditorJsData(initialValue);
      const data = await editor.save();
      return normalizeEditorJsData(data);
    },
    renderNow: async (data: any) => {
      const editor = editorRef.current;
      if (!editor) return;
      await editor.render(normalizeEditorJsData(data));
    },
  }));

  useEffect(() => {
    let destroyed = false;

    (async () => {
      const EditorJS = (await import("@editorjs/editorjs")).default;
      const Header = (await import("@editorjs/header")).default;
      const List = (await import("@editorjs/list")).default;
      const Quote = (await import("@editorjs/quote")).default;
      const Paragraph = (await import("@editorjs/paragraph")).default;
      const ImageTool = (await import("@editorjs/image")).default;

      if (destroyed) return;

      const editor = new EditorJS({
        holder: holderId,
        autofocus: true,
        data: normalizeEditorJsData(initialValue),
        // inline toolbar giúp thao tác mượt hơn
        inlineToolbar: true,
        tools: {
          paragraph: {
            class: Paragraph,
            inlineToolbar: true,
          },
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              levels: [2, 3, 4],
              defaultLevel: 2,
            },
            // enable conversion từ block khác sang header (nếu tool hỗ trợ)
            conversionConfig: {
              export: "text",
              import: "text",
            },
          },
          list: {
            class: List,
            inlineToolbar: true,
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
          },
          image: {
            class: ImageTool,
            config: {
              uploader: {
                async uploadByUrl(url: string) {
                  return { success: 1, file: { url } };
                },
              },
            },
          },
        } as any,

        onChange: async () => {
          if (!onChange) return;
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(async () => {
            try {
              const data = await editor.save();
              onChange(normalizeEditorJsData(data));
            } catch {
              // ignore
            }
          }, 600);
        },
      });

      editorRef.current = editor;
    })();

    return () => {
      destroyed = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (editorRef.current) {
        editorRef.current.destroy?.();
        editorRef.current = null;
      }
    };
  }, [holderId]);

  return (
    <div className="rounded-2xl border border-black/10 bg-white overflow-hidden">
      <div className="border-b border-black/10 px-4 py-3 text-sm font-semibold">
        Nội dung
        <span className="ml-2 text-xs font-normal text-black/50">
          (Nhấn “/” để mở menu block, chọn Heading / List / Quote…)
        </span>
      </div>
      <div className="p-4">
        <div id={holderId} />
      </div>
    </div>
  );
});

export default EditorJs;