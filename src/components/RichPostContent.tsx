import type { ReactNode } from "react";

export function RichPostContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^```([\w-]*)\s*$/);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <div key={`code-${index}`} className="my-4 overflow-hidden rounded-xl border-2 border-[#202758] bg-night-ink">
          <div className="flex items-center justify-between border-b border-[#2d356c] px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-[#aeb5dc]">
            <span>{fence[1] || "код"}</span>
            <span className="text-fresh-leaf">&lt;/&gt;</span>
          </div>
          <pre className="overflow-x-auto p-4 text-[14px] leading-relaxed text-[#f5f6ff]">
            <code>{code.join("\n")}</code>
          </pre>
        </div>
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const className =
        heading[1].length === 1
          ? "mt-5 text-subheading font-black"
          : "mt-4 text-body font-black";
      blocks.push(
        <h3 key={`heading-${index}`} className={`${className} text-charcoal`}>
          {renderInline(heading[2], index)}
        </h3>
      );
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote key={`quote-${index}`} className="my-4 rounded-r-xl border-l-4 border-spark-blue bg-[#eef9ff] px-4 py-3 font-semibold italic text-[#315d71]">
          {renderInline(quote.join(" "), index)}
        </blockquote>
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={`list-${index}`} className="my-3 list-disc space-y-1 pl-6 text-body font-medium text-charcoal marker:text-eager-green">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, itemIndex)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ol key={`ordered-${index}`} className="my-3 list-decimal space-y-1 pl-6 text-body font-medium text-charcoal marker:font-black marker:text-[#7449bd]">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, itemIndex)}</li>
          ))}
        </ol>
      );
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isBlockStart(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${index}`} className="my-3 whitespace-pre-wrap break-words text-body font-medium leading-relaxed text-charcoal">
        {renderInline(paragraph.join("\n"), index)}
      </p>
    );
  }

  return <div className="rich-post -my-3">{blocks}</div>;
}

function isBlockStart(line: string) {
  return /^(?:```|#{1,3}\s|>\s?|[-*]\s+|\d+\.\s+)/.test(line);
}

function renderInline(text: string, keyPrefix: number): ReactNode[] {
  const token = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))/g;
  const result: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = token.exec(text))) {
    if (match.index > lastIndex) result.push(text.slice(lastIndex, match.index));
    const value = match[0];
    const key = `${keyPrefix}-${match.index}`;
    if (value.startsWith("**")) {
      result.push(<strong key={key} className="font-black text-charcoal">{value.slice(2, -2)}</strong>);
    } else if (value.startsWith("`")) {
      result.push(<code key={key} className="rounded-md bg-[#eef0f5] px-1.5 py-0.5 font-mono text-[0.9em] font-bold text-[#7449bd]">{value.slice(1, -1)}</code>);
    } else if (value.startsWith("*")) {
      result.push(<em key={key}>{value.slice(1, -1)}</em>);
    } else {
      const link = value.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      if (link) {
        result.push(<a key={key} href={link[2]} target="_blank" rel="noreferrer" className="font-extrabold text-spark-blue underline decoration-2 underline-offset-2">{link[1]}</a>);
      }
    }
    lastIndex = match.index + value.length;
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result;
}
