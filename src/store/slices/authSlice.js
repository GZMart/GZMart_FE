import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  setAuthToken,
  setRefreshToken,
  setUserData,
  clearAuthData,
  getUserData,
  getAuthToken,
  getRefreshToken,
} from '@utils/storage';
import authService from '@services/api/authService';

const initialState = {
  isAuthenticated: !!getAuthToken(),
  user: getUserData() || null,
  token: getAuthToken(),
  refreshToken: getRefreshToken(),
  loading: false,
  error: null,
};

/**
 * Async Thunks for Auth Actions
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      
      // Handle different response formats
      let user, accessToken, refreshToken;
      
      if (response.data) {
        // Format: { success: true, data: { user, tokens: { accessToken, refreshToken } } }
        user = response.data.user;
        accessToken = response.data.tokens?.accessToken || response.data.tokens?.token;
        refreshToken = response.data.tokens?.refreshToken;
      } else {
        // Fallback format
        user = response.user;
        accessToken = response.token || response.accessToken;
        refreshToken = response.refreshToken;
      }

      return { user, token: accessToken, refreshToken };
    } catch (error) {
      return rejectWithValue(error.message || 'Đăng nhập thất bại');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      
      // Register now only returns user info, no tokens yet
      // Tokens will be returned after OTP verification
      let user;
      let otp = null;
      
      if (response.data) {
        user = response.data.user;
        // In development, OTP might be included in response
        otp = response.data.otp || null;
      } else {
        user = response.user;
        otp = response.otp || null;
      }

      // Return user info and OTP (if in development)
      return { user, token: null, refreshToken: null, otp };
    } catch (error) {
      // Extract error message from response
      let errorMessage = 'Đăng ký thất bại';
      
      if (error.response?.data) {
        // Backend error format: { success: false, error: "message" }
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle array of error messages (from validation)
      if (Array.isArray(errorMessage)) {
        errorMessage = errorMessage.join(', ');
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.loginWithGoogle(data);
      
      return {
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
        isNewUser: response.isNewUser,
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Đăng nhập Google thất bại');
    }
  }
);

export const loginWithFacebook = createAsyncThunk(
  'auth/loginWithFacebook',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.loginWithFacebook(data);
      
      return {
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
        isNewUser: response.isNewUser,
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Đăng nhập Facebook thất bại');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authService.logout();
    return true;
  } catch (error) {
    // Even if API call fails, we should logout locally
    return true;
  }
});

export const refreshAuthToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const refreshToken = getState().auth.refreshToken || getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshToken);
      
      return response.token || response.data?.token;
    } catch (error) {
      return rejectWithValue(error.message || 'Refresh token thất bại');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser();
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.message || 'Lấy thông tin người dùng thất bại');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ userData, formData }, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(userData, formData);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.message || 'Cập nhật profile thất bại');
    }
  }
);

export const changeUserPassword = createAsyncThunk(
  'auth/changePassword',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Đổi mật khẩu thất bại');
    }
  }
);

export const setUserPassword = createAsyncThunk(
  'auth/setPassword',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.setPassword(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Đặt mật khẩu thất bại');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(email);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Gửi email reset mật khẩu thất bại');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Reset mật khẩu thất bại');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await authService.verifyEmail(token);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Xác thực email thất bại');
    }
  }
);

export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.resendVerification(email);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Gửi lại email xác thực thất bại');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;

      // Persist to localStorage
      setAuthToken(action.payload.token);
      if (action.payload.refreshToken) {
        setRefreshToken(action.payload.refreshToken);
      }
      setUserData(action.payload.user);
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null;

      // Clear localStorage
      clearAuthData();
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      setUserData(state.user);
    },
    updateToken: (state, action) => {
      state.token = action.payload;
      setAuthToken(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;

        setAuthToken(action.payload.token);
        if (action.payload.refreshToken) {
          setRefreshToken(action.payload.refreshToken);
        }
        setUserData(action.payload.user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        // Don't set authenticated yet - user needs to verify OTP first
        state.isAuthenticated = false;
        state.user = action.payload.user;
        state.token = null; // No token until OTP is verified
        state.refreshToken = null;
        state.error = null;

        // Don't save tokens yet - only save user info temporarily
        if (action.payload.user) {
          setUserData(action.payload.user);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      // Google Login
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;

        setAuthToken(action.payload.token);
        if (action.payload.refreshToken) {
          setRefreshToken(action.payload.refreshToken);
        }
        setUserData(action.payload.user);
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      // Facebook Login
      .addCase(loginWithFacebook.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithFacebook.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;

        setAuthToken(action.payload.token);
        if (action.payload.refreshToken) {
          setRefreshToken(action.payload.refreshToken);
        }
        setUserData(action.payload.user);
      })
      .addCase(loginWithFacebook.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = null;
        clearAuthData();
      })
      // Refresh Token
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.token = action.payload;
        setAuthToken(action.payload);
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        clearAuthData();
      })
      // Get Current User
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        setUserData(action.payload);
      })
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        setUserData(action.payload);
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser, updateToken, clearError } =
  authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectAuthToken = (state) => state.auth.token;
export const selectRefreshToken = (state) => state.auth.refreshToken;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
