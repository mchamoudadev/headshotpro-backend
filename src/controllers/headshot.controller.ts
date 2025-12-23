import { User } from "@/models/User.model";
import {
  headshotService,
  HeadshotService,
  HeadshotStyle,
} from "@/services/headshot";
import { s3Service, S3Service } from "@/services";
import { AppError, InsufficientCreditsError } from "@/util/errors";
import { logger } from "@/util/logger";
import { createdResponse, successResponse } from "@/util/response";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Headshot } from "@/models";
import { triggerHeadshotGeneration } from "@/services/queue/queue.service";

export const getAvailableStyles = async (req: Request, res: Response) => {
  const availableStyles = headshotService.getAvailableStyles();
  return successResponse(
    res,
    "Available styles fetched successfully",
    availableStyles,
    200
  );
};

export const generateHeadshot = async (req: Request, res: Response) => {
  const userId = new mongoose.Types.ObjectId(req.user?.userId);

  const styles = (req.body.styles || []) as HeadshotStyle[];

  const prompt = req.body.prompt as string | undefined;

  const file = req.file;

  if (!file) {
    throw new AppError("No file uploaded", 400);
  }

  // calulate the credit cost

  const creditsNeeded = styles.length + (prompt ? 1 : 0);

  // check if the user has enough credits

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.credits < creditsNeeded) {
    throw new InsufficientCreditsError(
      `Insufficient credits for this generation you have ${user.credits} credits and you need ${creditsNeeded}`
    );
  }

  // deduct the credits from the user
  user.credits -= creditsNeeded;
  await user.save();

  logger.info(`Deducted ${creditsNeeded} credits from user ${userId}`);

  try {
    // upload the original photo to s3 cloud

    const uploadResult = await s3Service.uploadOriginalPhoto(
      userId.toString(),
      file.buffer,
      file.mimetype
    );

    logger.info(
      `Uploaded original photo to s3 cloud for headshot ${uploadResult.key}`
    );

    // Generate Signed URL for the original photo

    const signedUrl = await s3Service.getSignedUrl(uploadResult.key, 86400); // 1 day

    logger.info(
      `Generated signed url for the original photo for headshot ${uploadResult.key}`
    );

    // create a new headshot document

    const headshot = await Headshot.create({
      userId,
      originalPhotoUrl: signedUrl,
      originalPhotoKey: uploadResult.key,
      status: "processing",
      selectedStyles: styles,
    });

    logger.info(
      `Created headshot document for headshot ${headshot._id} with ${
        styles.length
      } styles and ${prompt ? "custom prompt" : "no custom prompt"}`
    );

    // enqueue the headshot generation job

    await triggerHeadshotGeneration({
      headshotId: headshot._id.toString(),
      userId: userId.toString(),
      originalPhotoUrl: signedUrl,
      styles,
      prompt,
    });

    logger.info(
      `Headshot generation triggered for headshot ${headshot._id} with ${
        styles.length
      } styles and ${prompt ? "custom prompt" : "no custom prompt"}`
    );

    return createdResponse(res, "Headshot generation triggered successfully", {
      headshotId: headshot._id.toString(),
    });
  } catch (error) {
    logger.error(
      `Failed to generate headshot for user ${userId} with styles ${styles} and custom prompt ${prompt}`,
      error
    );
    throw new AppError(
      "Failed to generate headshot",
      500,
      "FAILED_TO_GENERATE_HEADSHOT"
    );
  }
};

export const getHeadshots = async (req: Request, res: Response) => {
  const userId = new mongoose.Types.ObjectId(req.user?.userId);

  const { status, limit, offset } = req.query;

  const query: any = {
    userId,
  };

  if (status) {
    query.status = status;
  }

  const headshots = await Headshot.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip(Number(offset))
    .select("-__v");

  const total = await Headshot.countDocuments(query);

  // generate signed urls for the headshots

  const headshotsWithSignedUrls = await Promise.all(
    headshots.map(async (headshot) => {
      const headShotObj = headshot.toObject();

      // generate signed url for the original photo

      const originalPhotoSignedUrl = await s3Service.getSignedUrl(
        headShotObj.originalPhotoKey,
        86400
      ); // 1 day

      // Generate signed urls for the generated headshots

      const generatedHeadshotWithSignedUrls = await Promise.all(
        headShotObj.generatedHeadshots.map(async (generatedHeadshot) => {
          // skip if key is missing

          if (!generatedHeadshot.key) {
            logger.warn(
              `Generated headshot key is missing for headshot ${headshot._id}`
            );
            return {
              ...generatedHeadshot,
              url: generatedHeadshot.url || "",
            };
          }

          return {
            ...generatedHeadshot,
            url: await s3Service.getSignedUrl(generatedHeadshot.key, 86400),
          };
        })
      );

      return {
        ...headShotObj,
        originalPhotoUrl: originalPhotoSignedUrl,
        generatedHeadshots: generatedHeadshotWithSignedUrls,
      };
    })
  );

  return successResponse(res, "Headshots fetched successfully", {
    headshots: headshotsWithSignedUrls,
    pagination: {
      total,
      limit: Number(limit),
      offset: Number(offset),
      hasMore: Number(offset) + Number(limit) < total,
    },
  });
};


export const deleteHeadshot = async (req: Request, res: Response) => {
  const userId = new mongoose.Types.ObjectId(req.user?.userId);

  const { id } = req.params;


  const headshot = await Headshot.findOne({ _id: id, userId });


  if (!headshot) {
    throw new AppError("Headshot not found", 404);
  }

  try{
    // delete the original photo from s3 cloud

    const keysToDelete = [
      headshot.originalPhotoKey,
      ...headshot.generatedHeadshots.map((generatedHeadshot) => generatedHeadshot.key),
    ]

    await s3Service.deleteFiles(keysToDelete);

    await Headshot.findByIdAndDelete(id);

    logger.info(`Deleted headshot ${id} for user ${userId}`);

  return successResponse(res, "Headshot deleted successfully", {
    headshotId: id,
  });

  } catch (error) {
    logger.error(`Failed to delete headshot ${id} for user ${userId}`, error);
    throw new AppError("Failed to delete headshot", 500);
  }

 
};