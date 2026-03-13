import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  isMinimized: false,
  activeChatId: null, // 'ai' or conversationId
  pendingSellerId: null, // To trigger opening a new/existing chat with a seller
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    toggleChat: (state) => {
      state.isOpen = !state.isOpen;
      if (!state.isOpen) {
        state.isMinimized = false;
      }
    },
    openChat: (state) => {
      state.isOpen = true;
      state.isMinimized = false;
    },
    closeChat: (state) => {
      state.isOpen = false;
    },
    minimizeChat: (state) => {
      state.isMinimized = true;
    },
    restoreChat: (state) => {
      state.isMinimized = false;
    },
    setActiveChat: (state, action) => {
      state.activeChatId = action.payload;
    },
    startChatWithSeller: (state, action) => {
      state.isOpen = true;
      state.isMinimized = false;
      state.pendingSellerId = action.payload;
    },
    clearPendingSeller: (state) => {
      state.pendingSellerId = null;
    },
  },
});

export const {
  toggleChat,
  openChat,
  closeChat,
  minimizeChat,
  restoreChat,
  setActiveChat,
  startChatWithSeller,
  clearPendingSeller,
} = chatSlice.actions;

export default chatSlice.reducer;
