export function extractHeadingsFromHTML(html: string) {
  const regex = /<h3[^>]*>(.*?)<\/h3>/g;
  const headings = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "");
    const id = text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
    headings.push({ id, text });
  }
  return headings;
}
