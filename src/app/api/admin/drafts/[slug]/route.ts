import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ✅ Function to create SEO-friendly slug
function slugify(slug: string) {
  return slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // spaces → dashes
    .replace(/[^a-z0-9-]/g, ""); // remove invalid chars
}

// ✅ Strip HTML tags
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// ✅ Extract first 25 words for postdescription
function generatePostDescription(content: string) {
  const text = stripHtml(content);
  const words = text.split(" ").slice(0, 25);
  return words.join(" ");
}

// ✅ Function to replace {currentyear} recursively
function replaceYear<T>(value: T): T {
  const currentYear = new Date().getFullYear();

  if (typeof value === "string") {
    return value.replace(/\{currentyear\}/gi, String(currentYear)).trim() as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceYear(item)) as T;
  }

  if (typeof value === "object" && value !== null) {
    const newObj: Record<string, any> = {};
    for (const key in value as any) {
      newObj[key] = replaceYear((value as any)[key]);
    }
    return newObj as T;
  }

  return value;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let {
      title,
      slug,
      description,
      content,
      tags,
      category,
      schema,
      author,
      authorEmail,
      date,
      seo,
    } = body;

    // ✅ If slug not provided, generate from title
    slug = slug ? slugify(slug) : slugify(title);

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    // ✅ Generate postdescription (first 25 words)
    const postdescription = generatePostDescription(content || "");

    // ✅ Apply {currentyear} replacement
    const postData = replaceYear({
      title,
      slug,
      seoTitle: seo?.title || title,
      description,
      content,
      tags: tags || [],
      category: category || [],
      schema: schema || "",
      author,
      authorEmail: authorEmail || "",
      date: date || new Date().toISOString(),
      postdescription,
      seo: seo || {
        title: title,
        description: description,
        keywords: tags || [],
      },
    });


    // ✅ Save post JSON file
    const filePath = path.join(process.cwd(), "data", "drafts_posts", `${slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(postData, null, 2));

    return NextResponse.json({ message: "Post saved successfully!" });
  } catch (err) {
    console.error("Error saving post:", err);
    return NextResponse.json(
      { error: "Failed to save post" },
      { status: 500 }
    );
  }
}
