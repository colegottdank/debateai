import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 client configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'masterdebater-avatars';
const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

// Direct upload function using AWS SDK
export async function uploadAvatar(buffer: ArrayBuffer, fileType: string) {
  // Check if environment variables are set
  if (!process.env.CLOUDFLARE_R2_ENDPOINT || !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    console.error('R2 environment variables not configured:', {
      hasEndpoint: !!process.env.CLOUDFLARE_R2_ENDPOINT,
      hasAccessKey: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      hasBucket: !!BUCKET_NAME,
      hasPublicUrl: !!PUBLIC_URL
    });
    throw new Error('R2 storage not configured. Please set environment variables.');
  }

  // Generate unique UUID filename for security
  const uuid = crypto.randomUUID();
  const extension = fileType.split('/')[1] || 'jpg';
  const key = `avatars/${uuid}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: Buffer.from(buffer),
    ContentType: fileType,
  });

  try {
    await r2Client.send(command);
    
    // Return the public URL
    const publicUrl = `${PUBLIC_URL}/${key}`;
    
    return {
      publicUrl,
      key,
    };
  } catch (error) {
    console.error('R2 upload error details:', {
      error,
      bucket: BUCKET_NAME,
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT?.substring(0, 30) + '...',
      hasCredentials: !!(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID && process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY)
    });
    throw new Error(`Failed to upload to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateUploadUrl(_userId: string, fileType: string) {
  // Generate unique UUID filename for security
  const uuid = crypto.randomUUID();
  const extension = fileType.split('/')[1] || 'jpg';
  const key = `avatars/${uuid}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  // Generate presigned URL valid for 5 minutes
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
  
  // Return both the upload URL and the final public URL
  const publicUrl = `${PUBLIC_URL}/${key}`;
  
  return {
    uploadUrl,
    publicUrl,
    key,
  };
}

export async function deleteAvatar(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

// Create bucket with public access (run this once)
export async function setupBucket() {
  // This would typically be done via Cloudflare dashboard or wrangler CLI
  // Creating bucket programmatically requires different permissions
  console.log('Please create the R2 bucket "masterdebater-avatars" in Cloudflare dashboard');
  console.log('Enable public access for the bucket to serve avatars');
}