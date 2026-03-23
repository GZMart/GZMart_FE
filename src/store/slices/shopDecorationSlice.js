/**
 * Shop Decoration Redux Slice
 *
 * State Management for Live Data-Binding Editor:
 * - desktopDraft / mobileDraft: ordered module arrays for each version
 * - widgets: widget config (auto/manual product blocks)
 * - activeVersion: "desktop" | "mobile"
 * - selectedModuleId / selectedWidgetKey: current selection in editor
 * - isDirty: unsaved changes flag
 * - isLoading / isSaving: API state
 * - lastSaved: last successful save timestamp
 */

import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { shopDecorationApi } from '@services/api';
import {
  getDefaultWidgets,
  generateModuleId,
  MODULE_TYPES,
} from '@services/api/shopDecorationService';
import { getModuleTemplate } from '@services/shopDecoration/moduleTemplates';

/** IDs used for the mandatory modules */
export const DISCOUNT_MODULE_ID = 'mandatory_discount';
export const SUGGESTED_FOR_YOU_MODULE_ID = 'mandatory_suggested_for_you';
export const VOUCHER_MODULE_ID = 'mandatory_voucher';

/**
 * Flattens any nested props objects to prevent deep nesting issues.
 * e.g. { props: { props: { props: { displayLimit: 5 } } } } becomes { displayLimit: 5 }
 */
function flattenNestedProps(obj) {
  if (!obj || typeof obj !== 'object') {
return obj;
}

  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'props' && typeof value === 'object' && value !== null) {
      // Recursively flatten nested props
      const flattened = flattenNestedProps(value);
      Object.assign(result, flattened);
    } else if (Array.isArray(value)) {
      // Arrays are kept as-is
      result[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      // Other objects - flatten them too
      const flattened = flattenNestedProps(value);
      Object.assign(result, flattened);
    } else {
      // Primitives are kept
      result[key] = value;
    }
  }

  return result;
}

/**
 * Ensures the mandatory DISCOUNT, SUGGESTED_FOR_YOU, and VOUCHER modules exist.
 * DISCOUNT and VOUCHER are merged (same display, using VOUCHER logic).
 * SUGGESTED_FOR_YOU is also mandatory.
 * SHOP_INFO modules are filtered out.
 */
function ensureMandatoryModules(existingModules = []) {
  if (!Array.isArray(existingModules)) {
existingModules = [];
}

  // Separate mandatory modules and regular modules
  // Filter out SHOP_INFO and VOUCHER (VOUCHER is now merged into DISCOUNT)
  const regularModules = existingModules.filter(
    (m) =>
      m.type !== MODULE_TYPES.DISCOUNT &&
      m.type !== MODULE_TYPES.SUGGESTED_FOR_YOU &&
      m.type !== MODULE_TYPES.VOUCHER &&
      m.type !== MODULE_TYPES.SHOP_INFO
  );

  // Find existing modules
  const existingDiscount = existingModules.find((m) => m.type === MODULE_TYPES.DISCOUNT);
  const existingSuggested = existingModules.find((m) => m.type === MODULE_TYPES.SUGGESTED_FOR_YOU);

  const mandatoryModules = [];

  // DISCOUNT module (merged with VOUCHER) - can be auto or manual
  // Default to auto source, showing active vouchers
  if (existingDiscount) {
    mandatoryModules.push({
      ...existingDiscount,
      id: DISCOUNT_MODULE_ID,
      isMandatory: true,
    });
  } else {
    mandatoryModules.push({
      ...getModuleTemplate(MODULE_TYPES.DISCOUNT),
      id: DISCOUNT_MODULE_ID,
      isMandatory: true,
      props: {
        ...getModuleTemplate(MODULE_TYPES.DISCOUNT).props,
        source: 'auto',
        displayLimit: 5,
      },
    });
  }

  // Ensure SUGGESTED_FOR_YOU module exists with correct ID and isMandatory flag
  if (existingSuggested) {
    mandatoryModules.push({
      ...existingSuggested,
      id: SUGGESTED_FOR_YOU_MODULE_ID,
      isMandatory: true,
    });
  } else {
    mandatoryModules.push({
      ...getModuleTemplate(MODULE_TYPES.SUGGESTED_FOR_YOU),
      id: SUGGESTED_FOR_YOU_MODULE_ID,
      isMandatory: true,
    });
  }

  // Prepend mandatory modules so they always appear first
  return [...mandatoryModules, ...regularModules];
}

// ─── Async Thunks ──────────────────────────────────────────────────────────

export const fetchDecoration = createAsyncThunk(
  'shopDecoration/fetchDecoration',
  async (_, { rejectWithValue }) => {
    try {
      const data = await shopDecorationApi.getDecoration();
      return {
        desktopDraft: data.desktopDraft || [],
        mobileDraft: data.mobileDraft || [],
        widgets: data.widgets || getDefaultWidgets(),
        desktopPublishedAt: data.desktopPublishedAt || null,
        mobilePublishedAt: data.mobilePublishedAt || null,
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Khong tai duoc cau hinh shop');
    }
  }
);

export const saveDecoration = createAsyncThunk(
  'shopDecoration/saveDecoration',
  async ({ modules, widgets }, { getState, rejectWithValue }) => {
    try {
      const { activeVersion } = getState().shopDecoration;
      await shopDecorationApi.saveDraft({
        version: activeVersion,
        modules,
        widgets,
      });
      return { savedAt: new Date().toISOString() };
    } catch (err) {
      return rejectWithValue(err.message || 'Luu that bai');
    }
  }
);

export const publishDecoration = createAsyncThunk(
  'shopDecoration/publishDecoration',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState().shopDecoration;
      if (!state) {
        return rejectWithValue('Khong tim thay cau hinh shop');
      }
      const { activeVersion, desktopDraft, mobileDraft, widgets } = state;
      const modules = activeVersion === 'desktop' ? desktopDraft : mobileDraft;
      await shopDecorationApi.saveDraft({
        version: activeVersion,
        modules,
        widgets,
      });
      await shopDecorationApi.publish({ version: activeVersion });
      return { publishedAt: new Date().toISOString(), version: activeVersion };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || err?.message || 'Xuat ban that bai');
    }
  }
);

// ─── Initial State ──────────────────────────────────────────────────────────

const initialState = {
  // Modules
  desktopDraft: [],
  mobileDraft: [],

  // Widgets config
  widgets: getDefaultWidgets(),

  // Publish timestamps
  desktopPublishedAt: null,
  mobilePublishedAt: null,

  // UI state
  activeVersion: 'desktop',
  selectedModuleId: null,
  selectedWidgetKey: null,
  isDirty: false,

  // Async state
  isLoading: false,
  isSaving: false,
  error: null,

  // Save tracking
  lastSaved: null,
};

// ─── Slice ──────────────────────────────────────────────────────────────────

const shopDecorationSlice = createSlice({
  name: 'shopDecoration',
  initialState,
  reducers: {
    // ── Module CRUD ────────────────────────────────────────────────────────
    addModule: (state, action) => {
      const { type, insertAt } = action.payload;
      // Cannot manually add mandatory module types
      if (
        type === MODULE_TYPES.DISCOUNT ||
        type === MODULE_TYPES.SUGGESTED_FOR_YOU ||
        type === MODULE_TYPES.VOUCHER
      ) {
return;
}
      const target = state[`${state.activeVersion}Draft`];
      const newModule = getModuleTemplate(type);
      if (insertAt !== undefined && insertAt >= 0 && insertAt <= target.length) {
        target.splice(insertAt, 0, newModule);
        target.forEach((m, i) => {
          m.sortOrder = i;
        });
      } else {
        target.push(newModule);
      }
      state.selectedModuleId = newModule.id;
      state.selectedWidgetKey = null;
      state.isDirty = true;
    },

    removeModule: (state, action) => {
      const id = action.payload;
      // Prevent removing mandatory modules
      const target = state[`${state.activeVersion}Draft`];
      const module = target.find((m) => m.id === id);
      if (module?.isMandatory) {
return;
}
      const idx = target.findIndex((m) => m.id === id);
      if (idx !== -1) {
        target.splice(idx, 1);
        target.forEach((m, i) => {
          m.sortOrder = i;
        });
      }
      if (state.selectedModuleId === id) {
        state.selectedModuleId = null;
      }
      state.isDirty = true;
    },

    updateModuleProps: (state, action) => {
      const { id, props } = action.payload;
      const target = state[`${state.activeVersion}Draft`];
      const idx = target.findIndex((m) => m.id === id);
      if (idx !== -1) {
        const existing = target[idx];
        // Flatten any nested props to prevent deep nesting
        const flattenedProps = flattenNestedProps(props);
        target[idx] = {
          ...existing,
          props: { ...(existing.props || {}), ...flattenedProps },
        };
        state.isDirty = true;
      }
    },

    updateModuleExtra: (state, action) => {
      const { id, changes } = action.payload;
      const target = state[`${state.activeVersion}Draft`];
      const idx = target.findIndex((m) => m.id === id);
      if (idx !== -1) {
        const existing = target[idx];
        // Flatten any nested props to prevent deep nesting
        if (changes.props !== undefined) {
          const flattenedProps = flattenNestedProps(changes.props);
          target[idx] = {
            ...existing,
            props: { ...(existing.props || {}), ...flattenedProps },
          };
        } else {
          // Check if changes has nested props
          const flattenedChanges = flattenNestedProps(changes);
          target[idx] = { ...existing, ...flattenedChanges };
        }
        state.isDirty = true;
      }
    },

    /** Batch update multiple modules at once (e.g. after reordering via drag-end). */
    updateMultipleModules: (state, action) => {
      const { updates } = action.payload;
      const target = state[`${state.activeVersion}Draft`];
      updates.forEach(({ id, changes }) => {
        const idx = target.findIndex((m) => m.id === id);
        if (idx !== -1) {
          target[idx] = { ...target[idx], ...changes };
        }
      });
      state.isDirty = true;
    },

    reorderModules: (state, action) => {
      const { fromIndex, toIndex } = action.payload;
      // Ensure mandatory modules exist before reordering
      const target = ensureMandatoryModules(state[`${state.activeVersion}Draft`]);

      if (
        fromIndex < 0 ||
        fromIndex >= target.length ||
        toIndex < 0 ||
        toIndex >= target.length ||
        fromIndex === toIndex
      ) {
        return;
      }

      // Prevent moving mandatory modules or moving modules before mandatory modules
      const fromModule = target[fromIndex];
      const toModule = target[toIndex];

      // Find the number of mandatory modules at the start
      let mandatoryCount = 0;
      for (let i = 0; i < target.length; i++) {
        if (target[i].isMandatory) {
          mandatoryCount++;
        } else {
          break;
        }
      }

      // Cannot move mandatory modules
      if (!fromModule || fromModule.isMandatory) {
        return;
      }

      // Cannot move non-mandatory modules before mandatory modules
      if (toIndex < mandatoryCount) {
        return;
      }

      // Cannot move over a mandatory module
      if (toModule && toModule.isMandatory) {
        return;
      }

      const [removed] = target.splice(fromIndex, 1);
      target.splice(toIndex, 0, removed);
      target.forEach((m, i) => {
        m.sortOrder = i;
      });

      // Update state with reordered modules
      state[`${state.activeVersion}Draft`] = target;
      state.isDirty = true;
    },

    duplicateModule: (state, action) => {
      const id = action.payload;
      const target = state[`${state.activeVersion}Draft`];
      const idx = target.findIndex((m) => m.id === id);
      if (idx !== -1) {
        const original = target[idx];
        const clone = {
          ...original,
          id: generateModuleId(),
          sortOrder: idx + 1,
        };
        target.splice(idx + 1, 0, clone);
        target.forEach((m, i) => {
          m.sortOrder = i;
        });
        state.selectedModuleId = clone.id;
        state.isDirty = true;
      }
    },

    /** Replace all modules for a version (used after fetch). */
    setModules: (state, action) => {
      const { version, modules } = action.payload;
      if (version) {
        state[`${version}Draft`] = modules;
      }
    },

    // ── Widget Config ──────────────────────────────────────────────────────
    updateWidget: (state, action) => {
      const { key, value } = action.payload;
      state.widgets[key] = { ...state.widgets[key], ...value };
      state.isDirty = true;
    },

    // ── UI State ────────────────────────────────────────────────────────────
    setSelectedModule: (state, action) => {
      state.selectedModuleId = action.payload;
      state.selectedWidgetKey = null;
    },

    setSelectedWidget: (state, action) => {
      state.selectedWidgetKey = action.payload;
      state.selectedModuleId = null;
    },

    setActiveVersion: (state, action) => {
      state.activeVersion = action.payload;
      state.selectedModuleId = null;
      state.selectedWidgetKey = null;
    },

    clearSelection: (state) => {
      state.selectedModuleId = null;
      state.selectedWidgetKey = null;
    },

    // ── Sync ───────────────────────────────────────────────────────────────
    markClean: (state) => {
      state.isDirty = false;
    },

    resetDecoration: (state) => {
      state.desktopDraft = ensureMandatoryModules([]);
      state.mobileDraft = ensureMandatoryModules([]);
      state.widgets = getDefaultWidgets();
      state.desktopPublishedAt = null;
      state.mobilePublishedAt = null;
      state.selectedModuleId = null;
      state.selectedWidgetKey = null;
      state.isDirty = false;
      state.error = null;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // fetchDecoration
      .addCase(fetchDecoration.pending, (state) => {
        // isLoading is intentionally NOT set here to skip skeleton loading state
        state.error = null;
      })
      .addCase(fetchDecoration.fulfilled, (state, action) => {
        state.isLoading = false;
        state.desktopDraft = ensureMandatoryModules(action.payload.desktopDraft);
        state.mobileDraft = ensureMandatoryModules(action.payload.mobileDraft);
        state.widgets = action.payload.widgets;
        state.desktopPublishedAt = action.payload.desktopPublishedAt;
        state.mobilePublishedAt = action.payload.mobilePublishedAt;
        state.isDirty = false;
        state.selectedModuleId = null;
        state.selectedWidgetKey = null;
      })
      .addCase(fetchDecoration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // saveDecoration
      .addCase(saveDecoration.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveDecoration.fulfilled, (state, action) => {
        state.isSaving = false;
        state.lastSaved = action.payload.savedAt;
        state.isDirty = false;
      })
      .addCase(saveDecoration.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })
      // publishDecoration
      .addCase(publishDecoration.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(publishDecoration.fulfilled, (state, action) => {
        state.isSaving = false;
        const { publishedAt, version } = action.payload;
        if (version) {
          state[`${version}PublishedAt`] = publishedAt;
          state.lastSaved = publishedAt;
        }
        state.isDirty = false;
      })
      .addCase(publishDecoration.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      });
  },
});

export const {
  addModule,
  removeModule,
  updateModuleProps,
  updateModuleExtra,
  updateMultipleModules,
  reorderModules,
  duplicateModule,
  setModules,
  updateWidget,
  setSelectedModule,
  setSelectedWidget,
  setActiveVersion,
  clearSelection,
  markClean,
  resetDecoration,
  clearError,
} = shopDecorationSlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectShopDecoration = (state) => state.shopDecoration;
export const selectActiveVersion = (state) => state.shopDecoration.activeVersion;
export const selectIsDirty = (state) => state.shopDecoration.isDirty;
export const selectIsLoading = (state) => state.shopDecoration.isLoading;
export const selectIsSaving = (state) => state.shopDecoration.isSaving;
export const selectError = (state) => state.shopDecoration.error;
export const selectLastSaved = (state) => state.shopDecoration.lastSaved;
export const selectWidgets = (state) => state.shopDecoration.widgets;
export const selectSelectedModuleId = (state) => state.shopDecoration.selectedModuleId;
export const selectSelectedWidgetKey = (state) => state.shopDecoration.selectedWidgetKey;

export const selectCurrentModules = createSelector(
  [selectShopDecoration, selectActiveVersion],
  (sd, version) => {
    const modules = sd[`${version}Draft`];
    // Ensure modules is an array
    const modulesArray = Array.isArray(modules) ? modules : [];
    return ensureMandatoryModules(modulesArray);
  }
);

/**
 * Returns raw modules array for saving/publishing (includes the mandatory
 * DISCOUNT and SUGGESTED_FOR_YOU modules since they are always present in the draft arrays).
 */
export const selectRawModules = createSelector(
  [selectShopDecoration, selectActiveVersion],
  (sd, version) => {
    const modules = sd[`${version}Draft`];
    return Array.isArray(modules) ? modules : [];
  }
);

export const selectSelectedModule = createSelector(
  [selectCurrentModules, selectSelectedModuleId],
  (modules, id) => modules.find((m) => m.id === id) || null
);

export const selectPublishedAt = createSelector(
  [selectShopDecoration, selectActiveVersion],
  (sd, version) => sd[`${version}PublishedAt`]
);

export const selectPublishedAtByVersion = createSelector([selectShopDecoration], (sd) => ({
  desktop: sd.desktopPublishedAt,
  mobile: sd.mobilePublishedAt,
}));

export default shopDecorationSlice.reducer;
