// lib/posts.ts
import fs from "fs";
import path from "path";

const DATA_ROOT = path.join(process.cwd(), "data");

// ✅ Dynamic folder → status map
const FOLDERS: Record<string, string> = {
  published: path.join(DATA_ROOT, "posts"),
  draft: path.join(DATA_ROOT, "drafts_posts"),
  trash: path.join(DATA_ROOT, "trash_posts"),
};

export type Post = {
  title: string;
  slug: string;
  description: string;
  content: string;
  tags: string[];
  category: string | string[];
  schema?: string;
  author: string;
  authorEmail?: string;
  date: string;
  postpostdescription: string;
  status?: string; // published | draft | trash
};

// ✅ Helper: Read all JSON posts from one folder
function readPostsFromDir(dir: string, status: string): Post[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((file) => {
      try {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const post = JSON.parse(content) as Post;
        return { ...post, status };
      } catch (err) {
        console.error(`❌ Failed to read/parse ${file}`, err);
        return null;
      }
    })
    .filter(Boolean) as Post[];
}

// ✅ Get all posts (published + drafts + trash), sorted by date
export function getAllPosts(): Post[] {
  let posts: Post[] = [];
  for (const [status, dir] of Object.entries(FOLDERS)) {
    posts = posts.concat(readPostsFromDir(dir, status));
  }
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// ✅ Get only published posts
export function getPublishedPosts(): Post[] {
  return readPostsFromDir(FOLDERS.published, "published").sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// ✅ Get post by slug (searches all folders dynamically)
export function getPostBySlug(slug: string): Post | null {
  for (const [status, dir] of Object.entries(FOLDERS)) {
    const filePath = path.join(dir, `${slug}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const post = JSON.parse(content) as Post;
        return { ...post, status };
      } catch (err) {
        console.error(`❌ Failed to parse ${slug}.json`, err);
        return null;
      }
    }
  }
  return null;
}

// ✅ Get latest N posts by author (published only or across all)
export function getPostsByAuthor(
  authorName: string,
  limit: number = 6,
  onlyPublished = true
): Post[] {
  const posts = onlyPublished ? getPublishedPosts() : getAllPosts();
  return posts.filter((post) => post.author === authorName).slice(0, limit);
}
