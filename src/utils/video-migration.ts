import axios from 'axios';
import { Parser } from 'm3u8-parser';
import path from 'path';
import fs from 'fs';
import { uploadToBunnyStorage } from './bunny-cdn';
import { handleMigrateError, markMigrationComplete } from './db-functions';
import { VideoMetadata } from '@prisma/client';
import { downloadFromURL, makeDirectoryIfNotExists } from './file-operations';

const getM3u8ParsedData = (m3u8Content: any) => {
  const parser = new Parser();
  parser.push(m3u8Content);
  parser.end();
  return parser.manifest;
};

const uploadM3U8MainFile = async (
  destinationFilePath: string,
  m3u8Content: any
) => {
  try {
    const tempFilePath = path.join(__dirname, destinationFilePath);
    fs.writeFileSync(tempFilePath, m3u8Content);
    await uploadToBunnyStorage(tempFilePath, destinationFilePath);
  } catch (error) {
    throw error;
  }
};

const uploadSegmentFile = async ({
  segment,
  videoUrl,
  destinationFilePath,
}: {
  segment: any;
  videoUrl: string;
  destinationFilePath: string;
}) => {
  const dirName = path.dirname(destinationFilePath);
  const segmentUrl = new URL(segment.uri, videoUrl).toString();

  const segmentResponse = await axios.get(segmentUrl, {
    responseType: 'arraybuffer',
  });

  const segmentFileName = path.basename(segmentUrl);
  const segmentFilePath = path.join(dirName, segmentFileName);
  fs.writeFileSync(segmentFilePath, segmentResponse.data);
  await uploadToBunnyStorage(segmentFilePath, `${dirName}/${segmentFileName}`);
  fs.unlinkSync(segmentFilePath);
};

const downloadAndUploadM3U8 = async (videoUrl: string, destinationFilePath: string) => {
  try {
    const response = await axios.get(videoUrl);
    const m3u8Content = response.data;

    const parsedData = getM3u8ParsedData(m3u8Content);
    const dirName = makeDirectoryIfNotExists(destinationFilePath);
    await uploadM3U8MainFile(destinationFilePath, m3u8Content);

    for (const segment of parsedData.segments) {
      await uploadSegmentFile({ segment, videoUrl, destinationFilePath });
    }
    if (fs.existsSync(dirName)) {
      fs.rmSync(dirName, { recursive: true, force: true });
    }
    console.log('M3U8 file and media segments uploaded successfully.');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

const downloadAndUploadMP4 = async (
  videoURL: string,
  destinationFilePath: string
) => {
  const tempFilePath = path.join(__dirname, destinationFilePath);
  await downloadFromURL(videoURL, tempFilePath);
  await uploadToBunnyStorage(tempFilePath, destinationFilePath);
  fs.unlinkSync(tempFilePath);
};

const migrateFile = async (videoURL: string, destinationFilePath: string) => {
  if (videoURL.endsWith('.m3u8')) {
    await downloadAndUploadM3U8(videoURL, destinationFilePath);
  } else {
    await downloadAndUploadMP4(videoURL, destinationFilePath);
  }
}

export const migrateVideo = async (video: VideoMetadata) => {
  try {
    const videoURLs = [
      video.video_1080p_mp4_1,
      video.video_720p_mp4_1,
      video.video_360p_mp4_1,
    ];

    for (const videoURL in videoURLs) {
      if (!videoURL) {
        return;
      } else {
        const pathName = new URL(videoURL).pathname;
        await migrateFile(videoURL, pathName);
        console.log(`Migrated video ${videoURL} successfully`);
      }
    }

    await markMigrationComplete(video);
  } catch (error) {
    console.log('Error3', error);
    await handleMigrateError(video.id);
    throw error;
  }
};
