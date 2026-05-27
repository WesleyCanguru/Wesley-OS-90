import fs from 'fs';
import path from 'path';

function findImages(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        findImages(filePath, fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico'].includes(ext)) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const images = findImages(process.cwd());
console.log("Imagens encontradas no projeto:", images);
