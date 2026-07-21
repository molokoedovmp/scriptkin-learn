"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/lib/types";
import type { SocialPost } from "@/lib/social";
import { POST_TAGS, type PostTagId } from "@/lib/post-tags";
import { PostTags } from "./PostTags";
import { RichPostContent } from "./RichPostContent";

const MAX_LENGTH = 5000;

export function PostsManager({
  user,
  initialPosts,
}: {
  user: SessionUser;
  initialPosts: SocialPost[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<PostTagId[]>([]);
  const [editing, setEditing] = useState<SocialPost | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("compose") === "1") {
      openCreate();
    }
  }, []);

  function openCreate() {
    setEditing(null);
    setContent("");
    setTags([]);
    setError("");
    setModalOpen(true);
  }

  function openEdit(post: SocialPost) {
    setEditing(post);
    setContent(post.content);
    setTags(post.tags as PostTagId[]);
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (!loading) setModalOpen(false);
  }

  async function save() {
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/social/posts", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing ? { postId: editing.id, content, tags } : { content, tags }
        ),
      });
      const data = (await response.json()) as {
        ok: boolean;
        post?: SocialPost;
        error?: string;
      };
      if (!data.ok || !data.post) {
        setError(data.error ?? "Не удалось сохранить публикацию.");
        return;
      }
      setPosts((current) =>
        editing
          ? current.map((post) => (post.id === editing.id ? data.post! : post))
          : [data.post!, ...current]
      );
      setModalOpen(false);
      setContent("");
      setTags([]);
      setEditing(null);
    } catch {
      setError("Не удалось связаться с сервером.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Удалить этот пост?")) return;
    const response = await fetch("/api/social/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: id }),
    });
    if (response.ok) {
      setPosts((current) => current.filter((post) => post.id !== id));
    }
  }

  return (
    <section className="rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-5 sm:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-heading-sm font-black text-charcoal">Лента</h2>
          <p className="mt-1 text-[15px] font-medium text-pencil-gray">
            Публикации твои и друзей. Общая лента находится в сообществе.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/community" className="inline-flex items-center rounded-xl border-2 border-[#dedede] px-4 py-3 text-caption font-extrabold uppercase text-spark-blue hover:bg-[#f7f8fa]">
            Сообщество
          </Link>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-eager-green px-5 py-3 text-caption font-extrabold uppercase text-paper-white shadow-[0_4px_0_#3f9900]">
            <span className="text-lg" aria-hidden="true">＋</span>
            Создать публикацию
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl bg-[#f7f8fa] p-10 text-center">
          <p className="text-4xl">✍️</p>
          <p className="mt-3 font-extrabold text-charcoal">Публикаций пока нет</p>
          <button onClick={openCreate} className="mt-3 font-extrabold text-spark-blue hover:underline">Написать первую</button>
        </div>
      ) : (
        <div className="divide-y divide-[#ededed]">
          {posts.map((post) => (
            <article key={post.id} className="py-6 first:pt-0 last:pb-0">
              <div className="flex gap-3">
                <Link href={`/account/users/${post.authorId}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff4cf] font-black text-[#a67800]">
                  {post.authorName.charAt(0).toUpperCase()}
                </Link>
                <div className="min-w-0 grow">
                  <div className="flex justify-between gap-3">
                    <div>
                      <Link href={`/account/users/${post.authorId}`} className="font-extrabold text-charcoal hover:text-spark-blue">{post.authorName}</Link>
                      <p className="text-caption font-bold text-faded-gray">{format(post.createdAt)}</p>
                    </div>
                    {post.isOwn && (
                      <div className="flex items-start gap-3">
                        <button onClick={() => openEdit(post)} className="text-caption font-bold text-spark-blue hover:underline">Редактировать</button>
                        <button onClick={() => void remove(post.id)} className="text-caption font-bold text-faded-gray hover:text-[#d63b3b]">Удалить</button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3"><RichPostContent content={post.content} /></div>
                  <div className="mt-4"><PostTags tags={post.tags} linked /></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <PostEditorModal
          user={user}
          content={content}
          selectedTags={tags}
          editing={Boolean(editing)}
          loading={loading}
          error={error}
          onChange={setContent}
          onTagsChange={setTags}
          onClose={closeModal}
          onSave={() => void save()}
        />
      )}
    </section>
  );
}

function PostEditorModal({
  user,
  content,
  selectedTags,
  editing,
  loading,
  error,
  onChange,
  onTagsChange,
  onClose,
  onSave,
}: {
  user: SessionUser;
  content: string;
  selectedTags: PostTagId[];
  editing: boolean;
  loading: boolean;
  error: string;
  onChange: (value: string) => void;
  onTagsChange: (tags: PostTagId[]) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValidHtmlRef = useRef("");
  const closeRef = useRef(onClose);
  const saveRef = useRef(onSave);
  closeRef.current = onClose;
  saveRef.current = onSave;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (editorRef.current) {
      const html = markdownToEditorHtml(content);
      editorRef.current.innerHTML = html;
      lastValidHtmlRef.current = html;
      editorRef.current.focus();
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") saveRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function syncFromEditor() {
    const editor = editorRef.current;
    if (!editor) return;
    const markdown = editorHtmlToMarkdown(editor);
    if (markdown.length > MAX_LENGTH) {
      editor.innerHTML = lastValidHtmlRef.current;
      placeCaretAtEnd(editor);
      return;
    }
    lastValidHtmlRef.current = editor.innerHTML;
    onChange(markdown);
  }

  function command(name: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
    syncFromEditor();
  }

  function insertFormattedHtml(tag: "code" | "pre") {
    const selection = window.getSelection();
    const selected = selection?.toString() || (tag === "code" ? "SELECT" : "SELECT *\nFROM table_name;");
    const html = tag === "code"
      ? `<code>${escapeEditorHtml(selected)}</code>`
      : `<pre><code data-language="sql">${escapeEditorHtml(selected)}</code></pre><p><br></p>`;
    command("insertHTML", html);
  }

  function createLink() {
    const selection = window.getSelection();
    const savedRange = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
    const url = window.prompt("Адрес ссылки", "https://");
    if (!url || !/^https?:\/\//i.test(url)) return;
    if (savedRange && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
    if (selection?.toString()) command("createLink", url);
    else command("insertHTML", `<a href="${escapeEditorHtml(url)}">${escapeEditorHtml(url)}</a>`);
  }

  const tools = [
    { label: "B", title: "Жирный", action: () => command("bold") },
    { label: "I", title: "Курсив", action: () => command("italic") },
    { label: "H2", title: "Заголовок", action: () => command("formatBlock", "h2") },
    { label: "`код`", title: "Код в строке", action: () => insertFormattedHtml("code") },
    { label: "</>", title: "Блок SQL-кода", action: () => insertFormattedHtml("pre") },
    { label: "•", title: "Маркированный список", action: () => command("insertUnorderedList") },
    { label: "1.", title: "Нумерованный список", action: () => command("insertOrderedList") },
    { label: "❝", title: "Цитата", action: () => command("formatBlock", "blockquote") },
    { label: "🔗", title: "Ссылка", action: createLink },
    { label: "Tx", title: "Убрать форматирование", action: () => command("removeFormat") },
  ];

  function toggleTag(tag: PostTagId) {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((item) => item !== tag));
    } else if (selectedTags.length < 3) {
      onTagsChange([...selectedTags, tag]);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-night-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="post-editor-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex max-h-[94vh] w-full max-w-[780px] flex-col overflow-hidden rounded-t-[24px] bg-paper-white shadow-2xl sm:rounded-[24px]">
        <div className="flex items-center justify-between border-b-2 border-[#ececef] px-5 py-4 sm:px-6">
          <div>
            <p className="text-caption font-extrabold uppercase tracking-wide text-[#a67800]">{editing ? "Редактирование" : "Новая публикация"}</p>
            <h2 id="post-editor-title" className="text-subheading font-black text-charcoal">{editing ? "Изменить публикацию" : `Публикация от имени ${user.name}`}</h2>
          </div>
          <button onClick={onClose} aria-label="Закрыть редактор" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f2f5] text-xl font-black text-pencil-gray">×</button>
        </div>

        <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
          <p className="mb-2 text-caption font-extrabold uppercase text-pencil-gray">Оформление</p>
          <div className="flex flex-wrap gap-1 rounded-t-xl border-2 border-b-0 border-[#dedede] bg-[#f7f8fa] p-2">
            {tools.map((tool) => (
              <button
                key={tool.title}
                type="button"
                title={tool.title}
                aria-label={tool.title}
                onMouseDown={(event) => event.preventDefault()}
                onClick={tool.action}
                className="flex min-h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-caption font-extrabold text-charcoal hover:bg-paper-white hover:text-spark-blue hover:shadow-sm"
              >
                {tool.label}
              </button>
            ))}
          </div>
          <div
            ref={editorRef}
            id="post-content"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            data-placeholder="Напиши публикацию…"
            onInput={syncFromEditor}
            onPaste={(event) => {
              event.preventDefault();
              document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
              syncFromEditor();
            }}
            className="post-rich-editor min-h-[280px] w-full overflow-y-auto rounded-b-xl border-2 border-[#dedede] bg-paper-white p-4 text-body font-medium leading-relaxed text-charcoal outline-none focus:border-spark-blue"
          />
          <p className="mt-2 text-caption font-bold text-faded-gray">Форматирование видно прямо в редакторе. Выдели текст и нажми кнопку сверху. Ctrl/⌘ + Enter — сохранить.</p>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-caption font-extrabold uppercase text-pencil-gray">Теги публикации</p>
              <span className="text-caption font-bold text-faded-gray">до 3 тегов · {selectedTags.length}/3</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {POST_TAGS.map((tag) => {
                const selected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    disabled={!selected && selectedTags.length >= 3}
                    className={`rounded-full border-2 px-3 py-2 text-caption font-extrabold transition-colors disabled:opacity-35 ${selected ? "border-night-ink " + tag.className : "border-[#e1e2e6] bg-paper-white text-pencil-gray"}`}
                  >
                    {selected ? "✓ " : "#"}{tag.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-between gap-3 border-t-2 border-[#ececef] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <p className={`text-caption font-bold ${content.length > MAX_LENGTH * 0.9 ? "text-[#d63b3b]" : "text-faded-gray"}`}>{content.length}/{MAX_LENGTH}</p>
            {error && <p className="mt-1 text-caption font-bold text-[#d63b3b]">{error}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="rounded-xl px-5 py-3 text-caption font-extrabold uppercase text-pencil-gray">Отмена</button>
            <button onClick={onSave} disabled={loading || !content.trim()} className="rounded-xl bg-eager-green px-5 py-3 text-caption font-extrabold uppercase text-paper-white disabled:opacity-50">{loading ? "Сохраняю…" : editing ? "Сохранить" : "Опубликовать"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function format(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" }).format(new Date(value));
}

function markdownToEditorHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    const fence = line.match(/^```([\w-]*)\s*$/);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        code.push(lines[index]); index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(`<pre><code data-language="${escapeEditorHtml(fence[1] || "sql")}">${escapeEditorHtml(code.join("\n"))}</code></pre>`);
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push(`<h2>${inlineMarkdownToHtml(heading[2])}</h2>`);
      index += 1; continue;
    }
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, "")); index += 1;
      }
      blocks.push(`<blockquote>${inlineMarkdownToHtml(quote.join(" "))}</blockquote>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(`<li>${inlineMarkdownToHtml(lines[index].replace(/^[-*]\s+/, ""))}</li>`); index += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`); continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(`<li>${inlineMarkdownToHtml(lines[index].replace(/^\d+\.\s+/, ""))}</li>`); index += 1;
      }
      blocks.push(`<ol>${items.join("")}</ol>`); continue;
    }
    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(?:```|#{1,3}\s|>\s?|[-*]\s+|\d+\.\s+)/.test(lines[index])) {
      paragraph.push(lines[index]); index += 1;
    }
    blocks.push(`<p>${inlineMarkdownToHtml(paragraph.join("\n"))}</p>`);
  }
  return blocks.join("");
}

function inlineMarkdownToHtml(text: string) {
  return escapeEditorHtml(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

function editorHtmlToMarkdown(root: HTMLElement) {
  const serialize = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof HTMLElement)) return "";
    const children = () => Array.from(node.childNodes).map(serialize).join("");
    const tag = node.tagName.toLowerCase();
    if (tag === "br") return "\n";
    if (tag === "strong" || tag === "b") return `**${children()}**`;
    if (tag === "em" || tag === "i") return `*${children()}*`;
    if (tag === "code" && node.parentElement?.tagName.toLowerCase() !== "pre") return `\`${children()}\``;
    if (tag === "pre") {
      const language = node.querySelector("code")?.dataset.language || "sql";
      return `\n\n\`\`\`${language}\n${node.textContent ?? ""}\n\`\`\`\n\n`;
    }
    if (/^h[1-3]$/.test(tag)) return `\n\n## ${children().trim()}\n\n`;
    if (tag === "blockquote") return `\n\n${children().split("\n").map((line) => `> ${line}`).join("\n")}\n\n`;
    if (tag === "ul" || tag === "ol") {
      const ordered = tag === "ol";
      return `\n\n${Array.from(node.children).map((item, itemIndex) => `${ordered ? `${itemIndex + 1}.` : "-"} ${Array.from(item.childNodes).map(serialize).join("").trim()}`).join("\n")}\n\n`;
    }
    if (tag === "li") return children();
    if (tag === "a") {
      const href = node.getAttribute("href") ?? "";
      return /^https?:\/\//i.test(href) ? `[${children()}](${href})` : children();
    }
    if (tag === "p" || tag === "div") return `${children()}\n\n`;
    return children();
  };

  return Array.from(root.childNodes)
    .map(serialize)
    .join("")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeEditorHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function placeCaretAtEnd(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}
