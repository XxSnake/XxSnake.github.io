export const GRID_SIZE = 36;
export const SUPPORTED_GRID_SIZES = Object.freeze([36, 108]);
export const COVERAGE_THRESHOLD = 0.35;

const RAW_PALETTE = [
  ["B3", "#8BA877"], ["C3", "#8DB9DE"], ["D9", "#766DA7"], ["E2", "#BE95B7"], ["G1", "#D6C8A7"], ["A4", "#CDCF4C"],
  ["B5", "#65804B"], ["C5", "#386C8A"], ["D6", "#615492"], ["E4", "#A25C8F"], ["G5", "#A88662"], ["A6", "#C09E3D"],
  ["B8", "#3A5547"], ["C8", "#3757A0"], ["D7", "#5D3576"], ["F5", "#7F2E27"], ["G7", "#674A35"], ["A7", "#AB6A2F"],
  ["H1", "#DDDEDE"], ["H2", "#E1E3E1"], ["H3", "#97979F"], ["H4", "#6E6D73"], ["H5", "#5C555B"], ["H7", "#1A1916"],
  ["A3", "#B4B073"], ["B20", "#A0B4A6"], ["D16", "#8E91AE"], ["D8", "#8D8DB1"], ["E1", "#C3B2B3"], ["G2", "#BC9C90"],
  ["B18", "#828856"], ["B10", "#6D9397"], ["D11", "#73739A"], ["D12", "#76517F"], ["E12", "#B47897"], ["G3", "#A18677"],
  ["B14", "#5E782E"], ["B19", "#437356"], ["D2", "#484F72"], ["D20", "#5F3E72"], ["E5", "#A34472"], ["F10", "#5A372F"],
  ["B17", "#5F6530"], ["B7", "#31604A"], ["C16", "#232E57"], ["D14", "#552957"], ["E13", "#793063"], ["F7", "#32151F"],
];

function hexToRgb(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function channelToLinear(value) {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

export function rgbToLab(red, green, blue) {
  const r = channelToLinear(red);
  const g = channelToLinear(green);
  const b = channelToLinear(blue);

  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883;
  const pivot = (value) => value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;
  const fx = pivot(x);
  const fy = pivot(y);
  const fz = pivot(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labDistance(a, b) {
  const dl = a[0] - b[0];
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dl * dl + da * da + db * db);
}

export const PALETTE = RAW_PALETTE.map(([code, hex], index) => {
  const rgb = hexToRgb(hex);
  return Object.freeze({ code, hex, rgb, lab: rgbToLab(...rgb), index });
});

export function nearestPaletteColor(red, green, blue) {
  const lab = rgbToLab(red, green, blue);
  let best = PALETTE[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const color of PALETTE) {
    const distance = labDistance(lab, color.lab);
    if (distance < bestDistance) {
      best = color;
      bestDistance = distance;
    }
  }
  return best;
}

function borderIndexes(width, height) {
  const indexes = [];
  for (let x = 0; x < width; x += 1) {
    indexes.push(x, (height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    indexes.push(y * width, y * width + width - 1);
  }
  return indexes;
}

function findDominantBorderColor(data, width, height) {
  const samples = [];
  const bins = new Map();
  for (const index of borderIndexes(width, height)) {
    const offset = index * 4;
    if (data[offset + 3] <= 16) continue;
    const sample = [data[offset], data[offset + 1], data[offset + 2]];
    samples.push(sample);
    const key = `${sample[0] >> 4}:${sample[1] >> 4}:${sample[2] >> 4}`;
    const entry = bins.get(key) ?? { count: 0, values: [] };
    entry.count += 1;
    entry.values.push(sample);
    bins.set(key, entry);
  }

  if (samples.length === 0) {
    return { rgb: [255, 255, 255], lab: rgbToLab(255, 255, 255), confidence: 1 };
  }

  let dominant = null;
  for (const entry of bins.values()) {
    if (!dominant || entry.count > dominant.count) dominant = entry;
  }

  const sorted = [0, 1, 2].map((channel) => dominant.values.map((value) => value[channel]).sort((a, b) => a - b));
  const middle = Math.floor(dominant.values.length / 2);
  const rgb = sorted.map((values) => values[middle]);
  return {
    rgb,
    lab: rgbToLab(...rgb),
    confidence: dominant.count / samples.length,
  };
}

export function createForegroundMask(data, width, height, options = {}) {
  const removeBackground = options.removeBackground ?? true;
  const tolerance = options.tolerance ?? 18;
  const size = width * height;
  const mask = new Uint8Array(size);
  let originallyVisible = 0;

  for (let index = 0; index < size; index += 1) {
    if (data[index * 4 + 3] > 16) {
      mask[index] = 1;
      originallyVisible += 1;
    }
  }

  const background = findDominantBorderColor(data, width, height);
  if (!removeBackground || originallyVisible === 0) {
    return {
      mask,
      background,
      originallyVisible,
      removedOpaque: 0,
      foregroundCount: originallyVisible,
    };
  }

  const candidate = new Uint8Array(size);
  for (let index = 0; index < size; index += 1) {
    const offset = index * 4;
    if (data[offset + 3] <= 16) {
      candidate[index] = 1;
      continue;
    }
    const lab = rgbToLab(data[offset], data[offset + 1], data[offset + 2]);
    if (labDistance(lab, background.lab) <= tolerance) candidate[index] = 1;
  }

  const visited = new Uint8Array(size);
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;
  const enqueue = (index) => {
    if (!visited[index] && candidate[index]) {
      visited[index] = 1;
      queue[tail] = index;
      tail += 1;
    }
  };
  for (const index of borderIndexes(width, height)) enqueue(index);

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y + 1 < height) enqueue(index + width);
  }

  let removedOpaque = 0;
  let foregroundCount = 0;
  for (let index = 0; index < size; index += 1) {
    const alpha = data[index * 4 + 3];
    if (alpha <= 16 || visited[index]) {
      if (alpha > 16 && visited[index]) removedOpaque += 1;
      mask[index] = 0;
    } else {
      mask[index] = 1;
      foregroundCount += 1;
    }
  }

  return { mask, background, originallyVisible, removedOpaque, foregroundCount };
}

export function quantizeToGrid(data, width, height, mask, options = {}) {
  const gridSize = options.gridSize ?? GRID_SIZE;
  const coverageThreshold = options.coverageThreshold ?? COVERAGE_THRESHOLD;
  const clarityEnhancement = options.clarityEnhancement ?? true;
  if (!SUPPORTED_GRID_SIZES.includes(gridSize)) {
    throw new RangeError(`unsupported grid size: ${gridSize}`);
  }

  const sampledCells = new Array(gridSize * gridSize).fill(null);
  const counts = {};

  for (let gy = 0; gy < gridSize; gy += 1) {
    const yStart = Math.floor((gy * height) / gridSize);
    const yEnd = Math.floor(((gy + 1) * height) / gridSize);
    for (let gx = 0; gx < gridSize; gx += 1) {
      const xStart = Math.floor((gx * width) / gridSize);
      const xEnd = Math.floor(((gx + 1) * width) / gridSize);
      const blockArea = Math.max(1, (xEnd - xStart) * (yEnd - yStart));
      let coverage = 0;
      let red = 0;
      let green = 0;
      let blue = 0;
      let weight = 0;

      for (let y = yStart; y < yEnd; y += 1) {
        for (let x = xStart; x < xEnd; x += 1) {
          const index = y * width + x;
          if (!mask[index]) continue;
          const offset = index * 4;
          const alpha = data[offset + 3] / 255;
          coverage += alpha;
          weight += alpha;
          red += data[offset] * alpha;
          green += data[offset + 1] * alpha;
          blue += data[offset + 2] * alpha;
        }
      }

      const ratio = coverage / blockArea;
      if (ratio < coverageThreshold || weight === 0) continue;
      sampledCells[gy * gridSize + gx] = {
        rgb: [red / weight, green / weight, blue / weight],
        coverage: ratio,
        x: gx,
        y: gy,
      };
    }
  }

  const cells = sampledCells.map((sample, index) => {
    if (!sample) return null;
    let [red, green, blue] = sample.rgb;

    if (clarityEnhancement) {
      const gx = index % gridSize;
      const gy = Math.floor(index / gridSize);
      const neighbours = [];
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const x = gx + dx;
          const y = gy + dy;
          if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;
          const neighbour = sampledCells[y * gridSize + x];
          if (neighbour) neighbours.push(neighbour.rgb);
        }
      }

      if (neighbours.length >= 2) {
        const average = [0, 1, 2].map((channel) => (
          neighbours.reduce((sum, rgb) => sum + rgb[channel], 0) / neighbours.length
        ));
        const sharpenAmount = gridSize === 36 ? 0.42 : 0.3;
        red += (red - average[0]) * sharpenAmount;
        green += (green - average[1]) * sharpenAmount;
        blue += (blue - average[2]) * sharpenAmount;
      }

      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      const saturation = gridSize === 36 ? 1.1 : 1.07;
      red = luminance + (red - luminance) * saturation;
      green = luminance + (green - luminance) * saturation;
      blue = luminance + (blue - luminance) * saturation;

      const contrast = gridSize === 36 ? 1.08 : 1.05;
      red = (red - 127.5) * contrast + 127.5;
      green = (green - 127.5) * contrast + 127.5;
      blue = (blue - 127.5) * contrast + 127.5;
    }

    const clamp = (value) => Math.max(0, Math.min(255, value));
    const color = nearestPaletteColor(clamp(red), clamp(green), clamp(blue));
    return { ...color, coverage: sample.coverage, x: sample.x, y: sample.y };
  });

  let beadCount = 0;
  for (const cell of cells) {
    if (cell) {
      counts[cell.code] = (counts[cell.code] ?? 0) + 1;
      beadCount += 1;
    }
  }

  return {
    cells,
    counts,
    beadCount,
    emptyCount: gridSize * gridSize - beadCount,
    usedColorCount: Object.keys(counts).length,
    gridSize,
  };
}

export function maskStats(result) {
  const visible = Math.max(1, result.originallyVisible);
  return {
    removedRatio: result.removedOpaque / visible,
    foregroundRatio: result.foregroundCount / visible,
  };
}
