import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const makeDirectoryIfNotExists = (filePath: string) => {
  const dirName = path.dirname(filePath);
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }
  return dirName;
};

export const downloadFromURL = async (
  fileURL: string,
  downloadPath: string
) => {
  try {
    makeDirectoryIfNotExists(downloadPath);
    const writer = fs.createWriteStream(downloadPath);

    const response = await axios.get(fileURL, {
      responseType: 'stream',
    });

    response.data.pipe(writer);

    return new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (err) {
    console.log('Error 2');
    throw err;
  }
};
