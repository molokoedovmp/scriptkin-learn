"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView, keymap } from "@codemirror/view";
import { tags } from "@lezer/highlight";

/**
 * Подсветка синтаксиса, выдержанная в палитре сайта: ключевые слова —
 * спарк-блю, названия функций/таблиц — свежая зелень, строки и числа —
 * тёплые акценты, комментарии — приглушённый лавандовый.
 */
const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#1cb0f6", fontWeight: "700" },
  { tag: [tags.name, tags.propertyName], color: "#e8ecff" },
  { tag: tags.function(tags.name), color: "#a5ed6e", fontWeight: "700" },
  { tag: tags.number, color: "#ffd76a" },
  { tag: [tags.string, tags.special(tags.string)], color: "#ffb37a" },
  { tag: tags.comment, color: "#8890b5", fontStyle: "italic" },
  { tag: tags.operator, color: "#ff9ecf" },
  { tag: tags.punctuation, color: "#8890b5" },
  { tag: tags.bool, color: "#1cb0f6", fontWeight: "700" },
]);

/** Тёмная тема редактора, подогнанная под цвет терминала night-ink */
const editorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#000437",
      color: "#f5f6ff",
      fontSize: "15px",
    },
    ".cm-scroller": {
      backgroundColor: "#000437",
    },
    ".cm-content": {
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      padding: "16px",
      caretColor: "#a5ed6e",
    },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#a5ed6e" },
    "&.cm-focused": { outline: "none" },
    ".cm-line": { lineHeight: "1.6" },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "#535a86",
      border: "none",
    },
    ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.04)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "#8890b5" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(28,176,246,0.35) !important",
    },
    ".cm-placeholder": { color: "#8890b5", fontStyle: "normal" },
    ".cm-tooltip": {
      backgroundColor: "#151b45",
      border: "1px solid #2e3570",
      borderRadius: "8px",
      overflow: "hidden",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      backgroundColor: "#1cb0f6",
      color: "#000437",
    },
    ".cm-completionLabel": { color: "inherit" },
    ".cm-completionDetail": { color: "#8890b5", fontStyle: "normal" },
  },
  { dark: true }
);

export function SqlEditor({
  value,
  onChange,
  onRun,
  schema,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Ctrl/Cmd+Enter — быстрый запуск, как в большинстве SQL-клиентов */
  onRun?: () => void;
  /** Таблица → колонки, для автодополнения полей и имён таблиц */
  schema?: Record<string, string[]>;
  placeholder?: string;
}) {
  const extensions = useMemo(() => {
    const list = [
      sql({ dialect: PostgreSQL, schema, upperCaseKeywords: true }),
      syntaxHighlighting(highlightStyle),
      editorTheme,
      EditorView.lineWrapping,
    ];
    if (onRun) {
      list.push(
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              onRun();
              return true;
            },
          },
        ])
      );
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, onRun]);

  return (
    <div className="sql-editor bg-night-ink">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme="dark"
        placeholder={placeholder}
        minHeight="140px"
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          autocompletion: true,
          closeBrackets: true,
          bracketMatching: true,
          indentOnInput: true,
        }}
        aria-label="Поле для SQL-запроса"
      />
    </div>
  );
}
