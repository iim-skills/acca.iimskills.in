export function fixImageUrls(html: string = ""): string {
  // Add domain if missing in image URLs
  return html.replace(/src="\/api\/uploads/g, 'src="https://iimskills.com/api/uploads');
}
