import { config } from "@/config";
import { AppError, ExternalServiceError } from "@/util/errors";
import { logger } from "@/util/logger";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as generateSignedUrl } from "@aws-sdk/s3-request-presigner";

import crypto from "crypto";

const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

export class S3Service {
  private bucketName: string;

  constructor() {
    this.bucketName = config.aws.bucketName;
  }

  private generateUniqueKey(
    userId: string,
    prefix: string,
    extension: string
  ): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString("hex");
    return `${prefix}/${userId}/${timestamp}-${randomString}.${extension}`;
  }

  // upload original photo to s3 cloud

  async uploadOriginalPhoto(
    userId: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<UploadResult> {
    try {
      const extension = mimeType.split("/")[1] || "jpg";
      const key = this.generateUniqueKey(userId, "originals", extension);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: {
          userId,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(command);

      const url = `https://${this.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;

      logger.info(`Uploaded original photo to s3 cloud`, {
        key,
        url,
      });

      return {
        url,
        key,
        bucket: this.bucketName,
      };
    } catch (error: any) {
      logger.error(`Failed to upload original photo to s3 cloud`, error);
      throw new ExternalServiceError(
        "S3",
        `Failed to upload original photo to s3 cloud`
      );
    }
  }

  async uploadGeneratedHeadshot(
    userId: string,
    fileBuffer: Buffer,
    style: string,
    mimeType: string = "image/png"
  ): Promise<UploadResult> {
    try {
      const extension = mimeType.split("/")[1] || "png";
      const key = this.generateUniqueKey(
        userId,
        `generated/${style}`,
        extension
      );

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: {
          userId,
          style,
          generatedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(command);

      const url = `https://${this.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;

      logger.info(`Generated headshot uploaded to S3: ${key}`);

      return {
        url,
        key,
        bucket: this.bucketName,
      };
    } catch (error) {
      logger.error("Failed to upload generated headshot to S3:", error);
      throw new Error("Failed to upload generated headshot to storage");
    }
  }

  // Generate Signed URL for the original photo
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      // validate the key
      if (!key || key.trim() === "") {
        logger.error(`Invalid signed url key`);
        throw new AppError("Invalid signed url key", 400);
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await generateSignedUrl(s3Client, command, {
        expiresIn,
      });

      logger.info(`Generated signed url for the original photo`, {
        key,
        signedUrl,
      });

      return signedUrl;
    } catch (error) {
      logger.error(`Failed to generate signed url for the original photo`);
      throw new ExternalServiceError(
        "S3",
        `Failed to generate signed url for the original photo`
      );
    }
  }

  async downloadFromUrl(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.error("Failed to download file from URL:", error);
      throw new Error("Failed to download file");
    }
  }

  async deleteFile(key: string): Promise<void> {
    // validate the key
    if (!key || key.trim() === "") {
      logger.error(`Invalid key to delete`);
      throw new AppError("Invalid key to delete", 400);
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await s3Client.send(command);

      logger.info(`Deleted file from s3 cloud`, {
        key,
      });
    } catch (error) {
      logger.error(`Failed to delete file from s3 cloud`, error);
      throw new ExternalServiceError(
        "S3",
        "Failed to delete file from s3 cloud"
      );
    }
  }

  async deleteFiles(keys: string[]): Promise<void> {
    try {
      const deletePromises = keys.map((key) => this.deleteFile(key));
      await Promise.all(deletePromises);

      logger.info(`Deleted ${keys.length} files from s3 cloud`, {
        keys,
      });
    } catch (error) {
      logger.error(`Failed to delete keys from s3 cloud`, error);
      throw new ExternalServiceError(
        "S3",
        "Failed to delete keys from s3 cloud"
      );
    }
  }
}

export const s3Service = new S3Service();
