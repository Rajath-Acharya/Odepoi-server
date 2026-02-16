import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import type {
  PutObjectCommandInput,
  GetObjectCommandInput,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_KEY, AWS_S3_BUCKET } =
  process.env;

console.log("ZZ AWS_REGION", AWS_REGION);

if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_KEY || !AWS_S3_BUCKET) {
  // Fail fast at startup if required environment variables are missing
  throw new Error(
    "Missing one or more required AWS environment variables: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_KEY, AWS_S3_BUCKET"
  );
}

export const s3Client = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_KEY,
  },
});

export async function uploadBufferToS3(
  key: string,
  body: Buffer,
  contentType: string
) {
  const params: PutObjectCommandInput = {
    Bucket: AWS_S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  };

  await s3Client.send(new PutObjectCommand(params));

  return {
    key,
    bucket: AWS_S3_BUCKET,
  };
}

export async function getObjectFromS3(key: string) {
  const params: GetObjectCommandInput = {
    Bucket: AWS_S3_BUCKET,
    Key: key,
  };

  console.log("ZZ params", params, AWS_S3_BUCKET);

  const result = await s3Client.send(new GetObjectCommand(params));

  const body = result.Body as Readable | null | undefined;

  return {
    contentType: result.ContentType || "application/octet-stream",
    body,
  };
}
