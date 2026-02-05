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
      return rejectWithValue(error.response?.data || error.message);
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

  // Inventory
  lowStockItems: [],
  inventoryValuation: null,

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

      .addCase(fetchInventoryValuation.fulfilled, (state, action) => {
        state.inventoryValuation = action.payload;
      })

      .addCase(fetchProfitLossReport.fulfilled, (state, action) => {
        state.profitLossReport = action.payload;
      });
  },
});

export const { clearError, clearCurrentPurchaseOrder, clearCurrentSupplier } = erpSlice.actions;

export default erpSlice.reducer;
