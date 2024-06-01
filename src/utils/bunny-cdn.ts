// BunnyCDN configuration
import axios from 'axios';
import fs from 'fs';

const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY ?? 'API_KEY';

const BUNNY_STORAGE_HOSTNAME =
  process.env.BUNNY_CDN_HOSTNAME ?? 'sg.storage.bunnycdn.com';
const BUNNY_STORAGE_ZONE_NAME =
  process.env.BUNNY_STORAGE_ZONE_NAME ?? 'code100x';
const BUNNY_STORAGE_BASE_URL = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE_NAME}`;

const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || 'https://code100x.b-cdn.net';

// Function to upload a file to BunnyCDN
export const uploadToBunnyStorage = async (
  filePath: string,
  destination: string
) => {
  const fileStream = fs.createReadStream(filePath);
  const url = BUNNY_STORAGE_BASE_URL + destination;

  await axios.put(url, fileStream, {
    headers: {
      AccessKey: BUNNY_STORAGE_API_KEY,
      'Content-Type': 'application/octet-stream',
    },
  });
  console.log(`${filePath} uploaded to BunnyCDN as ${destination}`);
};

export const getNewUrl = (oldUrl: string | null) => {
  if (!oldUrl) {
    return oldUrl;
  }
  return BUNNY_CDN_URL + new URL(oldUrl).pathname;
};
