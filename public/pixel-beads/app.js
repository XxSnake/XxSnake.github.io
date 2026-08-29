import {
  COVERAGE_THRESHOLD,
  GRID_SIZE,
  PALETTE,
  SUPPORTED_GRID_SIZES,
  createForegroundMask,
  maskStats,
  quantizeToGrid,
  recommendGridSize,
} from "./core.js";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const DISPLAY_SIZE = 720;
const PREVIEW_PROCESS_SIZE = 360;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const elements = {
  fileInput: document.querySelector("#file-input"),
  dropZone: document.querySelector("#drop-zone"),
  fileSummary: document.querySelector("#file-summary"),
  fileName: document.querySelector("#file-name"),
  fileMeta: document.querySelector("#file-meta"),
  replaceButton: document.querySelector("#replace-button"),
  recommendedSize: document.querySelector("#recommended-size"),
  recommendedReason: document.querySelector("#recommended-reason"),
  controls: document.querySelector("#controls"),
  zoomRange: document.querySelector("#zoom-range"),
  zoomOutput: document.querySelector("#zoom-output"),
  removeBackground: document.querySelector("#remove-background"),
  toleranceControl: document.querySelector("#tolerance-control"),
  toleranceRange: document.querySelector("#tolerance-range"),
  toleranceOutput: document.querySelector("#tolerance-output"),
  clarityEnhancement: document.querySelector("#clarity-enhancement"),
  resetCrop: document.querySelector("#reset-crop"),
  generateButton: document.querySelector("#generate-button"),
  generateLabel: document.querySelector("#generate-label"),
  status: document.querySelector("#status-message"),
  cropCanvas: document.querySelector("#crop-canvas"),
  cropEmpty: document.querySelector("#crop-empty"),
  cropSizeLabel: document.querySelector("#crop-size-label"),
  resultCanvas: document.querySelector("#result-canvas"),
  resultEmpty: document.querySelector("#result-empty"),
  resultDetails: document.querySelector("#result-details"),
  beadCount: document.querySelector("#bead-count"),
  colorCount: document.querySelector("#color-count"),
  emptyCount: document.querySelector("#empty-count"),
  paletteList: document.querySelector("#palette-list"),
  downloadPreview: document.querySelector("#download-preview"),
  downloadGuide: document.querySelector("#download-guide"),
  downloadDescription: document.querySelector("#download-description"),
};

const cropContext = elements.cropCanvas.getContext("2d", { willReadFrequently: true });
const resultContext = elements.resultCanvas.getContext("2d");
const processCanvas = document.createElement("canvas");
const processContext = processCanvas.getContext("2d", { willReadFrequently: true });
const maskCanvas = document.createElement("canvas");
const maskContext = maskCanvas.getContext("2d");

const state = {
  file: null,
  image: null,
  imageWidth: 0,
  imageHeight: 0,
  gridSize: GRID_SIZE,
  recommendation: null,
  baseScale: 1,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  drag: null,
  result: null,
  maskTimer: null,
  loadToken: 0,
};

function setStatus(message = "", type = "") {
  elements.status.textContent = message;
  elements.status.className = `status-message${type ? ` is-${type}` : ""}`;
}

function fileSizeLabel(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function closeCurrentImage() {
  if (state.image && typeof state.image.close === "function") state.image.close();
  state.image = null;
}

function clampCrop() {
  const drawnWidth = state.imageWidth * state.baseScale * state.zoom;
  const drawnHeight = state.imageHeight * state.baseScale * state.zoom;
  state.offsetX = Math.min(0, Math.max(DISPLAY_SIZE - drawnWidth, state.offsetX));
  state.offsetY = Math.min(0, Math.max(DISPLAY_SIZE - drawnHeight, state.offsetY));
}

function resetCropState() {
  if (!state.image) return;
  state.zoom = 1;
  state.baseScale = Math.max(DISPLAY_SIZE / state.imageWidth, DISPLAY_SIZE / state.imageHeight);
  const drawnWidth = state.imageWidth * state.baseScale;
  const drawnHeight = state.imageHeight * state.baseScale;
  state.offsetX = (DISPLAY_SIZE - drawnWidth) / 2;
  state.offsetY = (DISPLAY_SIZE - drawnHeight) / 2;
  elements.zoomRange.value = "1";
  elements.zoomOutput.value = "100%";
  clampCrop();
  renderRawCrop();
  scheduleMaskPreview(0);
}

function drawSource(context, size) {
  const ratio = size / DISPLAY_SIZE;
  const scale = state.baseScale * state.zoom * ratio;
  context.clearRect(0, 0, size, size);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    state.image,
    state.offsetX * ratio,
    state.offsetY * ratio,
    state.imageWidth * scale,
    state.imageHeight * scale,
  );
}

function renderRawCrop() {
  if (!state.image) return;
  elements.cropCanvas.dataset.offsetX = state.offsetX.toFixed(2);
  elements.cropCanvas.dataset.offsetY = state.offsetY.toFixed(2);
  elements.cropCanvas.dataset.zoom = state.zoom.toFixed(2);
  drawSource(cropContext, DISPLAY_SIZE);
}

function setProcessingSize(size) {
  if (processCanvas.width !== size || processCanvas.height !== size) {
    processCanvas.width = size;
    processCanvas.height = size;
    maskCanvas.width = size;
    maskCanvas.height = size;
  }
}

function processedCrop(size = PREVIEW_PROCESS_SIZE) {
  setProcessingSize(size);
  drawSource(processContext, size);
  const imageData = processContext.getImageData(0, 0, size, size);
  let transparentPixels = 0;
  for (let index = 3; index < imageData.data.length; index += 4) {
    if (imageData.data[index] <= 16) transparentPixels += 1;
  }
  const maskResult = createForegroundMask(imageData.data, size, size, {
    removeBackground: elements.removeBackground.checked,
    tolerance: Number(elements.toleranceRange.value),
  });
  return { imageData, maskResult, transparentPixels, size };
}

function maskWarning(processed) {
  const stats = maskStats(processed.maskResult);
  const intrinsicTransparency = processed.transparentPixels / (processed.size * processed.size);
  if (processed.maskResult.foregroundCount === 0) {
    return { message: "主体已全部变成留白，请降低背景容差或关闭去背景。", type: "error" };
  }
  if (elements.removeBackground.checked && stats.foregroundRatio < 0.025) {
    return { message: "主体几乎被全部移除，请降低背景容差。", type: "warning" };
  }
  if (elements.removeBackground.checked && intrinsicTransparency < 0.02 && stats.removedRatio < 0.01) {
    return { message: "几乎没有识别到可移除背景，可提高容差或换用单色背景图片。", type: "warning" };
  }
  if (elements.removeBackground.checked && processed.maskResult.background.confidence < 0.12 && intrinsicTransparency < 0.02) {
    return { message: "图片边缘颜色较复杂，自动去背景可能不完整。", type: "warning" };
  }
  return null;
}

function renderMaskPreview({ silent = false } = {}) {
  if (!state.image) return null;
  const processed = processedCrop(PREVIEW_PROCESS_SIZE);
  const masked = new ImageData(new Uint8ClampedArray(processed.imageData.data), processed.size, processed.size);
  for (let index = 0; index < processed.maskResult.mask.length; index += 1) {
    if (!processed.maskResult.mask[index]) masked.data[index * 4 + 3] = 0;
  }
  maskContext.clearRect(0, 0, processed.size, processed.size);
  maskContext.putImageData(masked, 0, 0);
  cropContext.clearRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);
  cropContext.imageSmoothingEnabled = true;
  cropContext.imageSmoothingQuality = "high";
  cropContext.drawImage(maskCanvas, 0, 0, DISPLAY_SIZE, DISPLAY_SIZE);

  const recommendation = processed.maskResult.foregroundCount > 0
    ? recommendGridSize(processed.imageData.data, processed.size, processed.size, processed.maskResult.mask)
    : null;
  if (recommendation) syncGridSize(recommendation);
  else resetAutomaticSize({ value: "等待调整", reason: "当前没有识别到有效主体，请调整背景容差或关闭去背景。" });

  const warning = maskWarning(processed);
  if (!silent) {
    if (warning) setStatus(warning.message, warning.type);
    else if (state.imageWidth < state.gridSize * 10 || state.imageHeight < state.gridSize * 10) {
      setStatus(`已自动选择 ${state.gridSize}×${state.gridSize}；原图低于建议的 ${state.gridSize * 10}×${state.gridSize * 10}，细节可能受限。`, "warning");
    } else {
      setStatus(`已自动选择 ${state.gridSize}×${state.gridSize}，可以生成拼豆图。`, "");
    }
  }
  return processed;
}

function scheduleMaskPreview(delay = 90) {
  window.clearTimeout(state.maskTimer);
  state.maskTimer = window.setTimeout(() => renderMaskPreview(), delay);
}

function clearResult() {
  state.result = null;
  elements.resultCanvas.width = DISPLAY_SIZE;
  elements.resultCanvas.height = DISPLAY_SIZE;
  resultContext.clearRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);
  elements.resultEmpty.hidden = false;
  elements.resultDetails.hidden = true;
  elements.beadCount.textContent = "0";
  elements.colorCount.textContent = "0";
  elements.emptyCount.textContent = String(state.gridSize * state.gridSize);
}

function resetAutomaticSize(options = {}) {
  state.gridSize = GRID_SIZE;
  state.recommendation = null;
  elements.recommendedSize.textContent = options.value ?? "等待图片";
  elements.recommendedReason.textContent = options.reason ?? "上传后会分析主体复杂度，选择最小但足够清楚的尺寸。";
  elements.generateLabel.textContent = "分析后生成拼豆图";
  elements.cropSizeLabel.textContent = "AUTO";
  elements.resultCanvas.setAttribute("aria-label", "自动尺寸圆形拼豆效果预览");
  elements.downloadDescription.textContent = "效果图为透明背景圆形拼豆，施工图包含自动选择的完整网格、颜色编号和实际用量。";
  document.body.dataset.gridSize = "pending";
  delete document.body.dataset.recommendationScore;
  clearResult();
}

function syncGridSize(recommendation) {
  const nextSize = recommendation.gridSize;
  if (!SUPPORTED_GRID_SIZES.includes(nextSize)) return;
  state.gridSize = nextSize;
  state.recommendation = recommendation;
  elements.recommendedSize.textContent = `${nextSize} × ${nextSize}`;
  elements.recommendedReason.textContent = recommendation.reason;
  elements.generateLabel.textContent = `生成 ${nextSize}×${nextSize} 拼豆图`;
  elements.cropSizeLabel.textContent = `${nextSize} × ${nextSize}`;
  elements.resultCanvas.setAttribute("aria-label", `${nextSize}乘${nextSize}圆形拼豆效果预览`);
  elements.downloadDescription.textContent = `效果图为透明背景圆形拼豆，施工图包含 ${nextSize}×${nextSize} 网格、颜色编号和实际用量。`;
  document.body.dataset.gridSize = String(nextSize);
  document.body.dataset.recommendationScore = recommendation.score.toFixed(3);
  clearResult();
}

async function decodeImage(file) {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      try { return await createImageBitmap(file); } catch { /* fallback below */ }
    }
  }
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode-failed"));
    };
    image.src = url;
  });
}

async function loadFile(file) {
  if (!file) return;
  if (!ALLOWED_TYPES.has(file.type)) {
    setStatus("文件格式不支持，请选择 JPG、PNG 或 WebP 图片。", "error");
    elements.fileInput.value = "";
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    setStatus("图片超过 20MB，请压缩后重新上传。", "error");
    elements.fileInput.value = "";
    return;
  }

  const token = ++state.loadToken;
  setStatus("正在读取图片…");
  try {
    const image = await decodeImage(file);
    if (token !== state.loadToken) {
      if (typeof image.close === "function") image.close();
      return;
    }
    closeCurrentImage();
    state.image = image;
    state.file = file;
    state.imageWidth = image.naturalWidth || image.width;
    state.imageHeight = image.naturalHeight || image.height;
    elements.dropZone.hidden = true;
    elements.fileSummary.hidden = false;
    elements.fileName.textContent = file.name;
    elements.fileMeta.textContent = `${state.imageWidth} × ${state.imageHeight} · ${fileSizeLabel(file.size)}`;
    elements.controls.disabled = false;
    elements.generateButton.disabled = false;
    elements.cropEmpty.hidden = true;
    elements.cropCanvas.classList.add("has-image");
    resetAutomaticSize();

    resetCropState();
  } catch {
    setStatus("图片无法读取，请确认文件没有损坏并换一张图片。", "error");
  } finally {
    elements.fileInput.value = "";
  }
}

function updateZoom(nextZoom) {
  if (!state.image) return;
  const currentScale = state.baseScale * state.zoom;
  const centerX = (DISPLAY_SIZE / 2 - state.offsetX) / currentScale;
  const centerY = (DISPLAY_SIZE / 2 - state.offsetY) / currentScale;
  state.zoom = nextZoom;
  const nextScale = state.baseScale * state.zoom;
  state.offsetX = DISPLAY_SIZE / 2 - centerX * nextScale;
  state.offsetY = DISPLAY_SIZE / 2 - centerY * nextScale;
  clampCrop();
  elements.zoomOutput.value = `${Math.round(nextZoom * 100)}%`;
  renderRawCrop();
  scheduleMaskPreview();
}

function pointerPosition(event) {
  const rect = elements.cropCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * DISPLAY_SIZE / rect.width,
    y: (event.clientY - rect.top) * DISPLAY_SIZE / rect.height,
  };
}

function startDrag(event) {
  if (!state.image || event.button > 0) return;
  const point = pointerPosition(event);
  state.drag = { pointerId: event.pointerId, x: point.x, y: point.y, offsetX: state.offsetX, offsetY: state.offsetY };
  elements.cropCanvas.setPointerCapture(event.pointerId);
  elements.cropCanvas.classList.add("is-dragging");
}

function moveDrag(event) {
  if (!state.drag || state.drag.pointerId !== event.pointerId) return;
  const point = pointerPosition(event);
  state.offsetX = state.drag.offsetX + point.x - state.drag.x;
  state.offsetY = state.drag.offsetY + point.y - state.drag.y;
  clampCrop();
  renderRawCrop();
}

function endDrag(event) {
  if (!state.drag || state.drag.pointerId !== event.pointerId) return;
  state.drag = null;
  elements.cropCanvas.classList.remove("is-dragging");
  if (elements.cropCanvas.hasPointerCapture(event.pointerId)) elements.cropCanvas.releasePointerCapture(event.pointerId);
  scheduleMaskPreview(0);
}

function drawBead(context, cell, cellSize, gx, gy, withHole = false) {
  const centerX = gx * cellSize + cellSize / 2;
  const centerY = gy * cellSize + cellSize / 2;
  const radius = cellSize * 0.42;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fillStyle = cell.hex;
  context.fill();
  context.lineWidth = Math.max(1, cellSize * 0.025);
  context.strokeStyle = "rgba(0,0,0,.18)";
  context.stroke();
  context.beginPath();
  context.arc(centerX - radius * .28, centerY - radius * .3, radius * .16, 0, Math.PI * 2);
  context.fillStyle = "rgba(255,255,255,.18)";
  context.fill();
  if (withHole) {
    context.save();
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(centerX, centerY, radius * .22, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

function renderResult() {
  resultContext.clearRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);
  const cellSize = DISPLAY_SIZE / state.result.gridSize;
  state.result.cells.forEach((cell, index) => {
    if (!cell) return;
    drawBead(resultContext, cell, cellSize, index % state.result.gridSize, Math.floor(index / state.result.gridSize), true);
  });
  elements.resultCanvas.dataset.beadCount = String(state.result.beadCount);
  elements.resultCanvas.dataset.emptyCount = String(state.result.emptyCount);
  elements.resultCanvas.dataset.gridSize = String(state.result.gridSize);
  elements.resultEmpty.hidden = true;
}

function updateResultDetails() {
  elements.beadCount.textContent = String(state.result.beadCount);
  elements.colorCount.textContent = String(state.result.usedColorCount);
  elements.emptyCount.textContent = String(state.result.emptyCount);
  elements.paletteList.replaceChildren();
  for (const color of PALETTE) {
    const count = state.result.counts[color.code];
    if (!count) continue;
    const item = document.createElement("div");
    item.className = "palette-item";
    item.innerHTML = `<span class="palette-swatch" style="background:${color.hex}"></span><strong>${color.code}</strong><span>${count} 颗</span>`;
    elements.paletteList.append(item);
  }
  elements.resultDetails.hidden = false;
}

function generate() {
  if (!state.image) return;
  const processingSize = Math.max(PREVIEW_PROCESS_SIZE, state.gridSize * 6);
  const processed = processedCrop(processingSize);
  const warning = maskWarning(processed);
  if (processed.maskResult.foregroundCount === 0) {
    setStatus(warning.message, "error");
    return;
  }
  state.result = quantizeToGrid(
    processed.imageData.data,
    processed.size,
    processed.size,
    processed.maskResult.mask,
    {
      gridSize: state.gridSize,
      coverageThreshold: COVERAGE_THRESHOLD,
      clarityEnhancement: elements.clarityEnhancement.checked,
    },
  );
  if (state.result.beadCount === 0) {
    setStatus("主体太小，没有格子达到放豆标准；请放大主体或降低背景容差。", "error");
    return;
  }
  renderResult();
  updateResultDetails();
  const suffix = warning ? ` ${warning.message}` : "";
  setStatus(`已生成 ${state.gridSize}×${state.gridSize}：${state.result.beadCount} 颗拼豆，使用 ${state.result.usedColorCount} 种颜色。${suffix}`, warning?.type ?? "");
}

function downloadCanvas(canvas, filename) {
  try {
    const url = canvas.toDataURL("image/png");
    document.body.dataset.lastDownload = filename;
    document.body.dataset.lastDownloadWidth = String(canvas.width);
    document.body.dataset.lastDownloadHeight = String(canvas.height);
    document.body.dataset.lastDownloadType = url.startsWith("data:image/png") ? "image/png" : "unknown";
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setStatus(`已开始下载 ${filename}`);
  } catch {
    setStatus("图片导出失败，请刷新页面后重试。", "error");
  }
}

function makePreviewCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 1440;
  canvas.height = 1440;
  const context = canvas.getContext("2d");
  const cellSize = canvas.width / state.result.gridSize;
  state.result.cells.forEach((cell, index) => {
    if (!cell) return;
    drawBead(context, cell, cellSize, index % state.result.gridSize, Math.floor(index / state.result.gridSize), true);
  });
  return canvas;
}

function contrastText(hex) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.58 ? "#1c1c19" : "#ffffff";
}

function makeGuideCanvas() {
  const gridSize = state.result.gridSize;
  const cellSize = gridSize === 36 ? 60 : (gridSize === 72 ? 48 : 36);
  const width = gridSize * cellSize;
  const headerHeight = gridSize === 36 ? 220 : 260;
  const gridHeight = gridSize * cellSize;
  const usedColors = PALETTE.filter((color) => state.result.counts[color.code]);
  const columns = gridSize === 36 ? 4 : 6;
  const rows = Math.ceil(usedColors.length / columns);
  const legendTop = headerHeight + gridHeight + (gridSize === 36 ? 120 : 160);
  const height = legendTop + Math.max(1, rows) * 72 + 120;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#fbfaf6";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#1d1d1b";
  context.font = "700 58px 'Microsoft YaHei', sans-serif";
  context.fillText(`${gridSize} × ${gridSize} 拼豆施工图`, 60, 90);
  context.fillStyle = "#e87c32";
  context.font = "700 24px ui-monospace, monospace";
  context.fillText("PIXEL BEADS / COLOR-CODED GUIDE", 60, 138);
  context.fillStyle = "#66645f";
  context.font = "26px 'Microsoft YaHei', sans-serif";
  context.textAlign = "right";
  context.fillText(`${state.result.beadCount} 颗 · ${state.result.usedColorCount} 色 · ${state.result.emptyCount} 格留白`, width - 60, 105);
  context.textAlign = "left";

  state.result.cells.forEach((cell, index) => {
    const gx = index % gridSize;
    const gy = Math.floor(index / gridSize);
    const x = gx * cellSize;
    const y = headerHeight + gy * cellSize;
    context.fillStyle = cell ? cell.hex : "#ffffff";
    context.fillRect(x, y, cellSize, cellSize);
    if (cell) {
      context.fillStyle = contrastText(cell.hex);
      const fontSize = gridSize === 36
        ? (cell.code.length > 2 ? 15 : 18)
        : (gridSize === 72 ? (cell.code.length > 2 ? 13 : 15) : (cell.code.length > 2 ? 10 : 12));
      context.font = `700 ${fontSize}px ui-monospace, monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(cell.code, x + cellSize / 2, y + cellSize / 2 + 1);
    }
  });

  context.strokeStyle = "rgba(35,35,31,.42)";
  context.lineWidth = 1;
  context.beginPath();
  for (let index = 0; index <= gridSize; index += 1) {
    const position = index * cellSize + .5;
    context.moveTo(position, headerHeight);
    context.lineTo(position, headerHeight + gridHeight);
    context.moveTo(0, headerHeight + position);
    context.lineTo(width, headerHeight + position);
  }
  context.stroke();

  if (gridSize >= 72) {
    context.strokeStyle = "rgba(232,124,50,.95)";
    context.lineWidth = 4;
    context.beginPath();
    for (let index = 36; index < gridSize; index += 36) {
      const position = index * cellSize;
      context.moveTo(position, headerHeight);
      context.lineTo(position, headerHeight + gridHeight);
      context.moveTo(0, headerHeight + position);
      context.lineTo(width, headerHeight + position);
    }
    context.stroke();
  }

  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillStyle = "#1d1d1b";
  context.font = "700 34px 'Microsoft YaHei', sans-serif";
  context.fillText("颜色用量", 60, legendTop - 45);
  context.fillStyle = "#66645f";
  context.font = "22px 'Microsoft YaHei', sans-serif";
  context.fillText("空白格不放豆，数量仅统计图中实际使用的颜色。", 240, legendTop - 45);

  const columnWidth = (width - 120) / columns;
  usedColors.forEach((color, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = 60 + column * columnWidth;
    const y = legendTop + row * 72;
    context.fillStyle = color.hex;
    context.beginPath();
    context.arc(x + 24, y + 24, 20, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(0,0,0,.18)";
    context.stroke();
    context.fillStyle = "#1d1d1b";
    context.font = "700 24px ui-monospace, monospace";
    context.fillText(color.code, x + 58, y + 32);
    context.fillStyle = "#66645f";
    context.font = "22px 'Microsoft YaHei', sans-serif";
    context.fillText(`${state.result.counts[color.code]} 颗`, x + 145, y + 32);
  });

  context.fillStyle = "#66645f";
  context.font = "18px 'Microsoft YaHei', sans-serif";
  context.fillText("色值依据用户提供的实拍色卡近似提取，实体颜色可能因光线与批次存在差异。", 60, height - 50);
  context.textAlign = "right";
  context.fillText("xxsnake.github.io/pixel-beads/", width - 60, height - 50);
  return canvas;
}

elements.fileInput.addEventListener("change", (event) => loadFile(event.target.files?.[0]));
elements.replaceButton.addEventListener("click", () => elements.fileInput.click());
elements.dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  elements.dropZone.classList.add("is-dragging");
});
elements.dropZone.addEventListener("dragleave", () => elements.dropZone.classList.remove("is-dragging"));
elements.dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  elements.dropZone.classList.remove("is-dragging");
  loadFile(event.dataTransfer?.files?.[0]);
});
elements.zoomRange.addEventListener("input", () => updateZoom(Number(elements.zoomRange.value)));
elements.removeBackground.addEventListener("change", () => {
  elements.toleranceControl.hidden = !elements.removeBackground.checked;
  scheduleMaskPreview(0);
});
elements.clarityEnhancement.addEventListener("change", () => {
  if (state.result) clearResult();
  if (state.image) setStatus(`清晰增强已${elements.clarityEnhancement.checked ? "开启" : "关闭"}，请重新生成查看效果。`);
});
elements.toleranceRange.addEventListener("input", () => {
  elements.toleranceOutput.value = elements.toleranceRange.value;
  scheduleMaskPreview();
});
elements.resetCrop.addEventListener("click", resetCropState);
elements.generateButton.addEventListener("click", generate);
elements.cropCanvas.addEventListener("pointerdown", startDrag);
elements.cropCanvas.addEventListener("pointermove", moveDrag);
elements.cropCanvas.addEventListener("pointerup", endDrag);
elements.cropCanvas.addEventListener("pointercancel", endDrag);
elements.downloadPreview.addEventListener("click", () => {
  if (state.result) downloadCanvas(makePreviewCanvas(), `pixel-beads-preview-${state.result.gridSize}x${state.result.gridSize}.png`);
});
elements.downloadGuide.addEventListener("click", () => {
  if (state.result) downloadCanvas(makeGuideCanvas(), `pixel-beads-guide-${state.result.gridSize}x${state.result.gridSize}.png`);
});

window.__PIXEL_BEADS__ = {
  GRID_SIZE,
  SUPPORTED_GRID_SIZES,
  PALETTE,
  getState: () => ({
    hasImage: Boolean(state.image),
    gridSize: state.gridSize,
    zoom: state.zoom,
    offsetX: state.offsetX,
    offsetY: state.offsetY,
    removeBackground: elements.removeBackground.checked,
    tolerance: Number(elements.toleranceRange.value),
    beadCount: state.result?.beadCount ?? 0,
    emptyCount: state.result?.emptyCount ?? state.gridSize * state.gridSize,
    usedColorCount: state.result?.usedColorCount ?? 0,
    clarityEnhancement: elements.clarityEnhancement.checked,
    recommendation: state.recommendation ? {
      gridSize: state.recommendation.gridSize,
      score: state.recommendation.score,
      edgeDensity: state.recommendation.edgeDensity,
      colorBinCount: state.recommendation.colorBinCount,
      boundaryComplexity: state.recommendation.boundaryComplexity,
    } : null,
  }),
};

resetAutomaticSize();
