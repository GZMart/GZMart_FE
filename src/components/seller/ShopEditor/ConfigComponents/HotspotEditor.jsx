/**
 * HotspotEditor — Interactive overlay for drawing clickable areas on a banner image.
 *
 * Opens as a modal overlay. User can:
 * - Draw rectangles by click+drag
 * - Each rectangle must have a link
 * - Max 10 hotspots, min 60x60px per hotspot
 * - Delete existing hotspots
 * - Visual preview of hotspot positions on the image
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'antd';
import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

const MAX_HOTSPOTS = 10;
const MIN_HOTSPOT_SIZE = 60; // pixels

const PRESET_LINKS = [
  { value: '', label: 'Chọn đường dẫn...' },
  { value: '/products', label: 'Trang sản phẩm' },
  { value: '/categories', label: 'Danh mục' },
  { value: '/', label: 'Trang chủ' },
];

export default function HotspotEditor({ image, hotspots = [], onSave }) {
  const [localHotspots, setLocalHotspots] = useState(hotspots);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [editingLinkIndex, setEditingLinkIndex] = useState(null);
  const [linkInput, setLinkInput] = useState('');
  const imageRef = useRef(null);

  useEffect(() => {
    setLocalHotspots(hotspots);
  }, [hotspots]);

  const getRelativePos = useCallback((e) => {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (localHotspots.length >= MAX_HOTSPOTS) return;
    const pos = getRelativePos(e);
    setDrawing(true);
    setDrawStart(pos);
    setCurrentRect({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
  }, [localHotspots.length, getRelativePos]);

  const handleMouseMove = useCallback((e) => {
    if (!drawing || !drawStart) return;
    const pos = getRelativePos(e);
    setCurrentRect({
      x1: Math.min(drawStart.x, pos.x),
      y1: Math.min(drawStart.y, pos.y),
      x2: Math.max(drawStart.x, pos.x),
      y2: Math.max(drawStart.y, pos.y),
    });
  }, [drawing, drawStart, getRelativePos]);

  const handleMouseUp = useCallback(() => {
    if (!drawing || !currentRect) return;
    setDrawing(false);
    setDrawStart(null);

    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pixelW = ((currentRect.x2 - currentRect.x1) / 100) * rect.width;
    const pixelH = ((currentRect.y2 - currentRect.y1) / 100) * rect.height;

    if (pixelW < MIN_HOTSPOT_SIZE || pixelH < MIN_HOTSPOT_SIZE) {
      console.warn(`Hotspot too small: ${Math.round(pixelW)}x${Math.round(pixelH)}px (min ${MIN_HOTSPOT_SIZE}px)`);
    }

    const newHotspot = {
      x: (currentRect.x1 + currentRect.x2) / 2,
      y: (currentRect.y1 + currentRect.y2) / 2,
      width: currentRect.x2 - currentRect.x1,
      height: currentRect.y2 - currentRect.y1,
      link: '',
      label: '',
    };
    const updated = [...localHotspots, newHotspot];
    setLocalHotspots(updated);
    setSelectedIndex(updated.length - 1);
    setCurrentRect(null);
  }, [drawing, currentRect, localHotspots]);

  const handleDeleteHotspot = useCallback((index) => {
    setLocalHotspots((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndex(null);
  }, []);

  const handleHotspotClick = useCallback((index, e) => {
    e.stopPropagation();
    setSelectedIndex(index === selectedIndex ? null : index);
  }, [selectedIndex]);

  const startEditLink = useCallback((index) => {
    setEditingLinkIndex(index);
    setLinkInput(localHotspots[index]?.link || '');
  }, [localHotspots]);

  const finishEditLink = useCallback((index) => {
    setLocalHotspots((prev) =>
      prev.map((h, i) => (i === index ? { ...h, link: linkInput } : h))
    );
    setEditingLinkIndex(null);
    setLinkInput('');
  }, [linkInput]);

  const handleSave = useCallback(() => {
    const invalid = localHotspots.filter((h) => !h.link?.trim());
    if (invalid.length > 0) {
      alert(`Còn ${invalid.length} vùng chưa có liên kết. Vui lòng gắn link cho tất cả các vùng trước khi lưu.`);
      return;
    }
    onSave(localHotspots);
  }, [localHotspots, onSave]);

  const rectStyle = (h) => ({
    position: 'absolute',
    left: `${h.x - h.width / 2}%`,
    top: `${h.y - h.height / 2}%`,
    width: `${h.width}%`,
    height: `${h.height}%`,
    border: '2px solid #ee4d2d',
    background: 'rgba(238, 77, 45, 0.15)',
    cursor: 'pointer',
    zIndex: 2,
  });

  const currentRectStyle = currentRect ? {
    position: 'absolute',
    left: `${currentRect.x1}%`,
    top: `${currentRect.y1}%`,
    width: `${currentRect.x2 - currentRect.x1}%`,
    height: `${currentRect.y2 - currentRect.y1}%`,
    border: '2px dashed #fff',
    background: 'rgba(255,255,255,0.3)',
    pointerEvents: 'none',
    zIndex: 3,
  } : null;

  return (
    <Modal
      title={`Chỉnh sửa Hotspot — ${localHotspots.length}/${MAX_HOTSPOTS}`}
      open
      onCancel={() => onSave(hotspots)}
      onOk={handleSave}
      okText="Lưu Hotspot"
      cancelText="Hủy"
      width={900}
      bodyStyle={{ padding: 0 }}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
        {/* Instructions */}
        <div style={{
          background: '#fff8f7',
          border: '1px solid #fde8e4',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 13,
          color: '#902421',
        }}>
          <strong>Hướng dẫn:</strong> Nhấn và kéo chuột trên ảnh để vẽ vùng nhấp chuột.
          Tối đa {MAX_HOTSPOTS} vùng, mỗi vùng tối thiểu {MIN_HOTSPOT_SIZE}x{MIN_HOTSPOT_SIZE}px.
          <strong> Bắt buộc gắn link cho mỗi vùng.</strong>
        </div>

        {/* Image + hotspot canvas */}
        <div style={{
          position: 'relative',
          display: 'inline-block',
          maxWidth: '100%',
          cursor: drawing ? 'crosshair' : 'default',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {image ? (
            <img
              ref={imageRef}
              src={image}
              alt="Hotspot background"
              style={{ display: 'block', maxWidth: '100%', userSelect: 'none' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              draggable={false}
            />
          ) : (
            <div style={{
              width: 600,
              height: 300,
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: 14,
              borderRadius: 8,
            }}>
              Vui lòng tải ảnh nền trước
            </div>
          )}

          {localHotspots.map((h, i) => (
            <div
              key={i}
              style={{
                ...rectStyle(h),
                outline: selectedIndex === i ? '3px solid #902421' : 'none',
                outlineOffset: 2,
              }}
              onClick={(e) => handleHotspotClick(i, e)}
              title={`Vùng ${i + 1}${h.label ? `: ${h.label}` : ''}`}
            >
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#ee4d2d',
                color: '#fff',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
              }}>
                {i + 1}
              </span>
            </div>
          ))}

          {currentRectStyle && <div style={currentRectStyle} />}
        </div>

        {/* Hotspot list */}
        {localHotspots.length > 0 && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Các vùng Hotspot ({localHotspots.length}/{MAX_HOTSPOTS})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {localHotspots.map((h, i) => {
                const isCustomLink = linkInput !== '' && !PRESET_LINKS.find((p) => p.value === linkInput);
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: selectedIndex === i ? '#eff6ff' : '#f9fafb',
                      border: `1px solid ${selectedIndex === i ? '#1a56db' : '#e5e7eb'}`,
                      borderRadius: 8,
                    }}
                    onClick={() => setSelectedIndex(i)}
                  >
                    <span style={{
                      background: '#ee4d2d',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>

                    <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0, minWidth: 90 }}>
                      X: {Math.round(h.x)}% Y: {Math.round(h.y)}%
                    </span>

                    {editingLinkIndex === i ? (
                      <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                        <select
                          value={PRESET_LINKS.find((p) => p.value === linkInput) ? linkInput : '__custom__'}
                          onChange={(e) => {
                            if (e.target.value !== '__custom__') {
                              setLinkInput(e.target.value);
                            }
                          }}
                          style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, border: '1px solid #d1d5db' }}
                        >
                          {PRESET_LINKS.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                          <option value="__custom__">Tùy chỉnh</option>
                        </select>
                        {(linkInput === '__custom__' || isCustomLink) && (
                          <input
                            type="text"
                            value={linkInput === '__custom__' ? '' : linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            placeholder="/san-pham/..."
                            style={{ fontSize: 12, padding: '3px 8px', border: '1px solid #d1d5db', borderRadius: 4, flex: 1 }}
                            onKeyDown={(e) => e.key === 'Enter' && finishEditLink(i)}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => finishEditLink(i)}
                          style={{ background: '#1a56db', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditLink(i)}
                        style={{
                          flex: 1,
                          textAlign: 'left',
                          fontSize: 12,
                          color: h.link ? '#1a56db' : '#ef4444',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 4px',
                        }}
                      >
                        {h.link ? `Link: ${h.link}` : '⚠ Chưa gắn liên kết — nhấn để thêm'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteHotspot(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        fontSize: 14,
                      }}
                      title="Xóa vùng"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom note */}
        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
          {localHotspots.length === 0 && 'Chưa có vùng hotspot nào. Kéo chuột trên ảnh để vẽ vùng đầu tiên.'}
          {localHotspots.length >= MAX_HOTSPOTS && 'Đã đạt số lượng hotspot tối đa.'}
        </p>
      </div>
    </Modal>
  );
}

HotspotEditor.propTypes = {
  image: PropTypes.string,
  hotspots: PropTypes.arrayOf(PropTypes.object),
  onSave: PropTypes.func.isRequired,
};
