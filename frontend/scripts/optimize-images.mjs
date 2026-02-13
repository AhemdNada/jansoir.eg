import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const imagesDir = path.join(projectRoot, 'public', 'images');

/**
 * Generate responsive WebP variants.
 * This script is safe to run multiple times (it overwrites outputs).
 */
const jobs = [
  // Hero images (used on Home)
  { input: 'hero-section-1.jpg', widths: [480, 768, 1200], quality: 78 },
  { input: 'hero-section-2.jpg', widths: [480, 768, 1200], quality: 78 },
  { input: 'hero-section-3.jpg', widths: [480, 768, 1200], quality: 78 },

  // Banners (used on Home)
  { input: 'b-1.png', widths: [480, 768, 1200], quality: 78 },
  { input: 'b-2.png', widths: [480, 768, 1200], quality: 78 },
  { input: 'b-3.png', widths: [480, 768, 1200], quality: 78 },
  { input: 'b-4.png', widths: [480, 768, 1200], quality: 78 }
];

function outName(input, width) {
  const base = input.replace(/\.(png|jpe?g)$/i, '');
  return `${base}-${width}w.webp`;
}

async function run() {
  let count = 0;
  for (const job of jobs) {
    const inPath = path.join(imagesDir, job.input);
    for (const width of job.widths) {
      const outPath = path.join(imagesDir, outName(job.input, width));
      await sharp(inPath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: job.quality })
        .toFile(outPath);
      count += 1;
    }
  }
  console.log(`✅ Generated ${count} WebP variants in ${imagesDir}`);
}

run().catch((err) => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});

