import type { ReactNode } from "react";

/**
 * Мини-рендерер разметки для текстов квестов:
 *  - пустая строка разделяет абзацы;
 *  - **жирный** — выделение ключевых фактов;
 *  - `код` — инлайновый код;
 *  - ``` ... ``` — блок кода;
 *  - строки, начинающиеся с "- ", собираются в список.
 *  - строки вида | колонка | колонка | собираются в таблицу.
 */
export function RichText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return <>{parseBlocks(text, className)}</>;
}

type Block =
  | { type: "para"; text: string }
  | { type: "code"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableDivider(line: string): boolean {
  const cells = parseTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function splitBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let buffer: string[] = [];
  let codeBuffer: string[] | null = null;
  let listBuffer: string[] | null = null;

  const flushPara = () => {
    const t = buffer.join("\n").trim();
    if (t) blocks.push({ type: "para", text: t });
    buffer = [];
  };
  const flushList = () => {
    if (listBuffer && listBuffer.length > 0) {
      blocks.push({ type: "list", items: listBuffer });
    }
    listBuffer = null;
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (codeBuffer !== null) {
      if (line.trim().startsWith("```")) {
        blocks.push({ type: "code", text: codeBuffer.join("\n") });
        codeBuffer = null;
      } else {
        codeBuffer.push(line);
      }
      continue;
    }
    if (line.trim().startsWith("```")) {
      flushPara();
      flushList();
      codeBuffer = [];
      continue;
    }
    if (
      line.trim().startsWith("|") &&
      lineIndex + 1 < lines.length &&
      isTableDivider(lines[lineIndex + 1])
    ) {
      flushPara();
      flushList();
      const headers = parseTableRow(line);
      const rows: string[][] = [];
      lineIndex += 2;
      while (
        lineIndex < lines.length &&
        lines[lineIndex].trim().startsWith("|")
      ) {
        rows.push(parseTableRow(lines[lineIndex]));
        lineIndex += 1;
      }
      lineIndex -= 1;
      blocks.push({ type: "table", headers, rows });
      continue;
    }
    if (/^\s*-\s+/.test(line)) {
      flushPara();
      listBuffer = listBuffer ?? [];
      listBuffer.push(line.replace(/^\s*-\s+/, ""));
      continue;
    }
    if (line.trim() === "") {
      flushPara();
      flushList();
      continue;
    }
    flushList();
    buffer.push(line);
  }
  if (codeBuffer !== null) blocks.push({ type: "code", text: codeBuffer.join("\n") });
  flushPara();
  flushList();
  return blocks;
}

function parseBlocks(text: string, className: string): ReactNode[] {
  return splitBlocks(text).map((block, i) => {
    if (block.type === "code") {
      return (
        <pre
          key={i}
          className="mb-3 overflow-x-auto rounded-xl bg-night-ink p-4 font-mono text-caption leading-relaxed text-paper-white last:mb-0"
        >
          <code>{block.text}</code>
        </pre>
      );
    }
    if (block.type === "list") {
      return (
        <ul key={i} className={`${className} mb-3 grid gap-1.5 pl-1 last:mb-0`}>
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-2">
              <span className="mt-[2px] shrink-0 text-eager-green" aria-hidden>
                ●
              </span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (block.type === "table") {
      return (
        <div key={i} className="mb-3 overflow-x-auto rounded-xl border-2 border-[#e5e5e5] last:mb-0">
          <table className="w-full min-w-max border-collapse text-left text-caption">
            <thead className="bg-[#f4f4f4]">
              <tr>
                {block.headers.map((header, columnIndex) => (
                  <th
                    key={columnIndex}
                    className="border-b-2 border-[#e5e5e5] px-3 py-2 font-bold text-charcoal"
                  >
                    {parseInline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="even:bg-[#fafafa]">
                  {block.headers.map((_, columnIndex) => (
                    <td
                      key={columnIndex}
                      className="border-b border-[#eeeeee] px-3 py-2 font-medium text-pencil-gray last:border-b-0"
                    >
                      {parseInline(row[columnIndex] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <p key={i} className={`${className} mb-3 last:mb-0`}>
        {parseInline(block.text)}
      </p>
    );
  });
}

function parseInline(text: string): ReactNode[] {
  // Разбиваем по **жирному** и `коду`, сохраняя разделители
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong
          key={i}
          className="font-bold text-charcoal underline decoration-fresh-leaf decoration-2 underline-offset-4"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded-md bg-[#f0f0f0] px-1.5 py-0.5 font-mono text-[0.88em] font-bold text-night-ink"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
