/**
 * CropModal — Crop image with aspect-ratio presets + drag/resize crop box.
 *
 * Props:
 *   imageUrl   — URL of the image to crop
 *   aspectRatio — '2:1' | '16:9' | '1:1' | '4:3' | null (free)
 *   onApply(url) — called with cropped image URL on confirm
 *   onClose()   — called to dismiss modal
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from 'antd';
import styles from '../../assets/styles/common/CropModal.module.css';

// Inline SVG icons — avoids missing @ant-design/icons exports
const IconCrop = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.75 6A1.75 1.75 0 0 0 16 7.75v10.5A1.75 1.75 0 0 0 17.75 20h4.25A1.75 1.75 0 0 0 23.75 18.25V6H17.75zm4.25 11.5H17V7.75A1.75 1.75 0 0 0 15.25 6H6v2.25A1.75 1.75 0 0 0 7.75 10h12.25v7.5z"/>
    <circle cx="10" cy="15" r="2"/>
  </svg>
);

const IconRotate = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v5.69L5.93 5.12a.75.75 0 0 0-1.06 1.06l4.5 4.5a.75.75 0 0 0 1.06 0l4.5-4.5a.75.75 0 0 0-1.06-1.06L10.75 8.44V2.75z"/>
    <path d="M20.75 12.75a.75.75 0 0 0-1.5 0v5.44l-3.33-3.32a.75.75 0 0 0-1.06 1.06l4.5 4.5a.75.75 0 0 0 1.06 0l4.5-4.5a.75.75 0 0 0-1.06-1.06L20.75 17.94v-5.19z"/>
    <path d="M13.5 5.5a.75.75 0 0 1 1.5 0V15a.75.75 0 0 1-1.5 0V5.5z"/>
  </svg>
);

const IconZoomIn = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5zM9.75 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zm3.75 3a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zm-.75 6h5.25V11h-5.25v1.5z"/>
    <path d="M4.75 9a7.25 7.25 0 0 1 12.95-.68l3.58 3.58a.75.75 0 1 1-1.06 1.06l-3.58-3.58A7.25 7.25 0 0 1 4.75 9zm1.5 0a5.75 5.75 0 1 0 11.5 0 5.75 5.75 0 0 0-11.5 0z"/>
  </svg>
);

const IconZoomOut = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5zM9.75 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zm.75 6h5.25V11H10.5v1.5z"/>
    <path d="M4.75 9a7.25 7.25 0 0 1 12.95-.68l3.58 3.58a.75.75 0 1 1-1.06 1.06l-3.58-3.58A7.25 7.25 0 0 1 4.75 9zm1.5 0a5.75 5.75 0 1 0 11.5 0 5.75 5.75 0 0 0-11.5 0z"/>
  </svg>
);

const RATIOS = [
  { label: '2:1', value: 2 },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '1:1', value: 1 },
  { label: 'Tự do', value: null },
];

/** Scale image to CONTAIN container (shows full image without cropping). */
function getImageLayout(img, rectWidth, rectHeight, zoom = 1) {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) {
    return { displayW: 0, displayH: 0, offsetX: 0, offsetY: 0 };
  }
  const scaleX = rectWidth / nw;
  const scaleY = rectHeight / nh;
  // Use Math.min to ensure full image is visible (CONTAIN mode)
  const base = Math.min(scaleX, scaleY) * zoom;
  const displayW = nw * base;
  const displayH = nh * base;
  const offsetX = (rectWidth - displayW) / 2;
  const offsetY = (rectHeight - displayH) / 2;
  return { displayW, displayH, offsetX, offsetY };
}

export default function CropModal({ imageUrl, aspectRatio, onApply, onClose }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Current ratio as a number or null
  const ratioValue = (() => {
    const found = RATIOS.find((r) => r.label === aspectRatio || String(r.value) === aspectRatio);
    return found ? found.value : null;
  })();

  const [selectedRatio, setSelectedRatio] = useState(ratioValue);
  const [cropBox, setCropBox] = useState(null); // { x, y, w, h } in canvas / viewport coords
  const [cursorStyle, setCursorStyle] = useState('default');
  const [cropSize, setCropSize] = useState({ width: 0, height: 0 }); // Final crop dimensions in pixels

  const containerRef = useRef(null);
  const dragState = useRef(null);
  const lastContainerSizeRef = useRef({ w: 0, h: 0 });
  /** Avoid stale ratio/scale inside image load + ResizeObserver (modal animation skews first measure). */
  const selectedRatioRef = useRef(selectedRatio);
  selectedRatioRef.current = selectedRatio;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  const initCropBox = useCallback((img, container, ratio, zoom = 1) => {
    if (!container || !img?.naturalWidth) {
return;
}
    const rect = container.getBoundingClientRect();
    const rw = rect.width;
    const rh = rect.height;
    // Modal open animation: first reads are often ~0 or too small — skip until layout is real
    if (rw < 48 || rh < 48) {
return;
}

    const { displayW } = getImageLayout(img, rw, rh, zoom);

    // Crop box: ~85% of viewport (image already covers viewport with cover mode)
    let boxW = Math.min(rw * 0.88, displayW * 0.92);
    let boxH = ratio != null ? boxW / ratio : boxW * 0.56;
    if (ratio == null) {
      boxH = Math.min(boxH, rh * 0.88);
    }
    if (boxH > rh * 0.88) {
      boxH = rh * 0.88;
      boxW = ratio != null ? boxH * ratio : Math.min(boxW, rw * 0.88);
    }
    if (boxW > rw * 0.88) {
      boxW = rw * 0.88;
      if (ratio != null) {
boxH = boxW / ratio;
}
    }

    const boxX = (rw - boxW) / 2;
    const boxY = (rh - boxH) / 2;
    setCropBox({ x: boxX, y: boxY, w: boxW, h: boxH });
  }, []);

  // ── Load image ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setCropBox(null);
    lastContainerSizeRef.current = { w: 0, h: 0 };
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setLoading(false);
      // After paint: modal layout + canvas mount — first setTimeout(50) often still sees wrong rect
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          initCropBox(img, containerRef.current, selectedRatioRef.current, scaleRef.current);
        });
      });
    };
    img.onerror = () => {
      setLoading(false);
    };
    img.src = imageUrl;
  }, [imageUrl, initCropBox]);

  // ── When preview area gets real size (modal animation / resize), re-fit crop + bitmap ──
  useEffect(() => {
    if (loading) {
return undefined;
}
    const el = containerRef.current;
    const img = imgRef.current;
    if (!el || !img?.naturalWidth) {
return undefined;
}

    const syncIfSizeChanged = () => {
      const r = el.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      if (w < 48 || h < 48) {
return;
}
      const prev = lastContainerSizeRef.current;
      if (prev.w === w && prev.h === h) {
return;
}
      initCropBox(img, el, selectedRatioRef.current, scaleRef.current);
      lastContainerSizeRef.current = { w, h };
    };

    syncIfSizeChanged();
    if (typeof ResizeObserver === 'undefined') {
return undefined;
}
    const ro = new ResizeObserver(() => {
      syncIfSizeChanged();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, initCropBox]);

  // ── Draw canvas ─────────────────────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const container = containerRef.current;
    if (!canvas || !img || !container || !cropBox) {
return;
}

    const ctx = canvas.getContext('2d');
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const { displayW, displayH, offsetX, offsetY } = getImageLayout(img, rect.width, rect.height, scale);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Draw image
    ctx.drawImage(img, offsetX, offsetY, displayW, displayH);

    // Draw crop box border (blue)
    ctx.strokeStyle = '#1a56db';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);

    // Draw 8 handles: 4 corners + 4 edges (blue squares)
    const handleSize = 8;
    const halfHandle = handleSize / 2;
    ctx.fillStyle = '#1a56db';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;

    // Corner handles
    const corners = [
      [cropBox.x, cropBox.y], // NW
      [cropBox.x + cropBox.w, cropBox.y], // NE
      [cropBox.x, cropBox.y + cropBox.h], // SW
      [cropBox.x + cropBox.w, cropBox.y + cropBox.h], // SE
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillRect(cx - halfHandle, cy - halfHandle, handleSize, handleSize);
      ctx.strokeRect(cx - halfHandle, cy - halfHandle, handleSize, handleSize);
    });

    // Edge handles (midpoints)
    const edges = [
      [cropBox.x + cropBox.w / 2, cropBox.y], // N
      [cropBox.x + cropBox.w / 2, cropBox.y + cropBox.h], // S
      [cropBox.x, cropBox.y + cropBox.h / 2], // W
      [cropBox.x + cropBox.w, cropBox.y + cropBox.h / 2], // E
    ];
    edges.forEach(([ex, ey]) => {
      ctx.fillRect(ex - halfHandle, ey - halfHandle, handleSize, handleSize);
      ctx.strokeRect(ex - halfHandle, ey - halfHandle, handleSize, handleSize);
    });

    ctx.restore();
  }, [cropBox, scale, rotation]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas, cropBox, rotation]);

  // ── Calculate final crop dimensions ─────────────────────────────────────────
  useEffect(() => {
    if (!cropBox || !imgRef.current || !containerRef.current) {
      setCropSize({ width: 0, height: 0 });
      return;
    }
    const img = imgRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const { displayW, displayH, offsetX, offsetY } = getImageLayout(img, rect.width, rect.height, scale);

    // Map crop rect from canvas coords → natural image pixels
    const relX = cropBox.x - offsetX;
    const relY = cropBox.y - offsetY;
    let sx = (relX / displayW) * img.naturalWidth;
    let sy = (relY / displayH) * img.naturalHeight;
    let sw = (cropBox.w / displayW) * img.naturalWidth;
    let sh = (cropBox.h / displayH) * img.naturalHeight;

    sx = Math.max(0, Math.min(sx, img.naturalWidth - 1));
    sy = Math.max(0, Math.min(sy, img.naturalHeight - 1));
    sw = Math.max(1, Math.min(sw, img.naturalWidth - sx));
    sh = Math.max(1, Math.min(sh, img.naturalHeight - sy));

    setCropSize({ width: Math.round(sw), height: Math.round(sh) });
  }, [cropBox, scale]);

  // ── Drag / resize handlers ──────────────────────────────────────────────────
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) {
return { x: 0, y: 0 };
}
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / (rect.width || 1);
    const sy = canvas.height / (rect.height || 1);
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
    };
  };

  const hitTest = (pos, crop, handle) => {
    const pad = 8;
    const { x, y, w, h } = crop;
    if (handle === 'move') {
      return pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h;
    }
    if (handle === 'nw') {
return pos.x >= x - pad && pos.x <= x + pad && pos.y >= y - pad && pos.y <= y + pad;
}
    if (handle === 'ne') {
return pos.x >= x + w - pad && pos.x <= x + w + pad && pos.y >= y - pad && pos.y <= y + pad;
}
    if (handle === 'sw') {
return pos.x >= x - pad && pos.x <= x + pad && pos.y >= y + h - pad && pos.y <= y + h + pad;
}
    if (handle === 'se') {
return pos.x >= x + w - pad && pos.x <= x + w + pad && pos.y >= y + h - pad && pos.y <= y + h + pad;
}
    if (handle === 'n') {
return pos.x >= x + pad && pos.x <= x + w - pad && pos.y >= y - pad && pos.y <= y + pad;
}
    if (handle === 's') {
return pos.x >= x + pad && pos.x <= x + w - pad && pos.y >= y + h - pad && pos.y <= y + h + pad;
}
    if (handle === 'w') {
return pos.x >= x - pad && pos.x <= x + pad && pos.y >= y + pad && pos.y <= y + h - pad;
}
    if (handle === 'e') {
return pos.x >= x + w - pad && pos.x <= x + w + pad && pos.y >= y + pad && pos.y <= y + h - pad;
}
    return false;
  };

  const getCursor = (handle) => {
    const map = {
      move: 'move', nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize',
      n: 'n-resize', s: 's-resize', w: 'w-resize', e: 'e-resize',
    };
    return map[handle] || 'default';
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    const pos = getCanvasPos(e);

    const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];
    let hit = null;
    for (const h of handles) {
      if (hitTest(pos, cropBox, h)) {
 hit = h; break; 
}
    }
    if (!hit && hitTest(pos, cropBox, 'move')) {
hit = 'move';
}
    if (!hit) {
return;
}

    dragState.current = { handle: hit, startX: pos.x, startY: pos.y, origBox: { ...cropBox } };
  };

  const handleMouseMove = useCallback((e) => {
    const pos = getCanvasPos(e);

    if (!dragState.current || !cropBox) {
      // Update cursor without dragging
      const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];
      for (const h of handles) {
        if (hitTest(pos, cropBox, h)) {
 setCursorStyle(getCursor(h)); return; 
}
      }
      if (cropBox && hitTest(pos, cropBox, 'move')) {
        setCursorStyle('move');
      } else {
        setCursorStyle('default');
      }
      return;
    }

    // Dragging
    const { handle, startX, startY, origBox } = dragState.current;
    const dx = pos.x - startX;
    const dy = pos.y - startY;
    const ratio = selectedRatio;
    let { x, y, w, h } = origBox;

    if (handle === 'move') {
      x += dx; y += dy;
    } else if (handle === 'se') {
      w = Math.max(40, origBox.w + dx);
      h = ratio != null ? w / ratio : Math.max(40, origBox.h + dy);
      if (ratio == null && e.shiftKey) {
h = Math.max(40, origBox.h + dy);
}
    } else if (handle === 'nw') {
      const nwW = Math.max(40, origBox.w - dx);
      const nwH = ratio != null ? nwW / ratio : Math.max(40, origBox.h - dy);
      x = origBox.x + dx; y = origBox.y + dy;
      w = nwW; h = nwH;
    } else if (handle === 'ne') {
      w = Math.max(40, origBox.w + dx);
      h = ratio != null ? w / ratio : Math.max(40, origBox.h - dy);
      y = origBox.y + dy;
    } else if (handle === 'sw') {
      const swW = Math.max(40, origBox.w - dx);
      const swH = ratio != null ? swW / ratio : Math.max(40, origBox.h + dy);
      x = origBox.x + dx; y = origBox.y + dy;
      w = swW; h = swH;
    } else if (handle === 'n') {
      h = Math.max(40, origBox.h - dy);
      y = origBox.y + dy;
      if (ratio != null) {
w = h * ratio;
}
    } else if (handle === 's') {
      h = Math.max(40, origBox.h + dy);
      if (ratio != null) {
w = h * ratio;
}
    } else if (handle === 'w') {
      w = Math.max(40, origBox.w - dx);
      x = origBox.x + dx;
      if (ratio != null) {
h = w / ratio;
}
    } else if (handle === 'e') {
      w = Math.max(40, origBox.w + dx);
      if (ratio != null) {
h = w / ratio;
}
    }

    // Clamp to canvas
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      x = Math.max(0, Math.min(x, rect.width - w));
      y = Math.max(0, Math.min(y, rect.height - h));
      w = Math.min(w, rect.width - x);
      h = Math.min(h, rect.height - y);
    }

    setCropBox({ x, y, w, h });
  }, [cropBox, selectedRatio]);

  const handleMouseUp = useCallback(() => {
    dragState.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ── Apply crop ─────────────────────────────────────────────────────────────
  const handleApply = async () => {
    const img = imgRef.current;
    if (!img || !cropBox) {
return;
}

    const container = containerRef.current;
    if (!container) {
return;
}
    const rect = container.getBoundingClientRect();

    const { displayW, displayH, offsetX, offsetY } = getImageLayout(img, rect.width, rect.height, scale);
    if (!displayW || !displayH) {
return;
}

    // Map crop rect from canvas coords → natural image pixels (matches drawCanvas layout)
    const relX = cropBox.x - offsetX;
    const relY = cropBox.y - offsetY;
    let sx = (relX / displayW) * img.naturalWidth;
    let sy = (relY / displayH) * img.naturalHeight;
    let sw = (cropBox.w / displayW) * img.naturalWidth;
    let sh = (cropBox.h / displayH) * img.naturalHeight;

    sx = Math.max(0, Math.min(sx, img.naturalWidth - 1));
    sy = Math.max(0, Math.min(sy, img.naturalHeight - 1));
    sw = Math.max(1, Math.min(sw, img.naturalWidth - sx));
    sh = Math.max(1, Math.min(sh, img.naturalHeight - sy));

    if (rotation !== 0) {
      // Export what user sees: render with same transform as preview, then sample bitmap pixels
      const v = document.createElement('canvas');
      v.width = Math.round(rect.width);
      v.height = Math.round(rect.height);
      const vctx = v.getContext('2d');
      vctx.save();
      vctx.translate(v.width / 2, v.height / 2);
      vctx.rotate((rotation * Math.PI) / 180);
      vctx.translate(-v.width / 2, -v.height / 2);
      vctx.drawImage(img, offsetX, offsetY, displayW, displayH);
      vctx.restore();

      const outCanvas = document.createElement('canvas');
      const px = Math.max(1, Math.round(cropBox.w));
      const py = Math.max(1, Math.round(cropBox.h));
      outCanvas.width = px;
      outCanvas.height = py;
      const ctx = outCanvas.getContext('2d');
      ctx.drawImage(
        v,
        Math.round(cropBox.x),
        Math.round(cropBox.y),
        px,
        py,
        0,
        0,
        px,
        py,
      );

      outCanvas.toBlob((blob) => {
        if (!blob) {
return;
}
        const formData = new FormData();
        formData.append('image', blob, 'cropped.jpg');
        fetch('/api/upload/single', { method: 'POST', body: formData })
          .then((r) => r.json())
          .then((data) => {
            const url = data?.data?.url || data?.url;
            if (url) {
onApply(url);
}
          })
          .catch(() => {
            onApply(outCanvas.toDataURL('image/jpeg', 0.92));
          });
      }, 'image/jpeg', 0.92);
      return;
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = Math.round(sw);
    outCanvas.height = Math.round(sh);
    const ctx = outCanvas.getContext('2d');
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outCanvas.width, outCanvas.height);

    outCanvas.toBlob((blob) => {
      if (!blob) {
return;
}
      const formData = new FormData();
      formData.append('image', blob, 'cropped.jpg');
      fetch('/api/upload/single', { method: 'POST', body: formData })
        .then((r) => r.json())
        .then((data) => {
          const url = data?.data?.url || data?.url;
          if (url) {
onApply(url);
}
        })
        .catch(() => {
          // Fallback: use data URL
          onApply(outCanvas.toDataURL('image/jpeg', 0.92));
        });
    }, 'image/jpeg', 0.92);
  };

  const handleRatioChange = (ratio) => {
    setSelectedRatio(ratio);
    if (!cropBox || !containerRef.current) {
return;
}
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    // Resize box to fit new ratio, centered
    let newW = cropBox.w;
    let newH = ratio != null ? newW / ratio : cropBox.h;
    if (newH > rect.height * 0.85) {
      newH = rect.height * 0.85;
      newW = ratio != null ? newH * ratio : cropBox.w;
    }
    const newX = Math.max(0, Math.min(cropBox.x, rect.width - newW));
    const newY = Math.max(0, Math.min(cropBox.y, rect.height - newH));
    setCropBox({ x: newX, y: newY, w: newW, h: newH });
  };

  return (
    <Modal
      open
      title={null}
      footer={null}
      onCancel={onClose}
      width={720}
      centered
      className={styles.modal}
      destroyOnClose
      closable={false}
      afterOpenChange={(open) => {
        if (!open) {
return;
}
        const img = imgRef.current;
        const el = containerRef.current;
        if (!img?.naturalWidth || !el) {
return;
}
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            lastContainerSizeRef.current = { w: 0, h: 0 };
            initCropBox(img, el, selectedRatioRef.current, scaleRef.current);
          });
        });
      }}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>
            Chỉnh sửa hình ảnh
            <button type="button" className={styles.helpIcon} title="Trợ giúp">
              <i className="bi bi-question-circle" />
            </button>
          </h3>
          <p className={styles.recommendedSize}>
            Kích thước đề xuất: <strong>1200px * 100-4800px</strong>
          </p>
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <div className={styles.canvasWrap} ref={containerRef}>
        {loading ? (
          <div className={styles.loading}>Dang tai hinh…</div>
        ) : (
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            style={{ cursor: cursorStyle }}
          />
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          {cropSize.width > 0 && cropSize.height > 0 && (
            <span className={styles.sizeText}>
              Kích thước hình ảnh sau khi cắt: <strong>{cropSize.width}px * {cropSize.height}px</strong>
            </span>
          )}
        </div>
        <div className={styles.footerRight}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Hủy</button>
          <button type="button" className={styles.confirmBtn} onClick={handleApply}>Xác nhận</button>
        </div>
      </div>
    </Modal>
  );
}
