// lib/posts.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type Post = {
  title: string;
  date: string;
  author: string;
  categories: string[];
  tags: string[];
  path: string;
};

const postsDirectory = path.join(process.cwd(), "content/posts");

// Read all MDX files into objects
export function getAllPosts(): Post[] {
  const files = fs.readdirSync(postsDirectory);

  return files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const fullPath = path.join(postsDirectory, file);
      const source = fs.readFileSync(fullPath, "utf-8");
      const { data } = matter(source);

      return {
        title: data.title || "Untitled",
        date: data.date || new Date().toISOString(),
        author: data.author || "Unknown",
        categories: data.categories || [],
        tags: data.tags || [],
        path: data.path || `/posts/${file.replace(/\.mdx$/, "")}`,
      } as Post;
    });
}

// Group posts by category
export function getPostsByCategory(): Record<string, Post[]> {
  const posts = getAllPosts();
  const categoriesMap: Record<string, Post[]> = {};

  posts.forEach((post) => {
    post.categories.forEach((cat) => {
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = [];
      }
      categoriesMap[cat].push(post);
    });
  });

  return categoriesMap;
}
