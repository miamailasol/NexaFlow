import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SVG_PATH = path.resolve('public/favicon.svg');
const PUBLIC_DIR = path.resolve('public');

async function createIco(pngBuffers) {
  // pngBuffers is an array of objects: { width, height, buffer }
  const count = pngBuffers.length;
  
  // Header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: Icon
  header.writeUInt16LE(count, 4); // Count

  const entries = [];
  let currentOffset = 6 + count * 16; // Header size + entries size

  for (const png of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(png.width === 256 ? 0 : png.width, 0); // Width
    entry.writeUInt8(png.height === 256 ? 0 : png.height, 1); // Height
    entry.writeUInt8(0, 2); // Color count
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Planes
    entry.writeUInt16LE(32, 6); // Bit count (32-bit PNG)
    entry.writeUInt32LE(png.buffer.length, 8); // Size of image data
    entry.writeUInt32LE(currentOffset, 12); // Offset of image data
    
    entries.push(entry);
    currentOffset += png.buffer.length;
  }

  const buffers = [header, ...entries, ...pngBuffers.map(p => p.buffer)];
  return Buffer.concat(buffers);
}

async function run() {
  if (!fs.existsSync(SVG_PATH)) {
    console.error(`Error: Source SVG not found at ${SVG_PATH}`);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(SVG_PATH);

  // Sizes required by modern standards
  const sizes = {
    'favicon-16x16.png': 16,
    'favicon-32x32.png': 32,
    'favicon-48x48.png': 48,
    'favicon-64x64.png': 64,
    'favicon-128x128.png': 128,
    'apple-touch-icon.png': 180,
    'android-chrome-192x192.png': 192,
    'android-chrome-512x512.png': 512
  };

  console.log('Generating PNG favicon sizes from SVG...');

  const results = {};
  for (const [filename, size] of Object.entries(sizes)) {
    const outputPath = path.join(PUBLIC_DIR, filename);
    const buffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    
    fs.writeFileSync(outputPath, buffer);
    results[size] = buffer;
    console.log(`✓ Generated ${filename} (${size}x${size})`);
  }

  // Create favicon.ico (containing 16x16, 32x32, 48x48)
  console.log('Compiling multi-resolution favicon.ico...');
  const icoBuffer = await createIco([
    { width: 16, height: 16, buffer: results[16] },
    { width: 32, height: 32, buffer: results[32] },
    { width: 48, height: 48, buffer: results[48] }
  ]);
  
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
  console.log('✓ Generated favicon.ico (16x16, 32x32, 48x48)');

  // Generate safari-pinned-tab.svg (monochrome purple logo)
  console.log('Generating safari-pinned-tab.svg...');
  const safariSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 46" fill="none">
    <path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
  </svg>`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'safari-pinned-tab.svg'), safariSvg);
  console.log('✓ Generated safari-pinned-tab.svg');

  // Generate site.webmanifest
  console.log('Generating site.webmanifest...');
  const manifest = {
    name: 'NexaFlow Protocol',
    short_name: 'NexaFlow',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    theme_color: '#0f0a21',
    background_color: '#0f0a21',
    display: 'standalone',
    start_url: '/'
  };
  fs.writeFileSync(path.join(PUBLIC_DIR, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
  console.log('✓ Generated site.webmanifest');

  console.log('\nFavicon generation suite complete!');
}

run().catch(console.error);
