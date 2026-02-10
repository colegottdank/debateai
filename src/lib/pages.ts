import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const PAGES_DIR = path.join(process.cwd(), 'content', 'pages');

export interface PageMeta {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  author: string;
  date: string;
  category: string; // compare, tools, guides
}

export interface PageContent extends PageMeta {
  content: string; // Raw markdown
  html: string; // Rendered HTML
  readingTime: number;
}

/**
 * Get a static page by category and slug.
 * Reads from content/pages/{category}/{slug}.md
 */
export function getPage(category: string, slug: string): PageContent | null {
  const filePath = path.join(PAGES_DIR, category, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const html = marked.parse(content) as string;
  const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

  return {
    slug,
    category,
    title: (data.title as string) || slug,
    description: (data.description as string) || '',
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    author: (data.author as string) || 'DebateAI Team',
    date: (data.date as string) || new Date().toISOString(),
    content,
    html,
    readingTime,
  };
}

/**
 * Get all static pages across all categories.
 * Used for sitemap generation.
 */
export function getAllPages(): PageMeta[] {
  if (!fs.existsSync(PAGES_DIR)) {
    return [];
  }

  const categories = fs.readdirSync(PAGES_DIR).filter((f) => {
    const fullPath = path.join(PAGES_DIR, f);
    return fs.statSync(fullPath).isDirectory();
  });

  const pages: PageMeta[] = [];

  for (const category of categories) {
    const categoryDir = path.join(PAGES_DIR, category);
    const files = fs.readdirSync(categoryDir).filter((f) => f.endsWith('.md'));

    for (const filename of files) {
      const slug = filename.replace(/\.md$/, '');
      const filePath = path.join(categoryDir, filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(fileContent);

      pages.push({
        slug,
        category,
        title: (data.title as string) || slug,
        description: (data.description as string) || '',
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        author: (data.author as string) || 'DebateAI Team',
        date: (data.date as string) || new Date().toISOString(),
      });
    }
  }

  return pages;
}
