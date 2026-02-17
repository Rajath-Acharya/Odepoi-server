import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import type { PutObjectCommandInput, GetObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { Readable } from 'stream';

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_KEY, AWS_S3_BUCKET } = process.env;

console.log('ZZ AWS_REGION', AWS_REGION);

if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_KEY || !AWS_S3_BUCKET) {
  // Fail fast at startup if required environment variables are missing
  throw new Error(
    'Missing one or more required AWS environment variables: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_KEY, AWS_S3_BUCKET',
  );
}

export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_KEY,
  },
});

export async function uploadBufferToS3(key: string, body: Buffer, contentType: string) {
  const newKey = key.replace(/\.[^.]+$/, '') + '.webp';

  const compressedBuffer = await sharp(body)
    .resize({ width: 1500, withoutEnlargement: true })
    .webp({
      quality: 75, // 75 is the "sweet spot" for WebP quality vs size
      effort: 4, // CPU effort (0-6): 4 is a good balance for speed
      lossless: false, // Ensures lossy compression for smallest file size
    })
    .toBuffer();

  const params: PutObjectCommandInput = {
    Bucket: AWS_S3_BUCKET,
    Key: newKey,
    Body: compressedBuffer,
    ContentType: 'image/webp', // Always set this for S3/Browser compatibility
  };

  await s3Client.send(new PutObjectCommand(params));

  return {
    key: newKey,
    bucket: AWS_S3_BUCKET,
    originalSize: `${(body.length / 1024).toFixed(2)} KB`,
    newSize: `${(compressedBuffer.length / 1024).toFixed(2)} KB`,
  };
}

export async function getObjectFromS3(key: string) {
  const params: GetObjectCommandInput = {
    Bucket: AWS_S3_BUCKET,
    Key: key,
  };

  console.log('ZZ params', params, AWS_S3_BUCKET);

  const result = await s3Client.send(new GetObjectCommand(params));

  const body = result.Body as Readable | null | undefined;

  return {
    contentType: result.ContentType || 'application/octet-stream',
    body,
  };
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: key,
  });

  // Returns the signed URL string
  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteObjectFromS3(key: string) {
  const params = {
    Bucket: AWS_S3_BUCKET,
    Key: key,
  };

  try {
    const result = await s3Client.send(new DeleteObjectCommand(params));
    return result;
  } catch (err) {
    console.error('S3 Delete Error:', err);
    throw new Error('Could not delete file from S3');
  }
}
