import { NextResponse } from 'next/server';
import { getAllPosts, getPostBySlug } from '@/lib/blog';

export async function GET() {
  try {
    const posts = getAllPosts().map(meta => {
      const fullPost = getPostBySlug(meta.slug);
      return {
        ...meta,
        readingTime: fullPost?.readingTime || 1
      };
    });
    
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ posts: [] }, { status: 500 });
  }
}
