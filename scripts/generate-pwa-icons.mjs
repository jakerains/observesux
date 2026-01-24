#!/usr/bin/env node
/**
 * Generate PWA icons from source image
 * Run with: node scripts/generate-pwa-icons.mjs
 */

import sharp from 'sharp'
import { mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SOURCE = join(ROOT, 'public', 'siouxlandonlineicon_black.png')
const OUTPUT_DIR = join(ROOT, 'public', 'icons')

// Icon sizes for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const BADGE_SIZE = 72

async function generateIcons() {
  console.log('Generating PWA icons from:', SOURCE)

  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true })

  // Load source image
  const source = sharp(SOURCE)
  const metadata = await source.metadata()
  console.log(`Source image: ${metadata.width}x${metadata.height}`)

  // Generate standard icons
  for (const size of ICON_SIZES) {
    const outputPath = join(OUTPUT_DIR, `icon-${size}x${size}.png`)
    await sharp(SOURCE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a (slate-900)
      })
      .png()
      .toFile(outputPath)
    console.log(`Generated: icon-${size}x${size}.png`)
  }

  // Generate badge (monochrome, smaller)
  const badgePath = join(OUTPUT_DIR, `badge-${BADGE_SIZE}x${BADGE_SIZE}.png`)
  await sharp(SOURCE)
    .resize(BADGE_SIZE, BADGE_SIZE, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(badgePath)
  console.log(`Generated: badge-${BADGE_SIZE}x${BADGE_SIZE}.png`)

  // Generate Apple touch icon (180x180 with padding)
  const applePath = join(OUTPUT_DIR, 'apple-touch-icon.png')
  await sharp(SOURCE)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .png()
    .toFile(applePath)
  console.log('Generated: apple-touch-icon.png')

  // Generate favicon (32x32)
  const faviconPath = join(OUTPUT_DIR, 'favicon-32x32.png')
  await sharp(SOURCE)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .png()
    .toFile(faviconPath)
  console.log('Generated: favicon-32x32.png')

  // Generate favicon (16x16)
  const favicon16Path = join(OUTPUT_DIR, 'favicon-16x16.png')
  await sharp(SOURCE)
    .resize(16, 16, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .png()
    .toFile(favicon16Path)
  console.log('Generated: favicon-16x16.png')

  // Generate shortcut icons
  const shortcutSizes = [
    { name: 'shortcut-weather.png', size: 96 },
    { name: 'shortcut-camera.png', size: 96 },
  ]

  for (const { name, size } of shortcutSizes) {
    const shortcutPath = join(OUTPUT_DIR, name)
    await sharp(SOURCE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      })
      .png()
      .toFile(shortcutPath)
    console.log(`Generated: ${name}`)
  }

  console.log('\nPWA icons generated successfully!')
}

generateIcons().catch(console.error)
