import { VideoMetadata } from '@prisma/client';
import db from '../db';
import { getNewUrl } from './bunny-cdn';

export const getVideoURLAndMarkInProgress =
  async (): Promise<VideoMetadata | null> => {
    let video: VideoMetadata | null = null;
    try {
      await db.$transaction(async (prismaClient) => {
        // Use raw SQL to lock the row for update
        const result: VideoMetadata[] = await prismaClient.$queryRaw`
        SELECT * FROM "VideoMetadata"
        WHERE "migration_status" = 'NOT_MIGRATED'
        AND "migration_pickup_time" IS NULL
        FOR UPDATE
        LIMIT 1
      `;

        if (result.length > 0) {
          video = result[0] as VideoMetadata;
          await prismaClient.videoMetadata.update({
            where: { id: video.id },
            data: {
              migration_status: 'IN_PROGRESS',
              migration_pickup_time: new Date(),
            },
          });
        }
      });
    } catch (error) {
      // Handle error
      console.error('Error:', error);
      throw error;
    }
    return video;
  };

// Function to update the database and mark migration as complete
export const markMigrationComplete = async (video: VideoMetadata) => {
  await db.videoMetadata.update({
    where: { id: video.id },
    data: {
      migration_status: 'MIGRATED',
      migrated_video_1080p_mp4_1: getNewUrl(video.video_1080p_mp4_1),
      migrated_video_720p_mp4_1: getNewUrl(video.video_720p_mp4_1),
      migrated_video_360p_mp4_1: getNewUrl(video.video_360p_mp4_1),
      
    },
  });
};

export const handleMigrateError = async (videoId: number) => {
  await db.videoMetadata.update({
    where: { id: videoId },
    data: {
      migration_status: 'MIGRATION_ERROR',
    },
  });
};
