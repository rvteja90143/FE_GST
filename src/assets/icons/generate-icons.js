const fs = require('fs');
const path = require('path');

// Simple function to create a basic SVG icon with text
function createSVGIcon(size, text) {
  const fontSize = Math.floor(size / 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#1976d2" />
    <text x="50%" y="50%" font-family="Arial" font-size="${fontSize}" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>`;
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname);
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes from the manifest
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate icons for each size
sizes.forEach(size => {
  const iconContent = createSVGIcon(size, 'BS');
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(iconPath, iconContent);
  console.log(`Created icon: ${iconPath}`);
});

console.log('All icons generated successfully!');
