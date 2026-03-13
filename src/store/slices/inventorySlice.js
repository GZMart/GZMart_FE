import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import inventoryService from '../../services/api/inventoryService';

const initialState = {
  // List of inventory transactions
  transactions: [],
  transactionsPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  // Stats from backend
  stats: null,
  // UI state
  loading: false,
  adjusting: false, // separate flag for adjust operations
  error: null,
};

// ── Thunks ────────────────────────────────────────────────────────

export const fetchInventoryTransactions = createAsyncThunk(
  'inventory/fetchTransactions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await inventoryService.getTransactions(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchInventoryStats = createAsyncThunk(
  'inventory/fetchStats',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await inventoryService.getStats(params);
      return response.data?.data ?? response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Adjust stock to a new absolute value (e.g., set SKU to 15 units).
 * payload: { productId, modelId, sku, newStock, costPrice?, note? }
 */
export const adjustStockItem = createAsyncThunk(
  'inventory/adjustStock',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await inventoryService.adjustStock(payload);
      return { ...response.data?.data, sku: payload.sku, newStock: payload.newStock };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/**
 * Add stock (stock-in).
 * payload: { productId, modelId, sku, quantity, costPrice?, note? }
 */
export const stockInItem = createAsyncThunk(
  'inventory/stockIn',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await inventoryService.stockIn(payload);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchInventoryTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.data ?? action.payload;
        state.transactionsPagination = action.payload.pagination ?? state.transactionsPagination;
      })
      .addCase(fetchInventoryTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch stats
      .addCase(fetchInventoryStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchInventoryStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Adjust stock
      .addCase(adjustStockItem.pending, (state) => {
        state.adjusting = true;
        state.error = null;
      })
      .addCase(adjustStockItem.fulfilled, (state) => {
        state.adjusting = false;
      })
      .addCase(adjustStockItem.rejected, (state, action) => {
        state.adjusting = false;
        state.error = action.payload;
      })

      // Stock in
      .addCase(stockInItem.pending, (state) => {
        state.adjusting = true;
        state.error = null;
      })
      .addCase(stockInItem.fulfilled, (state) => {
        state.adjusting = false;
      })
      .addCase(stockInItem.rejected, (state, action) => {
        state.adjusting = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = inventorySlice.actions;

// Selectors
export const selectInventoryTransactions = (state) => state.inventory.transactions;
export const selectInventoryStats = (state) => state.inventory.stats;
export const selectInventoryLoading = (state) => state.inventory.loading;
export const selectInventoryAdjusting = (state) => state.inventory.adjusting;
export const selectInventoryError = (state) => state.inventory.error;

export default inventorySlice.reducer;
