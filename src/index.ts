import { getVideoURLAndMarkInProgress } from './utils/db-functions';
import { migrateVideo } from './utils/video-migration';

// Main function to perform migration
async function main() {
  try {
    const video = await getVideoURLAndMarkInProgress();
    if (!video) {
      console.log('No videos to migrate');
      return;
    }
    await migrateVideo(video);
    await main();
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

main();
