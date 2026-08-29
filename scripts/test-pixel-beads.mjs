import assert from "node:assert/strict";
import {
  GRID_SIZE,
  PALETTE,
  SUPPORTED_GRID_SIZES,
  createForegroundMask,
  nearestPaletteColor,
  quantizeToGrid,
  recommendGridSize,
} from "../public/pixel-beads/core.js";

function solidImage(width, height, color) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    data.set([...color, 255], index * 4);
  }
  return data;
}

function paintRect(data, width, xStart, yStart, xEnd, yEnd, color, alpha = 255) {
  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = xStart; x < xEnd; x += 1) {
      const offset = (y * width + x) * 4;
      data.set([...color, alpha], offset);
    }
  }
}

assert.equal(PALETTE.length, 48, "palette must contain 48 colors");
assert.equal(new Set(PALETTE.map((color) => color.code)).size, 48, "palette codes must be unique");
assert.equal(GRID_SIZE, 36);
assert.deepEqual(SUPPORTED_GRID_SIZES, [36, 72, 108]);

for (const color of PALETTE) {
  assert.equal(nearestPaletteColor(...color.rgb).code, color.code, `exact color ${color.code} must map to itself`);
}

const width = 360;
const height = 360;
const whiteWithSubject = solidImage(width, height, [250, 250, 248]);
paintRect(whiteWithSubject, width, 90, 90, 270, 270, [127, 46, 39]);
const removed = createForegroundMask(whiteWithSubject, width, height, { removeBackground: true, tolerance: 14 });
assert.equal(removed.foregroundCount, 180 * 180, "connected white background should be removed");

const kept = createForegroundMask(whiteWithSubject, width, height, { removeBackground: false });
assert.equal(kept.foregroundCount, width * height, "disabled background removal should keep all opaque pixels");

const withProtectedHole = solidImage(72, 72, [250, 250, 248]);
paintRect(withProtectedHole, 72, 12, 12, 60, 60, [127, 46, 39]);
paintRect(withProtectedHole, 72, 30, 30, 42, 42, [250, 250, 248]);
const protectedMask = createForegroundMask(withProtectedHole, 72, 72, { removeBackground: true, tolerance: 14 });
assert.equal(protectedMask.mask[35 * 72 + 35], 1, "background-colored area enclosed by the subject should remain foreground");

const quantized = quantizeToGrid(whiteWithSubject, width, height, removed.mask);
const counted = Object.values(quantized.counts).reduce((sum, count) => sum + count, 0);
assert.equal(quantized.beadCount, 18 * 18, "center subject should occupy 18 by 18 cells");
assert.equal(counted, quantized.beadCount, "color counts must equal bead count");
assert.equal(quantized.emptyCount + quantized.beadCount, GRID_SIZE * GRID_SIZE, "beads plus blanks must equal 1296");
assert.ok(quantized.beadCount <= 1296);
assert.equal(quantized.gridSize, 36);
assert.equal(recommendGridSize(whiteWithSubject, width, height, removed.mask).gridSize, 36, "simple flat subject should use the smallest grid");

const transparent = solidImage(width, height, [0, 0, 0]);
for (let index = 3; index < transparent.length; index += 4) transparent[index] = 0;
paintRect(transparent, width, 120, 120, 240, 240, [35, 46, 87]);
const transparentMask = createForegroundMask(transparent, width, height, { removeBackground: true, tolerance: 18 });
const transparentGrid = quantizeToGrid(transparent, width, height, transparentMask.mask);
assert.equal(transparentGrid.beadCount, 12 * 12, "transparent source should preserve blank cells");
assert.equal(Object.values(transparentGrid.counts).reduce((sum, count) => sum + count, 0), transparentGrid.beadCount);

const highDetailSize = 648;
const highDetail = solidImage(highDetailSize, highDetailSize, [250, 250, 248]);
paintRect(highDetail, highDetailSize, 108, 108, 540, 540, [35, 46, 87]);
const highDetailMask = createForegroundMask(highDetail, highDetailSize, highDetailSize, { removeBackground: true, tolerance: 14 });
const highDetailGrid = quantizeToGrid(highDetail, highDetailSize, highDetailSize, highDetailMask.mask, { gridSize: 108 });
assert.equal(highDetailGrid.gridSize, 108);
assert.equal(highDetailGrid.beadCount, 72 * 72, "108 grid should preserve the centered subject at higher detail");
assert.equal(highDetailGrid.emptyCount + highDetailGrid.beadCount, 108 * 108);
assert.equal(Object.values(highDetailGrid.counts).reduce((sum, count) => sum + count, 0), highDetailGrid.beadCount);
assert.ok(highDetailGrid.beadCount <= 11664);

const mediumDetailSize = 180;
const mediumDetail = solidImage(mediumDetailSize, mediumDetailSize, [127, 46, 39]);
for (let y = 0; y < mediumDetailSize; y += 1) {
  for (let x = 0; x < mediumDetailSize; x += 1) {
    const tile = (Math.floor(x / 8) + Math.floor(y / 8)) % 2;
    const offset = (y * mediumDetailSize + x) * 4;
    mediumDetail.set(tile ? [35, 46, 87, 255] : [127, 46, 39, 255], offset);
  }
}
const mediumMask = createForegroundMask(mediumDetail, mediumDetailSize, mediumDetailSize, { removeBackground: false });
assert.equal(recommendGridSize(mediumDetail, mediumDetailSize, mediumDetailSize, mediumMask.mask).gridSize, 72, "medium repeated detail should use the middle grid");
const mediumGrid = quantizeToGrid(mediumDetail, mediumDetailSize, mediumDetailSize, mediumMask.mask, { gridSize: 72 });
assert.equal(mediumGrid.emptyCount + mediumGrid.beadCount, 72 * 72);

const fineDetail = solidImage(mediumDetailSize, mediumDetailSize, [0, 0, 0]);
for (let y = 0; y < mediumDetailSize; y += 1) {
  for (let x = 0; x < mediumDetailSize; x += 1) {
    const offset = (y * mediumDetailSize + x) * 4;
    fineDetail.set([(x * 47) % 256, (y * 61) % 256, ((x + y) * 37) % 256, 255], offset);
  }
}
const fineMask = createForegroundMask(fineDetail, mediumDetailSize, mediumDetailSize, { removeBackground: false });
assert.equal(recommendGridSize(fineDetail, mediumDetailSize, mediumDetailSize, fineMask.mask).gridSize, 108, "fine multicolor detail should use the largest grid");

assert.throws(
  () => quantizeToGrid(whiteWithSubject, width, height, removed.mask, { gridSize: 54 }),
  /unsupported grid size/,
  "only the three supported grid sizes should be accepted",
);

console.log("Pixel-beads tests passed: 48 colors, background removal, auto sizing, and 36/72/108 counts.");
