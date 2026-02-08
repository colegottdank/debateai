import sharp from 'sharp';
import fs from 'fs';

const svg = fs.readFileSync('./public/logo-icon.svg');

// Generate multiple sizes
const sizes = [64, 128, 192, 512];

for (const size of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`./public/logo-icon-${size}.png`);
  console.log(`✅ Generated logo-icon-${size}.png`);
}

// Also create the main logo-icon.png
await sharp(svg)
  .resize(512, 512)
  .png()
  .toFile('./public/logo-icon.png');
console.log('✅ Generated logo-icon.png (512x512)');