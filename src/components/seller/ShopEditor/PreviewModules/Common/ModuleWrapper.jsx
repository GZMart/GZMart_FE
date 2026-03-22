/* eslint-disable react/prop-types */
/**
 * ModuleWrapper — Edit-mode wrapper cho moi module preview
 *
 * Props:
 * - module: module object
 * - isSelected: boolean
 * - onSelect: callback
 * - onDelete: callback
 * - dragHandleProps: HTML drag props
 * - children: render component content
 */

import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

export default function ModuleWrapper({
  module,
  isSelected,
  onSelect,
  onDelete,
  dragHandleProps,
  children,
}) {
  const { type, isEnabled = true, isMandatory = false } = module || {};

  return (
    <div
      className={`
        ${styles.previewModuleWrap}
        ${isSelected ? styles.previewModuleSelected : ''}
        ${!isEnabled ? styles.previewModuleDisabled : ''}
      `}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect()}
    >
      {/* Edit label */}
      <div className={styles.previewModuleLabel}>
        <span className={styles.previewModuleLabelDot} />
        <span>{MODULE_TYPE_SHORT_LABELS[type] || type}</span>
      </div>

      {/* Drag handle - hidden for mandatory modules */}
      {!isMandatory && (
        <div
          className={styles.previewModuleDragHandle}
          title="Drag to reorder"
          {...dragHandleProps}
        >
          <i className="bi bi-grip-vertical" />
        </div>
      )}

      {/* Content */}
      <div className={styles.previewModuleContent}>{children}</div>

      {/* Delete button - hidden for mandatory modules */}
      {isSelected && onDelete && !isMandatory && (
        <button
          className={styles.previewModuleDeleteBtn}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(module.id);
          }}
          title="Remove module"
        >
          <i className="bi bi-trash3" />
        </button>
      )}

      {/* Selection ring */}
      {isSelected && <div className={styles.previewModuleSelectionRing} />}
    </div>
  );
}

const MODULE_TYPE_SHORT_LABELS = {
  banner_carousel: 'Carousel Banner',
  banner_multi: 'Multi Banner',
  banner_single: 'Single Image',
  banner_hotspot: 'Hotspot Banner',
  flash_deals: 'Flash Deals',
  addon_deals: 'Add-on Deals',
  combo_promos: 'Combo Promos',
  featured_products: 'Featured Products',
  featured_categories: 'Featured Categories',
  best_selling: 'Best Selling',
  new_products: 'New Products',
  category_list: 'Category List',
  text: 'Text',
  image_text: 'Image & Text',
  shop_info: 'Shop Info',
  voucher: 'Discount Code',
  discount: 'Discount',
  suggested_for_you: 'SUGGESTED FOR YOU',
};
