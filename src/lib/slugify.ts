export const slugify = (str: string) =>
  str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")        // space → dash
    .replace(/[^a-z0-9\-]/g, ""); // sirf a-z, 0-9 aur dash allow
