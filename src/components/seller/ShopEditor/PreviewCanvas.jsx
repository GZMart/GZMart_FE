/* eslint-disable react/prop-types */
/**
 * PreviewCanvas — Central Live Preview Renderer Engine
 *
 * Core responsibilities:
 * 1. Map MODULE_TYPES -> render components
 * 2. Render all modules from Redux pageConfig
 * 3. Click-to-select -> dispatch setSelectedModule
 * 4. @dnd-kit sortable for drag-to-reorder modules
 * 5. HTML5 drag-drop from sidebar to add modules
 * 6. Empty state when no modules
 * 7. Skeleton loading state
 */

import { useCallback, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from '@dnd-kit/core';
import { selectUser } from '@store/slices/authSlice';
import {
  selectCurrentModules,
  selectSelectedModuleId,
  selectIsLoading,
  setSelectedModule,
  removeModule,
  reorderModules,
  addModule,
} from '@store/slices/shopDecorationSlice';
import {
  MODULE_TYPES,
  MODULE_LABELS,
} from '@services/api/shopDecorationService';

import ShopProfilePreview from './PreviewModules/ShopProfilePreview';
import BannerCarouselPreview from './PreviewModules/BannerCarouselPreview';
import BannerMultiPreview from './PreviewModules/BannerMultiPreview';
import BentoGridPreview from './PreviewModules/BentoGridPreview';
import FlashDealsPreview from './PreviewModules/FlashDealsPreview';
import DiscountPreview from './PreviewModules/DiscountPreview';
import SuggestedForYouPreview from './PreviewModules/SuggestedForYouPreview';
import {
  BannerSinglePreview,
  BannerHotspotPreview,
  AddonDealsPreview,
  ComboPromosPreview,
  CategoriesPreview,
  TextPreview,
  ImageTextPreview,
} from './PreviewModules/FallbackComponents';
import ModuleWrapper from './PreviewModules/Common/ModuleWrapper';
import SkeletonModules from './SkeletonModules';

import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

// ─── Component Mapping ────────────────────────────────────────────────────────

const MODULE_RENDERERS = {
  [MODULE_TYPES.SHOP_INFO]:            ShopProfilePreview,
  [MODULE_TYPES.DISCOUNT]:             DiscountPreview,
  [MODULE_TYPES.SUGGESTED_FOR_YOU]:    SuggestedForYouPreview,
  [MODULE_TYPES.BANNER_CAROUSEL]:      BannerCarouselPreview,
  [MODULE_TYPES.BANNER_MULTI]:         BannerMultiPreview,
  [MODULE_TYPES.BANNER_SINGLE]:        BannerSinglePreview,
  [MODULE_TYPES.BANNER_HOTSPOT]:       BannerHotspotPreview,
  [MODULE_TYPES.FLASH_DEALS]:          FlashDealsPreview,
  [MODULE_TYPES.ADDON_DEALS]:          AddonDealsPreview,
  [MODULE_TYPES.COMBO_PROMOS]:         ComboPromosPreview,
  [MODULE_TYPES.FEATURED_PRODUCTS]:    BentoGridPreview,
  [MODULE_TYPES.FEATURED_CATEGORIES]:  CategoriesPreview,
  [MODULE_TYPES.BEST_SELLING]:         BentoGridPreview,
  [MODULE_TYPES.NEW_PRODUCTS]:         BentoGridPreview,
  [MODULE_TYPES.CATEGORY_LIST]:        CategoriesPreview,
  [MODULE_TYPES.TEXT]:                 TextPreview,
  [MODULE_TYPES.IMAGE_TEXT]:           ImageTextPreview,
};

// ─── Sortable Item ────────────────────────────────────────────────────────────

SortableItem.propTypes = {
  module: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

DragOverlayItem.propTypes = {
  module: PropTypes.object.isRequired,
};

function SortableItem({ module, isSelected, onSelect, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: module.id,
    disabled: module.isMandatory, // Disable dragging for mandatory modules
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const Renderer = MODULE_RENDERERS[module.type];

  return (
    <div ref={setNodeRef} style={style}>
      <ModuleWrapper
        module={module}
        isSelected={isSelected}
        onSelect={onSelect}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      >
        {Renderer ? (
          <Renderer
            module={module}
            isSelected={isSelected}
            onSelect={onSelect}
          />
        ) : (
          <div className={styles.bannerEmpty}>
            <i className="bi bi-question-circle" />
            <p>{MODULE_LABELS[module.type] || module.type}</p>
          </div>
        )}
      </ModuleWrapper>
    </div>
  );
}

// ─── Drag Overlay Preview ─────────────────────────────────────────────────────

function DragOverlayItem({ module }) {
  const Renderer = MODULE_RENDERERS[module.type];
  return (
    <div
      style={{
        opacity: 0.85,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        borderRadius: 14,
        transform: 'rotate(2deg)',
        pointerEvents: 'none',
        maxWidth: 600,
      }}
    >
      <ModuleWrapper module={module} isSelected={false} onSelect={() => {}} onDelete={() => {}}>
        {Renderer && <Renderer module={module} isSelected={false} onSelect={() => {}} />}
      </ModuleWrapper>
    </div>
  );
}

// ─── Main PreviewCanvas ───────────────────────────────────────────────────────

// ─── Seller shop preview frame (banner + strip + tabs) ───────────────────────
function ShopPreviewFrame({ user, children, onCoverClick, pendingCoverUrl }) {
  const avatarUrl = user?.avatar;
  // Ảnh bìa shop quay về dùng profileImage của user
  const coverUrl = pendingCoverUrl !== undefined ? pendingCoverUrl : (user?.profileImage || null);

  return (
    <div className={styles.shopPreviewFrame}>
      <section
        className={styles.shopPreviewHero}
        onClick={onCoverClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onCoverClick?.()}
        title="Click để đổi ảnh bìa"
      >
        {coverUrl ? (
          <img src={coverUrl} alt="" className={styles.shopPreviewHeroImg} />
        ) : (
          <div className={styles.shopPreviewHeroPlaceholder} />
        )}
        <div className={styles.shopPreviewHeroOverlay} />
        {/* Hover overlay for editing */}
        <div className={styles.shopPreviewHeroEditOverlay}>
          <i className="bi bi-camera-fill" />
          <span>Đổi ảnh bìa</span>
        </div>
        <div className={styles.shopPreviewHeroProfile}>
          <div className={styles.shopPreviewAvatarWrap}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className={styles.shopPreviewAvatar} />
            ) : (
              <div className={styles.shopPreviewAvatarPlaceholder}>
                <i className="bi bi-shop" />
              </div>
            )}
            <span className={styles.shopPreviewFavBadge}>Your Shop</span>
          </div>
        </div>
      </section>
      {/* Shop Info Strip - Hidden in preview to match actual storefront */}
      {/* <section className={styles.shopPreviewStrip}>
        <div className={styles.shopPreviewStripLeft}>
          <h1 className={styles.shopPreviewStripName}>
            {displayName}
            <i className={`bi bi-patch-check-fill ${styles.shopPreviewVerified}`} aria-hidden />
          </h1>
          <p className={styles.shopPreviewStripStatus}>Đang hoạt động</p>
        </div>
        <div className={styles.shopPreviewStripStats}>
          <div className={styles.shopPreviewStatBlock}>
            <div className={styles.shopPreviewStatValue}><i className="bi bi-box-seam" /> 0</div>
            <div className={styles.shopPreviewStatLabel}>Sản phẩm</div>
          </div>
          <span className={styles.shopPreviewStatDivider} />
          <div className={styles.shopPreviewStatBlock}>
            <div className={styles.shopPreviewStatValue}><i className="bi bi-people-fill" /> 0</div>
            <div className={styles.shopPreviewStatLabel}>Người theo dõi</div>
          </div>
          <span className={styles.shopPreviewStatDivider} />
          <div className={styles.shopPreviewStatBlock}>
            <div className={styles.shopPreviewStatValue}><i className="bi bi-star-fill" /> 0/5</div>
            <div className={styles.shopPreviewStatLabel}>Đánh giá</div>
          </div>
        </div>
        <div className={styles.shopPreviewStripActions}>
          <a
            href={user?._id ? `/shop/${user._id}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.shopPreviewBtnView}
            onClick={(e) => !user?._id && e.preventDefault()}
          >
            <i className="bi bi-eye" />
            Xem shop
          </a>
        </div>
      </section> */}
      <nav className={styles.shopPreviewTabs}>
        <button type="button" className={`${styles.shopPreviewTab} ${styles.shopPreviewTabActive}`}>
          <i className="bi bi-house-door-fill" /> Home
        </button>
        <button type="button" className={styles.shopPreviewTab}>
          <i className="bi bi-grid-3x3-gap" /> All Products
        </button>
        <button type="button" className={styles.shopPreviewTab}>
          <i className="bi bi-rss" /> Shop Profile
        </button>
      </nav>
      <div className={styles.shopPreviewContent}>
        {children}
      </div>
    </div>
  );
}

export default function PreviewCanvas({ pendingCoverUrl }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const modules = useSelector(selectCurrentModules);
  const selectedModuleId = useSelector(selectSelectedModuleId);
  const isLoading = useSelector(selectIsLoading);

  const [activeId, setActiveId] = useState(null);

  // ── Cover photo click → fires custom event for parent to handle ──────
  const handleCoverClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent('shopCoverClick'));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const activeModule = useMemo(
    () => (activeId ? modules.find((m) => m.id === activeId) : null),
    [activeId, modules]
  );

  const moduleIds = useMemo(() => modules.map((m) => m.id), [modules]);

  // ── Selection ────────────────────────────────────────────────────────────
  const handleSelect = useCallback((moduleId) => {
    dispatch(setSelectedModule(moduleId));
  }, [dispatch]);

  const handleDelete = useCallback((moduleId) => {
    dispatch(removeModule(moduleId));
  }, [dispatch]);

  // ── dnd-kit handlers ────────────────────────────────────────────────────
  const handleDragStart = useCallback(({ active }) => {
    const module = modules.find((m) => m.id === active.id);
    if (module?.isMandatory) {
      setActiveId(null);
      return;
    }
    setActiveId(active.id);
  }, [modules]);

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) {
return;
}
    
    // Double-check: cannot drag mandatory modules
    const activeModule = modules.find((m) => m.id === active.id);
    const overModule = modules.find((m) => m.id === over.id);
    
    if (!activeModule || !overModule) {
return;
}
    if (activeModule.isMandatory) {
return;
}
    
    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
return;
}
    
    // Find the number of mandatory modules at the start
    let mandatoryCount = 0;
    for (let i = 0; i < modules.length; i++) {
      if (modules[i].isMandatory) {
        mandatoryCount++;
      } else {
        break;
      }
    }
    
    // Cannot move non-mandatory modules before mandatory modules
    if (newIndex < mandatoryCount) {
      return;
    }
    
    // Cannot move over a mandatory module
    if (overModule.isMandatory) {
      return;
    }
    
    dispatch(reorderModules({ fromIndex: oldIndex, toIndex: newIndex }));
  }, [dispatch, modules]);

  // ── Drop from sidebar (HTML5) — insert at nearest section position ────────
  const getInsertIndexFromDrop = useCallback((dropY) => {
    const sectionEls = document.querySelectorAll('[data-section-wrap]');
    if (!sectionEls.length) {
return undefined;
}

    // Find the number of mandatory modules at the start
    let mandatoryCount = 0;
    for (let i = 0; i < modules.length; i++) {
      if (modules[i].isMandatory) {
        mandatoryCount++;
      } else {
        break;
      }
    }

    for (let i = 0; i < sectionEls.length; i++) {
      const rect = sectionEls[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (dropY < midY) {
        // Cannot insert before mandatory modules
        if (i < mandatoryCount) {
          return mandatoryCount;
        }
        return i;
      }
    }
    return sectionEls.length; // append after last
  }, [modules]);

  const handleCanvasDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent double-fire when dropping inside a nested drop zone
    const moduleType = e.dataTransfer.getData('application/x-module-type');
    if (moduleType) {
      const insertAt = getInsertIndexFromDrop(e.clientY);
      dispatch(addModule({ type: moduleType, insertAt }));
    }
  }, [dispatch, getInsertIndexFromDrop]);

  const handleCanvasDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // ── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.previewWrap}>
        <div className={styles.previewInner}>
          <ShopPreviewFrame user={user} onCoverClick={handleCoverClick}>
            <SkeletonModules />
          </ShopPreviewFrame>
        </div>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (modules.length === 0) {
    return (
      <div className={styles.previewWrap}>
        <div className={styles.previewInner}>
          <ShopPreviewFrame user={user} onCoverClick={handleCoverClick} pendingCoverUrl={pendingCoverUrl}>
            <div
              className={styles.canvasDropZone}
              onDrop={handleCanvasDrop}
              onDragOver={handleCanvasDragOver}
            >
              <div className={styles.canvasEmptyIcon}>
                <i className="bi bi-layout-wtf" />
              </div>
              <h3>Chưa có module nào</h3>
              <p>Kéo module từ panel bên trái để bắt đầu trang trí shop của bạn</p>
              <div className={styles.canvasEmptyHint}>
                <i className="bi bi-arrow-left" />
                <span>Kéo từ đây</span>
              </div>
            </div>
          </ShopPreviewFrame>
        </div>
      </div>
    );
  }

  // ── Render with dnd-kit ──────────────────────────────────────────────────
  return (
    <div
      className={styles.previewWrap}
      onDrop={handleCanvasDrop}
      onDragOver={handleCanvasDragOver}
    >
      <div className={styles.previewInner}>
        <ShopPreviewFrame user={user} onCoverClick={handleCoverClick} pendingCoverUrl={pendingCoverUrl}>
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
              {modules.map((module) => (
                <div
                  key={module.id}
                  data-section-wrap
                  className={`
                    ${styles.sectionWrap}
                    ${module.id === selectedModuleId ? styles.sectionWrapSelected : ''}
                  `}
                >
                  <SortableItem
                    module={module}
                    isSelected={module.id === selectedModuleId}
                    onSelect={() => handleSelect(module.id)}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </SortableContext>

            <DragOverlay dropAnimation={null}>
              {activeModule ? <DragOverlayItem module={activeModule} /> : null}
            </DragOverlay>
          </DndContext>

          {/* Bottom drop zone */}
          <div
            className={styles.canvasDropZoneBottom}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
          >
            <i className="bi bi-plus-lg" />
            <span>Kéo module vào đây để thêm</span>
          </div>
        </ShopPreviewFrame>
      </div>
    </div>
  );
}
