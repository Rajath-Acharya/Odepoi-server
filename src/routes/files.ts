import express from 'express';
import multer from 'multer';
import { uploadBufferToS3, getObjectFromS3, getPresignedDownloadUrl } from '../lib/s3.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const router = express.Router();

// Store uploaded file in memory so we can push the buffer to S3
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File upload and S3 operations
 */

/**
 * @swagger
 * /files/upload:
 *   post:
 *     summary: Upload a file to S3
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload. Field name must be "file".
 *     responses:
 *       201:
 *         description: File uploaded successfully to S3.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 key:
 *                   type: string
 *                 bucket:
 *                   type: string
 *       400:
 *         description: No file provided in the request.
 *       500:
 *         description: Internal server error while uploading to S3.
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file provided. Expected field name 'file'." });
    }

    const key = file.originalname;

    const result = await uploadBufferToS3(key, file.buffer, file.mimetype);

    return res.status(201).json({
      message: 'File uploaded successfully to S3.',
      key: result.key,
      bucket: result.bucket,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /files/download:
 *   get:
 *     summary: download url from key by fetching bg_wallpaper.jpeg
 *     tags: [Files]
 *     description: >
 *       Attempts to download bg_wallpaper.jpeg from the configured S3 bucket and
 *       streams it back as the response. Useful to verify that S3 credentials and
 *       bucket configuration are working correctly.
 *     responses:
 *       200:
 *         description: Image streamed successfully from S3.
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: The object bg_wallpaper.jpeg was not found in the bucket.
 *       500:
 *         description: Internal server error while fetching from S3.
 */

router.get('/download', async (_req, res, next) => {
  try {
    const key = 'bg_wallpaper.jpeg';

    // Create a URL that expires in 1 hour (3600 seconds)
    const url = await getPresignedDownloadUrl(key);

    res.status(200).json({ url });
  } catch (err) {
    next(err);
  }
});

export default router;
