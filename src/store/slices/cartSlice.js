import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartService } from '@/services/api/cart.service';

const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  loading: false,
  error: null,
};

// Async Thunks

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    console.log('[CART-DEBUG] 🛒 fetchCart action started - calling API...');
    const response = await cartService.getCart();
    console.log('[CART-DEBUG] ✅ fetchCart API success:', response);
    // Backend returns: { success: true, data: { items: [...], totalPrice: ... } }
    return response.data;
  } catch (error) {
    console.log('[CART-DEBUG] ❌ fetchCart API failed:', error.message);
    return rejectWithValue(error.message || 'Failed to fetch cart');
  }
});

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ product, quantity, color, size, modelId }, { dispatch, rejectWithValue }) => {
    try {
      const payload = {
        productId: product._id || product.id,
        quantity,
        color,
        size,
        modelId,
      };
      await cartService.addToCart(payload);
      // Refresh cart to get latest state and stock info
      dispatch(fetchCart());
      return;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add item to cart');
    }
  }
);

export const updateQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ productId, quantity }, { rejectWithValue }) => {
    // Note: productId argument here is actually the CartItem ID (legacy naming in component)
    try {
      if (quantity < 1) {
        return rejectWithValue('Quantity must be at least 1');
      }
      const response = await cartService.updateCartItem(productId, quantity);
      return { itemId: productId, quantity, total: response.cartTotal };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update quantity');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await cartService.removeFromCart(itemId);
      return { itemId, total: response.cartTotal };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove item');
    }
  }
);

export const addToCartFromLive = createAsyncThunk(
  'cart/addFromLive',
  async (
    { productId, quantity, price, color, size, image, name, sessionId = null },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await cartService.addToCart({
        productId,
        quantity,
        color,
        size,
        liveSessionId: sessionId,
      });
      dispatch(fetchCart());
      return;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Map backend item to frontend format
const mapCartItem = (backendItem) => ({
  id: backendItem._id, // CartItem ID
  productId: backendItem.productId._id, // Actual Product ID
  name: backendItem.productId.name,
  image: backendItem.image || backendItem.productId.images?.[0],
  price: backendItem.price,
  quantity: backendItem.quantity,
  color: backendItem.color,
  size: backendItem.size,
  stockAvailable: backendItem.stockAvailable,
  isAvailable: backendItem.isAvailable,
  preOrderDays: backendItem.productId?.preOrderDays ?? 0,
  sellerId: backendItem.sellerId || null,
  sellerName: backendItem.sellerName || 'Shop',
  // Helper for UI consistent with previous mock data
  variant: `${backendItem.size} - ${backendItem.color}`.trim(),
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      state.error = null;
    },
    setCartError: (state, action) => {
      state.error = action.payload;
    },
    clearCartError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchCart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        const { items, totalPrice } = action.payload;
        state.items = items.map(mapCartItem);
        state.totalPrice = totalPrice;
        state.totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // addToCart
    builder
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // updateQuantity
    builder.addCase(updateQuantity.fulfilled, (state, action) => {
      const { itemId, quantity, total } = action.payload;
      const item = state.items.find((i) => i.id === itemId);
      if (item) {
        item.quantity = quantity;
      }
      state.totalPrice = total;
      state.totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);
    });

    // removeFromCart
    builder.addCase(removeFromCart.fulfilled, (state, action) => {
      const { itemId, total } = action.payload;
      state.items = state.items.filter((i) => i.id !== itemId);
      state.totalPrice = total;
      state.totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);
    });

    // addToCartFromLive
    builder
      .addCase(addToCartFromLive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCartFromLive.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addToCartFromLive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCart, setCartError, clearCartError } = cartSlice.actions;

// Selectors
export const selectCart = (state) => state.cart;
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotalItems = (state) => state.cart.totalItems;
export const selectCartTotalPrice = (state) => state.cart.totalPrice;
export const selectCartError = (state) => state.cart.error;
export const selectCartLoading = (state) => state.cart.loading;

export default cartSlice.reducer;
