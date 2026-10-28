import React, { useEffect, useRef } from "react";
import {
  Undo2, Redo2, Bold, Italic, Strikethrough, Underline, Eraser,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote,
} from "lucide-react";

const GROUPS = [
  [
    { icon: Undo2, title: "Bekor qilish", cmd: "undo" },
    { icon: Redo2, title: "Qaytarish", cmd: "redo" },
  ],
  [
    { icon: Bold, title: "Qalin", cmd: "bold" },
    { icon: Italic, title: "Qiya", cmd: "italic" },
    { icon: Strikethrough, title: "Ustidan chizish", cmd: "strikeThrough" },
    { icon: Underline, title: "Tagiga chizish", cmd: "underline" },
    { icon: Eraser, title: "Formatni tozalash", cmd: "removeFormat" },
  ],
  [
    { icon: AlignLeft, title: "Chapga", cmd: "justifyLeft" },
    { icon: AlignCenter, title: "Markazga", cmd: "justifyCenter" },
    { icon: AlignRight, title: "O'ngga", cmd: "justifyRight" },
    { icon: AlignJustify, title: "Ikki tomonga", cmd: "justifyFull" },
  ],
  [
    { icon: List, title: "Ro'yxat", cmd: "insertUnorderedList" },
    { icon: ListOrdered, title: "Raqamli ro'yxat", cmd: "insertOrderedList" },
    { icon: Quote, title: "Sitata", cmd: "formatBlock", arg: "blockquote" },
  ],
];

export default function TextEditor({ value = "", onChange }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const run = (cmd, arg = null) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange?.(ref.current.innerHTML);
  };

  return (
    <div>
      <div
        style={{
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4,
          padding: "8px 12px", borderBottom: "1px solid #4b5563",
        }}
      >
        {GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && (
              <span style={{ width: 1, height: 22, background: "#4b5563", margin: "0 8px" }} />
            )}
            {group.map(({ icon: Icon, title, cmd, arg }) => (
              <button
                key={cmd}
                type="button"
                title={title}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(cmd, arg)}
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 32, borderRadius: 6, border: "none",
                  background: "transparent", color: "inherit", cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Icon size={18} />
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange?.(ref.current.innerHTML)}
        style={{ minHeight: 180, padding: 12, outline: "none", color: "inherit" }}
      />
    </div>
  );
}