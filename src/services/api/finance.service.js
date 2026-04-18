/**
 * Finance & Topup API Service
 * Xử lý các thao tác tài chính của seller: nạp tiền, rút tiền, chuyển đổi Reward Point
 */
import axiosClient from '../axiosClient';

const BASE_URL = '/api/finance';

/**
 * Kiểu giao dịch
 * @typedef {'deposit' | 'withdraw' | 'convert_rp' | 'earning' | 'refund'} TransactionType
 */

/**
 * Trạng thái giao dịch
 * @typedef {'pending' | 'completed' | 'rejected' | 'cancelled'} TransactionStatus
 */

/**
 * Dữ liệu ví seller
 * @typedef {Object} SellerWallet
 * @property {number} availableBalance - Số dư khả dụng
 * @property {number} pendingBalance - Số dư chờ xử lý
 * @property {number} totalBalance - Tổng số dư
 * @property {number} totalEarning - Tổng thu nhập
 * @property {number} totalWithdraw - Tổng đã rút
 * @property {number} rewardPoints - Điểm thưởng
 */

/**
 * Giao dịch ví
 * @typedef {Object} WalletTransaction
 * @property {string} _id
 * @property {string} transactionId - Mã giao dịch (VD: #DEP-992812)
 * @property {TransactionType} type - Loại giao dịch
 * @property {TransactionStatus} status - Trạng thái
 * @property {number} amount - Số tiền
 * @property {number} balanceAfter - Số dư sau giao dịch
 * @property {string} [note] - Ghi chú
 * @property {string} [bankInfo] - Thông tin ngân hàng (với rút tiền)
 * @property {string} createdAt - Thời gian tạo
 * @property {string} [completedAt] - Thời gian hoàn thành
 */

export const financeService = {
  /**
   * Lấy thông tin ví seller (số dư, thu nhập, rút tiền)
   * @returns {Promise<SellerWallet>}
   */
  getWalletInfo: async () => axiosClient.get(`${BASE_URL}/wallet`),

  /**
   * Lấy danh sách giao dịch ví
   * @param {Object} params
   * @param {number} [params.limit=10] - Số bản ghi mỗi trang
   * @param {number} [params.skip=0] - Bỏ qua bao nhiêu bản ghi
   * @param {TransactionType} [params.type] - Lọc theo loại giao dịch
   * @param {TransactionStatus} [params.status] - Lọc theo trạng thái
   * @param {string} [params.startDate] - Ngày bắt đầu (ISO)
   * @param {string} [params.endDate] - Ngày kết thúc (ISO)
   * @param {string} [params.search] - Tìm kiếm theo mã giao dịch
   * @returns {Promise<{data: WalletTransaction[], total: number}>}
   */
  getTransactions: async (params = {}) => axiosClient.get(`${BASE_URL}/transactions`, { params }),

  /**
   * Tạo yêu cầu nạp tiền - sinh nội dung chuyển khoản
   * @param {Object} data
   * @param {number} data.amount - Số tiền muốn nạp (VND)
   * @returns {Promise<{transferContent: string, amount: number, expiresAt: string}>}
   */
  createDepositRequest: async (data) => axiosClient.post(`${BASE_URL}/deposit`, data),

  /**
   * Tạo link PayOS để nạp token vào ví seller
   * @param {Object} data
   * @param {number} data.amount - Số tiền nạp (VND)
   * @returns {Promise<{orderCode: string|number, checkoutUrl: string}>}
   */
  createTopupLink: async (data) => axiosClient.post(`${BASE_URL}/deposit/topup-link`, data),

  /**
   * Xác nhận đã chuyển khoản (gọi sau khi seller đã chuyển tiền theo nội dung)
   * @param {Object} data
   * @param {string} data.transactionId - Mã yêu cầu nạp tiền
   * @returns {Promise}
   */
  confirmDeposit: async (data) => axiosClient.post(`${BASE_URL}/deposit/confirm`, data),

  /**
   * Tạo yêu cầu rút tiền
   * @param {Object} data
   * @param {number} data.amount - Số tiền muốn rút
   * @param {string} data.bankCode - Mã ngân hàng
   * @param {string} data.accountNumber - Số tài khoản
   * @param {string} data.accountName - Tên chủ tài khoản
   * @returns {Promise<{transactionId: string, status: string}>}
   */
  createWithdrawRequest: async (data) => axiosClient.post(`${BASE_URL}/withdraw`, data),

  /**
   * Tạo yêu cầu rút tiền về tài khoản ngân hàng qua PayOS payout
   * @param {Object} data
   * @param {number} data.amount
   * @param {string} data.bankCode
   * @param {string} data.accountNumber
   * @param {string} data.accountName
   */
  createPayosWithdraw: async (data) => axiosClient.post(`${BASE_URL}/withdraw/payos`, data),

  /**
   * Ước tính phí PayOS payout cho lệnh rút tiền
   * @param {Object} data
   * @param {number} data.amount
   * @param {string} data.bankCode
   * @param {string} data.accountNumber
   * @param {string} [data.accountName]
   */
  estimatePayosWithdraw: async (data) =>
    axiosClient.post(`${BASE_URL}/withdraw/payos/estimate`, data),

  /**
   * Lấy thông tin payout từ PayOS
   * @param {string} payoutId
   */
  getPayosPayoutInfo: async (payoutId) => axiosClient.get(`${BASE_URL}/withdraw/payos/${payoutId}`),

  /**
   * Lấy thông tin tài khoản ngân hàng đã lưu
   * @returns {Promise<{bankCode: string, bankName: string, accountNumber: string, accountName: string}[]>}
   */
  getBankAccounts: async () => axiosClient.get(`${BASE_URL}/bank-accounts`),

  /**
   * Lưu / cập nhật tài khoản ngân hàng
   * @param {Object} data
   * @param {string} data.bankCode - Mã ngân hàng
   * @param {string} data.accountNumber - Số tài khoản
   * @param {string} data.accountName - Tên chủ tài khoản
   * @returns {Promise}
   */
  saveBankAccount: async (data) => axiosClient.post(`${BASE_URL}/bank-accounts`, data),

  /**
   * Chuyển số dư thành Reward Point
   * @param {Object} data
   * @param {number} data.amount - Số tiền muốn chuyển đổi
   * @returns {Promise<{rewardPoints: number, transactionId: string}>}
   */
  convertToRewardPoints: async (data) => axiosClient.post(`${BASE_URL}/convert-rp`, data),

  /**
   * Lấy thống kê nhanh
   * @returns {Promise<{pendingApprovals: number, approvedToday: number, totalTransactions: number}>}
   */
  getQuickStats: async () => axiosClient.get(`${BASE_URL}/quick-stats`),

  /**
   * Hủy yêu cầu rút tiền
   * @param {string} transactionId - Mã giao dịch
   * @returns {Promise}
   */
  cancelWithdrawRequest: async (transactionId) =>
    axiosClient.post(`${BASE_URL}/withdraw/${transactionId}/cancel`),
};

export default financeService;
