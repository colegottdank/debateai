import { NextResponse } from 'next/server';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import { withErrorHandler } from '@/lib/api-errors';

export const GET = withErrorHandler(async () => {
  const posts = getAllPosts().map(meta => {
    const fullPost = getPostBySlug(meta.slug);
    return {
      ...meta,
      readingTime: fullPost?.readingTime || 1
    };
  });
  
  return NextResponse.json({ posts });
});
