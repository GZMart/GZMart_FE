import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { inventoryService } from '@services/api';

const initialState = {
  inventoryItems: [],
  currentItem: null,
  lowStockAlerts: [],
  outOfStockItems: [],
  statistics: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

// Async Thunks
export const fetchInventoryItems = createAsyncThunk(
  'inventory/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await inventoryService.getInventoryItems(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchInventoryItemById = createAsyncThunk(
  'inventory/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await inventoryService.getInventoryItemById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchLowStockAlerts = createAsyncThunk(
  'inventory/fetchLowStock',
  async (params, { rejectWithValue }) => {
    try {
      const response = await inventoryService.getLowStockAlerts(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const adjustInventoryQuantity = createAsyncThunk(
  'inventory/adjustQuantity',
  async ({ id, adjustmentData }, { rejectWithValue }) => {
    try {
      const response = await inventoryService.adjustQuantity(id, adjustmentData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearCurrentItem: (state) => {
      state.currentItem = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateInventoryItem: (state, action) => {
      const index = state.inventoryItems.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.inventoryItems[index] = { ...state.inventoryItems[index], ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all inventory items
      .addCase(fetchInventoryItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryItems.fulfilled, (state, action) => {
        state.loading = false;
        state.inventoryItems = action.payload.data || action.payload;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchInventoryItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch item by ID
      .addCase(fetchInventoryItemById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryItemById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentItem = action.payload;
      })
      .addCase(fetchInventoryItemById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch low stock alerts
      .addCase(fetchLowStockAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLowStockAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.lowStockAlerts = action.payload;
      })
      .addCase(fetchLowStockAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Adjust quantity
      .addCase(adjustInventoryQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adjustInventoryQuantity.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.inventoryItems.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.inventoryItems[index] = action.payload;
        }
        if (state.currentItem?.id === action.payload.id) {
          state.currentItem = action.payload;
        }
      })
      .addCase(adjustInventoryQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentItem, clearError, updateInventoryItem } = inventorySlice.actions;

// Selectors
export const selectInventoryItems = (state) => state.inventory.inventoryItems;
export const selectCurrentItem = (state) => state.inventory.currentItem;
export const selectLowStockAlerts = (state) => state.inventory.lowStockAlerts;
export const selectInventoryLoading = (state) => state.inventory.loading;
export const selectInventoryError = (state) => state.inventory.error;

export default inventorySlice.reducer;
