import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { purchaseOrderService } from '@services/api';

const initialState = {
  purchaseOrders: [],
  currentPO: null,
  draftPO: null, // For managing draft PO state
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
export const fetchPurchaseOrders = createAsyncThunk(
  'purchaseOrder/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await purchaseOrderService.getPurchaseOrders(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPurchaseOrderById = createAsyncThunk(
  'purchaseOrder/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await purchaseOrderService.getPurchaseOrderById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createPurchaseOrder = createAsyncThunk(
  'purchaseOrder/create',
  async (poData, { rejectWithValue }) => {
    try {
      const response = await purchaseOrderService.createPurchaseOrder(poData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePurchaseOrder = createAsyncThunk(
  'purchaseOrder/update',
  async ({ id, poData }, { rejectWithValue }) => {
    try {
      const response = await purchaseOrderService.updatePurchaseOrder(id, poData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitPurchaseOrder = createAsyncThunk(
  'purchaseOrder/submit',
  async (id, { rejectWithValue }) => {
    try {
      const response = await purchaseOrderService.submitPurchaseOrder(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const purchaseOrderSlice = createSlice({
  name: 'purchaseOrder',
  initialState,
  reducers: {
    setDraftPO: (state, action) => {
      state.draftPO = action.payload;
    },
    updateDraftPO: (state, action) => {
      state.draftPO = { ...state.draftPO, ...action.payload };
    },
    clearDraftPO: (state) => {
      state.draftPO = null;
    },
    clearCurrentPO: (state) => {
      state.currentPO = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all POs
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseOrders = action.payload.data || action.payload;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchPurchaseOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch PO by ID
      .addCase(fetchPurchaseOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPO = action.payload;
      })
      .addCase(fetchPurchaseOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create PO
      .addCase(createPurchaseOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPurchaseOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseOrders.unshift(action.payload);
        state.draftPO = null;
      })
      .addCase(createPurchaseOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update PO
      .addCase(updatePurchaseOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePurchaseOrder.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.purchaseOrders.findIndex((po) => po.id === action.payload.id);
        if (index !== -1) {
          state.purchaseOrders[index] = action.payload;
        }
        if (state.currentPO?.id === action.payload.id) {
          state.currentPO = action.payload;
        }
      })
      .addCase(updatePurchaseOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit PO
      .addCase(submitPurchaseOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitPurchaseOrder.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.purchaseOrders.findIndex((po) => po.id === action.payload.id);
        if (index !== -1) {
          state.purchaseOrders[index] = action.payload;
        }
        if (state.currentPO?.id === action.payload.id) {
          state.currentPO = action.payload;
        }
      })
      .addCase(submitPurchaseOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setDraftPO, updateDraftPO, clearDraftPO, clearCurrentPO, clearError } =
  purchaseOrderSlice.actions;

// Selectors
export const selectPurchaseOrders = (state) => state.purchaseOrder.purchaseOrders;
export const selectCurrentPO = (state) => state.purchaseOrder.currentPO;
export const selectDraftPO = (state) => state.purchaseOrder.draftPO;
export const selectPOLoading = (state) => state.purchaseOrder.loading;
export const selectPOError = (state) => state.purchaseOrder.error;

export default purchaseOrderSlice.reducer;
