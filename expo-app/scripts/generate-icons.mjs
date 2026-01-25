/**
 * Script to generate app icons from the source icon
 * Run with: node scripts/generate-icons.mjs
 */

import Jimp from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_ICON = path.join(__dirname, '../../public/siouxlandonlineicon_black.png');
const ASSETS_DIR = path.join(__dirname, '../assets');

const ICON_SIZES = [
  { name: 'icon.png', size: 1024 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'splash-icon.png', size: 288 },
  { name: 'favicon.png', size: 48 },
];

async function generateIcons() {
  console.log('Loading source icon...');
  const sourceImage = await Jimp.read(SOURCE_ICON);

  console.log(`Source icon size: ${sourceImage.getWidth()}x${sourceImage.getHeight()}`);

  for (const { name, size } of ICON_SIZES) {
    console.log(`Generating ${name} (${size}x${size})...`);

    // Clone the source image
    const resized = sourceImage.clone();

    // Create a square canvas with padding for the icon
    const canvas = new Jimp(size, size, 0x00000000); // Transparent background

    // Calculate the size to fit the icon with some padding (90% of canvas)
    const iconSize = Math.floor(size * 0.85);

    // Resize the icon maintaining aspect ratio
    resized.contain(iconSize, iconSize);

    // Center the icon on the canvas
    const x = Math.floor((size - resized.getWidth()) / 2);
    const y = Math.floor((size - resized.getHeight()) / 2);

    canvas.composite(resized, x, y);

    // Save the icon
    const outputPath = path.join(ASSETS_DIR, name);
    await canvas.writeAsync(outputPath);
    console.log(`  Saved: ${outputPath}`);
  }

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
