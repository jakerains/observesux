/**
 * Script to generate app icons from the source icon
 * Run with: node scripts/generate-icons.mjs
 */

import Jimp from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_ICON = path.join(__dirname, '../../public/suxicon.png');
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

    // Clone and resize to fill the entire canvas — no padding, no transparency
    // iOS applies its own rounded-rect mask; Android adaptive-icon handles its own safe zone
    const resized = sourceImage.clone();
    resized.cover(size, size);

    // Save the icon
    const outputPath = path.join(ASSETS_DIR, name);
    await resized.writeAsync(outputPath);
    console.log(`  Saved: ${outputPath}`);
  }

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
