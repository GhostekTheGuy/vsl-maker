import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_DIR = './data/images';

export class StorageService {
  constructor() {
    // Ensure storage directory exists
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  }

  async downloadAndSaveImage(url: string, projectId: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const filename = `${projectId}_${uuidv4()}.png`;
    const filepath = path.join(STORAGE_DIR, filename);

    fs.writeFileSync(filepath, Buffer.from(buffer));

    return `/images/${filename}`;
  }

  getImagePath(filename: string): string | null {
    const filepath = path.join(STORAGE_DIR, filename);
    if (fs.existsSync(filepath)) {
      return filepath;
    }
    return null;
  }

  deleteProjectImages(projectId: string): void {
    const files = fs.readdirSync(STORAGE_DIR);
    for (const file of files) {
      if (file.startsWith(projectId)) {
        fs.unlinkSync(path.join(STORAGE_DIR, file));
      }
    }
  }
}
