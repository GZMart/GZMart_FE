import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as erpService from '../../services/api/erpService';

// ============================================================
// ASYNC THUNKS - Purchase Orders
// ============================================================

export const fetchPurchaseOrders = createAsyncThunk(
  'erp/fetchPurchaseOrders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await erpService.getPurchaseOrders(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchPurchaseOrderById = createAsyncThunk(
  'erp/fetchPurchaseOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await erpService.getPurchaseOrderById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createPurchaseOrder = createAsyncThunk(
  'erp/createPurchaseOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await erpService.createPurchaseOrder(orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const completePurchaseOrder = createAsyncThunk(
  'erp/completePurchaseOrder',
  async (id, { rejectWithValue }) => {
    try {
      const response = await erpService.completePurchaseOrder(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const receivePurchaseOrder = createAsyncThunk(
  'erp/receivePurchaseOrder',
  async ({ id, arrivalCostsPayload }, { rejectWithValue }) => {
    try {
      const response = await erpService.receivePurchaseOrder(id, arrivalCostsPayload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const cancelPurchaseOrder = createAsyncThunk(
  'erp/cancelPurchaseOrder',
  async ({ id, cancelReason }, { rejectWithValue }) => {
    try {
      const response = await erpService.cancelPurchaseOrder(id, cancelReason);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updatePurchaseOrder = createAsyncThunk(
  'erp/updatePurchaseOrder',
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const response = await erpService.updatePurchaseOrder(id, updateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || error.message);
    }
  }
);

// ============================================================
// ASYNC THUNKS - Suppliers
// ============================================================

export const fetchSuppliers = createAsyncThunk(
  'erp/fetchSuppliers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await erpService.getSuppliers(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchSupplierById = createAsyncThunk(
  'erp/fetchSupplierById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await erpService.getSupplierById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createSupplier = createAsyncThunk(
  'erp/createSupplier',
  async (supplierData, { rejectWithValue }) => {
    try {
      const response = await erpService.createSupplier(supplierData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateSupplier = createAsyncThunk(
  'erp/updateSupplier',
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const response = await erpService.updateSupplier(id, updateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteSupplier = createAsyncThunk(
  'erp/deleteSupplier',
  async (id, { rejectWithValue }) => {
    try {
      const response = await erpService.deleteSupplier(id);
      return { id, ...response };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============================================================
// ASYNC THUNKS - Inventory & Reports
// ============================================================

export const fetchLowStockItems = createAsyncThunk(
  'erp/fetchLowStockItems',
  async (params, { rejectWithValue }) => {
    try {
      const response = await erpService.getLowStockItems(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchInventoryValuation = createAsyncThunk(
  'erp/fetchInventoryValuation',
  async (params, { rejectWithValue }) => {
    try {
      const response = await erpService.getInventoryValuation(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || error.message);
    }
  }
);

export const fetchProfitLossReport = createAsyncThunk(
  'erp/fetchProfitLossReport',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await erpService.getProfitLossReport(startDate, endDate);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============================================================
// ASYNC THUNKS - Exchange Rate
// ============================================================

export const fetchExchangeRate = createAsyncThunk(
  'erp/fetchExchangeRate',
  async (_, { rejectWithValue }) => {
    try {
      const response = await erpService.getExchangeRate();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const syncExchangeRate = createAsyncThunk(
  'erp/syncExchangeRate',
  async (_, { rejectWithValue }) => {
    try {
      const response = await erpService.syncExchangeRate();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateExchangeRate = createAsyncThunk(
  'erp/updateExchangeRate',
  async ({ rate, note }, { rejectWithValue }) => {
    try {
      const response = await erpService.updateExchangeRate(rate, note);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============================================================
// ASYNC THUNKS - My Products (Listing Picker)
// ============================================================

export const fetchMyProducts = createAsyncThunk(
  'erp/fetchMyProducts',
  async (params, { rejectWithValue }) => {
    try {
      return await erpService.getMyProducts(params);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============================================================
// SLICE
// ============================================================

const initialState = {
  // Purchase Orders
  purchaseOrders: [],
  currentPurchaseOrder: null,
  purchaseOrdersPagination: null,

  // Suppliers
  suppliers: [],
  currentSupplier: null,
  suppliersPagination: null,

  // My Products (for Listing Picker in CreatePO)
  myProducts: [],
  myProductsLoading: false,

  // Inventory
  lowStockItems: [],
  inventoryValuation: null,

  // Exchange Rate
  exchangeRate: null, // full record from DB
  exchangeRateSyncing: false,

  // Reports
  profitLossReport: null,

  // UI State
  loading: false,
  error: null,
};

const erpSlice = createSlice({
  name: 'erp',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPurchaseOrder: (state) => {
      state.currentPurchaseOrder = null;
    },
    clearCurrentSupplier: (state) => {
      state.currentSupplier = null;
    },
  },
  extraReducers: (builder) => {
    // ============================================================
    // Purchase Orders
    // ============================================================
    builder
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseOrders = action.payload.data;
        state.purchaseOrdersPagination = action.payload.pagination;
      })
      .addCase(fetchPurchaseOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchPurchaseOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPurchaseOrder = action.payload;
      })
      .addCase(fetchPurchaseOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createPurchaseOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPurchaseOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseOrders.unshift(action.payload);
      })
      .addCase(createPurchaseOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(completePurchaseOrder.fulfilled, (state, action) => {
        const index = state.purchaseOrders.findIndex((po) => po._id === action.payload._id);
        if (index !== -1) {
          state.purchaseOrders[index] = action.payload;
        }
        if (state.currentPurchaseOrder?._id === action.payload._id) {
          state.currentPurchaseOrder = action.payload;
        }
      })

      .addCase(cancelPurchaseOrder.fulfilled, (state, action) => {
        const index = state.purchaseOrders.findIndex((po) => po._id === action.payload._id);
        if (index !== -1) {
          state.purchaseOrders[index] = action.payload;
        }
        if (state.currentPurchaseOrder?._id === action.payload._id) {
          state.currentPurchaseOrder = action.payload;
        }
      })

      .addCase(updatePurchaseOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePurchaseOrder.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.purchaseOrders.findIndex((po) => po._id === action.payload._id);
        if (index !== -1) {
          state.purchaseOrders[index] = action.payload;
        }
        state.currentPurchaseOrder = action.payload;
      })
      .addCase(updatePurchaseOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ============================================================
      // Suppliers
      // ============================================================
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload.data;
        state.suppliersPagination = action.payload.pagination;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchSupplierById.fulfilled, (state, action) => {
        state.currentSupplier = action.payload;
      })

      .addCase(createSupplier.fulfilled, (state, action) => {
        state.suppliers.unshift(action.payload);
      })

      .addCase(updateSupplier.fulfilled, (state, action) => {
        const index = state.suppliers.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.suppliers[index] = action.payload;
        }
        if (state.currentSupplier?._id === action.payload._id) {
          state.currentSupplier = action.payload;
        }
      })

      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.suppliers = state.suppliers.filter((s) => s._id !== action.payload.id);
      })

      // ============================================================
      // Inventory & Reports
      // ============================================================
      .addCase(fetchLowStockItems.fulfilled, (state, action) => {
        state.lowStockItems = action.payload.data;
      })
      .addCase(fetchLowStockItems.rejected, (state) => {
        state.lowStockItems = [];
      })

      .addCase(fetchInventoryValuation.fulfilled, (state, action) => {
        state.inventoryValuation = action.payload;
      })
      .addCase(fetchInventoryValuation.rejected, (state) => {
        state.inventoryValuation = {
          totalValue: 0,
          totalItems: 0,
          totalUnits: 0,
          averageCostPerItem: 0,
        };
      })

      .addCase(fetchProfitLossReport.fulfilled, (state, action) => {
        state.profitLossReport = action.payload;
      })

      // ─── Exchange Rate ────────────────────────────────────────────────
      .addCase(fetchExchangeRate.fulfilled, (state, action) => {
        state.exchangeRate = action.payload;
      })
      .addCase(syncExchangeRate.pending, (state) => {
        state.exchangeRateSyncing = true;
      })
      .addCase(syncExchangeRate.fulfilled, (state, action) => {
        state.exchangeRateSyncing = false;
        state.exchangeRate = action.payload;
      })
      .addCase(syncExchangeRate.rejected, (state) => {
        state.exchangeRateSyncing = false;
      })
      .addCase(updateExchangeRate.fulfilled, (state, action) => {
        state.exchangeRate = action.payload;
      })

      // ============================================================
      // My Products (Listing Picker)
      // ============================================================
      .addCase(fetchMyProducts.pending, (state) => {
        state.myProductsLoading = true;
      })
      .addCase(fetchMyProducts.fulfilled, (state, action) => {
        state.myProductsLoading = false;
        state.myProducts = action.payload?.data || action.payload || [];
      })
      .addCase(fetchMyProducts.rejected, (state) => {
        state.myProductsLoading = false;
      });
  },
});

export const { clearError, clearCurrentPurchaseOrder, clearCurrentSupplier } = erpSlice.actions;

export default erpSlice.reducer;
