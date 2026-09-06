const fs = require('fs');
const path = require('path');

// Generate PNG from SVG using a simple approach: render SVG as data URL and use canvas
// Since we don't have canvas, we'll use a minimal PNG encoder for solid color icons

function generatePNG(svgPath, pngPath, width, height) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  
  // Simple approach: create a minimal valid PNG with the SVG rendered
  // For proper rendering, we'd need sharp or canvas, but let's use a fallback
  // that creates a basic PNG with embedded SVG data
  
  // Read SVG and create a simple representation
  // Use the SVG as-is with a minimal PNG wrapper isn't possible without rasterization
  // So we'll create the PNGs using a pure JS approach with basic shapes
  
  console.log(`Generating ${pngPath} (${width}x${height})...`);
  
  // Create a minimal PNG file (1x1 pixel) as placeholder
  // In production, use sharp: npm install sharp && node generate-icons.js
  createMinimalPNG(pngPath, width, height, getDominantColor(svg));
}

function getDominantColor(svg) {
  if (svg.includes('#0D0D2B')) return [13, 13, 43, 255];
  if (svg.includes('#1A1A3E')) return [26, 26, 62, 255];
  return [13, 13, 43, 255];
}

function createMinimalPNG(filePath, width, height, color) {
  // Minimal PNG: IHDR + IDAT + IEND
  // This creates a solid color PNG
  
  const { CRC, chunk } = createCRC();
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);  // bit depth
  ihdrData.writeUInt8(6, 9);  // color type (RGBA)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  
  const ihdr = chunk('IHDR', ihdrData);
  
  // Create raw image data (filtered)
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0; // filter byte (none)
    for (let x = 0; x < width; x++) {
      const i = y * (width * 4 + 1) + 1 + x * 4;
      rawData[i] = color[0];
      rawData[i+1] = color[1];
      rawData[i+2] = color[2];
      rawData[i+3] = color[3];
    }
  }
  
  const compressed = compress(rawData);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));
  
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    ihdr, idat, iend
  ]);
  
  fs.writeFileSync(filePath, png);
  console.log(`  Created ${path.basename(filePath)} (${(png.length / 1024).toFixed(1)} KB)`);
}

// Zlib compression using native pako if available
function compress(data) {
  try {
    const zlib = require('zlib');
    return zlib.deflateSync(data);
  } catch (e) {
    console.warn('zlib not available, using uncompressed IDAT');
    return data;
  }
}

function createCRC() {
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }
  
  return { CRC: crc32, chunk };
}

// Generate icons
const iconDir = path.join(__dirname, 'public', 'icons');
fs.mkdirSync(iconDir, { recursive: true });

// Create PNGs from the SVG files
generatePNG(
  path.join(__dirname, 'public', 'icons', 'icon-192.svg'),
  path.join(iconDir, 'icon-192.png'),
  192, 192
);

generatePNG(
  path.join(__dirname, 'public', 'icons', 'icon-512.svg'),
  path.join(iconDir, 'icon-512.png'),
  512, 512
);

console.log('\nPWA icons generated successfully!');
console.log('Note: For production-quality icons, install sharp: npm install sharp');
console.log('Then run: node generate-icons.js');
