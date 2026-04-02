export function formatText(text: string) {
  if (!text) return "";

  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // bold
    .replace(/\*(.*?)\*/g, "<em>$1</em>"); // italic
}