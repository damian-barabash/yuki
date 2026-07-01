// Render the SVG guinea-pig favicon into PNG icons (apple-touch-icon + PWA).
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'public', 'favicon.svg'))

const out = [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
]

for (const [name, size] of out) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(join(root, 'public', name))
  console.log('✓', name, size)
}
