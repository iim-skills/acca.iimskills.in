// editorUtils.ts
export type FormatCommand =
  | "heading"
  | "paragraph"
  | "bold"
  | "italic"
  | "blockquote"
  | "ul"
  | "ol"
  | "link"
  | "image"
  | "code";

export const replaceSelection = (
  html: string,
  selectedText: string,
  newText: string,
  start: number,
  end: number
) => {
  return html.slice(0, start) + newText + html.slice(end);
};

export const formatText = (
  html: string,
  selectedText: string,
  command: FormatCommand,
  value: string | null = null
) => {
  let updated = html;

  // HEADINGS & PARAGRAPH
  if (command === "heading" || command === "paragraph") {
    const tag = value || "p";
    const regex = new RegExp(`^<${tag}[^>]*>[\\s\\S]*<\\/${tag}>$`, "i");
    if (regex.test(selectedText)) {
      const inner = selectedText.replace(
        new RegExp(`^<${tag}[^>]*>([\\s\\S]*)<\\/${tag}>$`, "i"),
        "$1"
      );
      updated = html.replace(selectedText, inner);
    } else {
      updated = html.replace(selectedText, `<${tag}>${selectedText}</${tag}>`);
    }
  }

  // BOLD
  else if (command === "bold") {
    if (/^<strong>[\s\S]*<\/strong>$/.test(selectedText)) {
      const inner = selectedText.replace(/^<strong>([\s\S]*)<\/strong>$/, "$1");
      updated = html.replace(selectedText, inner);
    } else {
      updated = html.replace(selectedText, `<strong>${selectedText}</strong>`);
    }
  }

  // ITALIC
  else if (command === "italic") {
    if (/^<em>[\s\S]*<\/em>$/.test(selectedText) || /^<i>[\s\S]*<\/i>$/.test(selectedText)) {
      const inner = selectedText.replace(/^(?:<em>|<i>)([\s\S]*)(?:<\/em>|<\/i>)$/, "$1");
      updated = html.replace(selectedText, inner);
    } else {
      updated = html.replace(selectedText, `<em>${selectedText}</em>`);
    }
  }

  // BLOCKQUOTE
  else if (command === "blockquote") {
    if (/^<blockquote>[\s\S]*<\/blockquote>$/.test(selectedText)) {
      const inner = selectedText.replace(/^<blockquote>([\s\S]*)<\/blockquote>$/, "$1");
      updated = html.replace(selectedText, inner);
    } else {
      updated = html.replace(selectedText, `<blockquote>${selectedText}</blockquote>`);
    }
  }

  // LISTS
  else if (command === "ul" || command === "ol") {
    const tag = command;
    if (new RegExp(`^<${tag}>[\\s\\S]*<\\/${tag}>$`, "i").test(selectedText)) {
      const inner = selectedText.replace(new RegExp(`^<${tag}>([\\s\\S]*)<\\/${tag}>$`, "i"), "$1");
      updated = html.replace(selectedText, inner);
    } else {
      const lines = selectedText.split(/\r?\n/).filter(Boolean);
      const listContent = lines.map((l) => `<li>${l}</li>`).join("");
      updated = html.replace(selectedText, `<${tag}>${listContent}</${tag}>`);
    }
  }

  // LINK
  else if (command === "link") {
    if (/^<a\s+[^>]*>[\s\S]*<\/a>$/.test(selectedText)) {
      const inner = selectedText.replace(/^<a\s+[^>]*>([\s\S]*)<\/a>$/, "$1");
      updated = html.replace(selectedText, inner);
    } else {
      const href = value || "#";
      const anchor = `<a href="${href}" target="_blank">${selectedText || href}</a>`;
      updated = html.replace(selectedText, anchor);
    }
  }

  // IMAGE
  else if (command === "image") {
    const src = value || "image.jpg";
    const img = `<img src="${src}" alt="image" />`;
    updated = html.replace(selectedText, img);
  }

  // CODE
  else if (command === "code") {
    if (/^<pre>[\s\S]*<\/pre>$/.test(selectedText)) {
      const inner = selectedText.replace(/^<pre>([\s\S]*)<\/pre>$/, "$1");
      updated = html.replace(selectedText, inner);
    } else {
      updated = html.replace(selectedText, `<pre><code>${selectedText}</code></pre>`);
    }
  }

  return updated;
};
