/**
 * SellerFinancePage — Quản lý Tài chính / Nạp - Rút tiền
 * Seller Portal > Finance & Topup
 *
 * Chức năng:
 * - Xem số dư ví, thu nhập, đã rút
 * - Nạp tiền qua chuyển khoản ngân hàng
 * - Chuyển số dư thành Reward Point
 * - Rút tiền về tài khoản ngân hàng
 * - Xem lịch sử giao dịch đầy đủ
 *
 * Hỗ trợ đa ngôn ngữ (i18n) sử dụng react-i18next.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  TrendingUp,
  ArrowDownToLine,
  Clock,
  Check,
  History,
  Copy,
  Eye,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { Button, Spin, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/formatters';
import dashboardService from '../../services/api/dashboardService';
import financeService from '../../services/api/finance.service';
import styles from '../../assets/styles/seller/Finance.module.css';

/* ================================================================
   SKELETON COMPONENTS
   ================================================================ */

const SkeletonBalanceGrid = () => (
  <div className={styles.balanceGrid}>
    <div className={`${styles.skeleton} ${styles.skeletonBalanceCard}`} />
    <div className={`${styles.skeleton} ${styles.skeletonSubCard}`} />
    <div className={`${styles.skeleton} ${styles.skeletonSubCard}`} />
    <div className={`${styles.skeleton} ${styles.skeletonSubCard}`} />
  </div>
);

/* ================================================================
   FORMAT HELPERS
   ================================================================ */

const formatInputAmount = (value) => {
  const num = parseInt(value.replace(/\D/g, ''), 10) || 0;
  return num.toLocaleString('vi-VN');
};

const parseAmount = (formatted) => parseInt(formatted.replace(/\D/g, ''), 10) || 0;

/* ================================================================
   AMOUNT INPUT COMPONENT
   ================================================================ */

const AmountInput = ({ value, onChange, placeholder = '0', suffix = 'VND' }) => {
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      onChange('');
    } else {
      onChange(formatInputAmount(raw));
    }
  };

  return (
    <div className={styles.formInputWrap}>
      <input
        className={styles.formInput}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        inputMode="numeric"
      />
      <span className={styles.formInputSuffix}>{suffix}</span>
    </div>
  );
};

AmountInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  suffix: PropTypes.string,
};

/* ================================================================
   DEPOSIT MODAL — Shows transfer content after creating request
   ================================================================ */

const DepositModal = ({ open, onClose, depositData, t: tSub }) => {
  const [copied, setCopied] = useState(false);

  const copyContent = async () => {
    if (!depositData?.transferContent) {
      return;
    }
    try {
      await navigator.clipboard.writeText(depositData.transferContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error(tSub('sellerFinance.toast.copyFailed'));
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{tSub('sellerFinance.depositModal.title')}</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Bank info */}
        <div className={styles.bankInfoCard} style={{ marginBottom: '1rem' }}>
          <div className={styles.bankInfoRow}>
            <span className={styles.bankInfoLabel}>{tSub('sellerFinance.deposit.bank')}</span>
            <span className={styles.bankInfoValue}>Vietcombank</span>
          </div>
          <div className={styles.bankInfoRow}>
            <span className={styles.bankInfoLabel}>{tSub('sellerFinance.deposit.accountNumber')}</span>
            <span className={styles.bankInfoValue}>
              1234567890
              <button className={styles.bankInfoCopy} title="Copy">
                <Copy size={14} />
              </button>
            </span>
          </div>
          <div className={styles.bankInfoRow}>
            <span className={styles.bankInfoLabel}>{tSub('sellerFinance.deposit.accountName')}</span>
            <span className={styles.bankInfoValue}>GZMART JOINT STOCK</span>
          </div>
        </div>

        {/* Transfer amount */}
        <div className={styles.transferAmountBox}>
          <div className={styles.transferAmountLabel}>{tSub('sellerFinance.depositModal.transferAmount')}</div>
          <div className={styles.transferAmountValue}>
            {depositData?.amount ? formatCurrency(depositData.amount) : '—'}
          </div>
        </div>

        {/* Transfer content */}
        <div className={styles.transferCodeBox}>
          <div className={styles.transferCodeLabel}>{tSub('sellerFinance.depositModal.transferContent')}</div>
          <div className={styles.transferCodeValue} style={{ userSelect: 'all' }}>
            {depositData?.transferContent || '—'}
          </div>
        </div>

        {/* Copy button */}
        <button
          className={styles.submitBtn}
          onClick={copyContent}
          style={{ marginBottom: '0.75rem' }}
        >
          <Copy size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {copied ? tSub('sellerFinance.depositModal.copied') : tSub('sellerFinance.depositModal.copyBtn')}
        </button>

        {/* Notice */}
        <div className={styles.noticeBox}>
          <Info size={16} className={styles.noticeBoxIcon} />
          <p className={styles.noticeBoxText}>{tSub('sellerFinance.depositModal.notice')}</p>
        </div>
      </div>
    </div>
  );
};

DepositModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  depositData: PropTypes.object,
  loading: PropTypes.bool,
  onConfirm: PropTypes.func,
  t: PropTypes.func.isRequired,
};

/* ================================================================
   WITHDRAW PIN MODAL
   ================================================================ */

const WithdrawPinModal = ({ open, onClose, amount, onSuccess, t: tSub }) => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);

  const handlePinChange = (idx, val) => {
    if (!/^\d?$/.test(val)) {
      return;
    }
    const newPin = [...pin];
    newPin[idx] = val;
    setPin(newPin);
    setError(false);
    if (val && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
    if (newPin.every((d) => d !== '') && newPin.join('').length === 6) {
      handleVerify(newPin.join(''));
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      onSuccess?.();
    } catch {
      setError(true);
      setPin(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (open) {
      setPin(['', '', '', '', '', '']);
      setError(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.pinModalCard}>
        <div className={styles.pinModalHeader}>
          <div className={styles.pinModalIcon}>
            <Lock size={20} />
          </div>
          <div>
            <h4 className={styles.pinModalTitle}>{tSub('sellerFinance.withdrawPin.title')}</h4>
            <p className={styles.pinModalSub}>{tSub('sellerFinance.withdrawPin.subtitle')}</p>
          </div>
        </div>
        <p className={styles.pinModalDesc}>
          {tSub('sellerFinance.withdrawPin.description', { amount: amount ? formatCurrency(amount) : '' })}
        </p>
        <div className={styles.pinDots}>
          {pin.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`${styles.pinDot} ${digit ? styles.pinDotFilled : ''} ${error ? styles.pinDotError : ''}`}
              disabled={verifying}
            />
          ))}
        </div>
        {error && (
          <p style={{ textAlign: 'center', color: '#dc2626', fontSize: '0.8125rem', fontWeight: 600, margin: '0.5rem 0' }}>
            {tSub('sellerFinance.withdrawPin.pinError')}
          </p>
        )}
        {verifying && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Spin size="small" />
          </div>
        )}
        <button className={styles.pinForgot}>{tSub('sellerFinance.withdrawPin.forgotPin')}</button>
      </div>
    </div>
  );
};

WithdrawPinModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onSuccess: PropTypes.func,
  t: PropTypes.func.isRequired,
};

/* ================================================================
   CONSTANTS GENERATORS (moved into component for i18n support)
   ================================================================ */

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */

const SellerFinancePage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';

  // ── Constants with i18n keys (computed inside component so t() is available)
  const ACTION_TABS = useMemo(() => [
    { key: 'deposit', label: t('sellerFinance.actionTabs.deposit'), icon: 'bi-wallet2' },
    { key: 'convert', label: t('sellerFinance.actionTabs.convert'), icon: 'bi-arrow-repeat' },
    { key: 'withdraw', label: t('sellerFinance.actionTabs.withdraw'), icon: 'bi-bank' },
  ], [t]);

  const TX_TYPE_CONFIG = useMemo(() => ({
    deposit: { label: t('sellerFinance.txType.deposit'), dotColor: '#1a56db', isPositive: true },
    withdraw: { label: t('sellerFinance.txType.withdraw'), dotColor: '#f97316', isPositive: false },
    convert_rp: { label: t('sellerFinance.txType.convert_rp'), dotColor: '#9333ea', isPositive: true },
    earning: { label: t('sellerFinance.txType.earning'), dotColor: '#16a34a', isPositive: true },
    refund: { label: t('sellerFinance.txType.refund'), dotColor: '#dc2626', isPositive: false },
  }), [t]);

  const TX_STATUS_CONFIG = useMemo(() => ({
    completed: { className: styles.txStatusCompleted, label: t('sellerFinance.txStatus.completed') },
    pending: { className: styles.txStatusPending, label: t('sellerFinance.txStatus.pending') },
    rejected: { className: styles.txStatusRejected, label: t('sellerFinance.txStatus.rejected') },
    cancelled: { className: styles.txStatusCancelled, label: t('sellerFinance.txStatus.cancelled') },
  }), [t]);

  const QUICK_AMOUNTS = useMemo(() => [
    { label: '500K', value: 500000 },
    { label: '1M', value: 1000000 },
    { label: '2M', value: 2000000 },
    { label: '5M', value: 5000000 },
    { label: '10M', value: 10000000 },
    { label: '20M', value: 20000000 },
  ], []);

  const BANK_LIST = useMemo(() => [
    { code: 'VCB', name: 'Vietcombank' },
    { code: 'TCB', name: 'Techcombank' },
    { code: 'MBB', name: 'MB Bank' },
    { code: 'ACB', name: 'ACB' },
    { code: 'VPB', name: 'VPBank' },
    { code: 'CTG', name: 'VietinBank' },
    { code: 'BID', name: 'BIDV' },
    { code: 'TPB', name: 'TPBank' },
  ], []);

  // ── Loading states
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);

  // ── Data
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [quickStats, setQuickStats] = useState({ pendingApprovals: 0, approvedToday: 0, totalTransactions: 0 });

  // ── Action tab
  const [activeTab, setActiveTab] = useState('deposit');

  // ── Deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedDepositAmount, setSelectedDepositAmount] = useState(1000000);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositData, setDepositData] = useState(null);

  // ── Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawPinOpen, setWithdrawPinOpen] = useState(false);

  // ── Convert form
  const [convertAmount, setConvertAmount] = useState('');
  const [selectedConvertAmount, setSelectedConvertAmount] = useState(100000);

  // ── Transaction filters
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('');
  const [txPage, setTxPage] = useState(1);
  const txPageSize = 10;

  // ── Bank accounts
  const [savedBankAccounts, setSavedBankAccounts] = useState([]);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({ bankCode: '', accountNumber: '', accountName: '' });

  /* ─── Format date helper ─────────────────────────────────── */
  const formatDate = useCallback((dateStr) => {
    if (!dateStr) {
      return { date: '—', time: '—' };
    }
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
    };
  }, [locale]);

  /* ─── Fetch wallet balance ───────────────────────────────── */
  const fetchBalance = useCallback(async () => {
    try {
      const resp = await dashboardService.getSellerBalance();
      if (resp?.data) {
        setBalance(resp.data);
      }
    } catch {
      // ignore errors, balance stays null → shows empty state
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  /* ─── Fetch transactions ───────────────────────────────── */
  const fetchTransactions = useCallback(async (page = 1) => {
    setTxLoading(true);
    try {
      const params = {
        limit: txPageSize,
        skip: (page - 1) * txPageSize,
        ...(txTypeFilter && { type: txTypeFilter }),
        ...(txSearch && { search: txSearch }),
      };
      const resp = await financeService.getTransactions(params);
      setTransactions(resp?.data?.data ?? []);
      setTxTotal(resp?.data?.total ?? 0);
    } catch {
      setTransactions([]);
      setTxTotal(0);
    } finally {
      setTxLoading(false);
    }
  }, [txTypeFilter, txSearch]);

  /* ─── Fetch quick stats ────────────────────────────────── */
  const fetchQuickStats = useCallback(async () => {
    try {
      const resp = await financeService.getQuickStats();
      if (resp?.data) {
        setQuickStats(resp.data);
      }
    } catch {
      // ignore errors
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /* ─── Fetch bank accounts ─────────────────────────────── */
  const fetchBankAccounts = useCallback(async () => {
    try {
      const resp = await financeService.getBankAccounts();
      if (resp?.data) {
        setSavedBankAccounts(resp.data);
      }
    } catch {
      setSavedBankAccounts([]);
    }
  }, []);

  /* ─── Init ────────────────────────────────────────────── */
  useEffect(() => {
    fetchBalance();
    fetchQuickStats();
    fetchBankAccounts();
  }, [fetchBalance, fetchQuickStats, fetchBankAccounts]);

  useEffect(() => {
    fetchTransactions(txPage);
  }, [txPage, txTypeFilter, txSearch, fetchTransactions]);

  /* ─── Deposit ─────────────────────────────────────────── */
  const handleDeposit = async () => {
    const amount = parseAmount(depositAmount);
    if (!amount || amount < 10000) {
      message.warning(t('sellerFinance.validation.minDeposit'));
      return;
    }
    setDepositLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setDepositData({
        transferContent: `GZMART-NAP-${Date.now()}`,
        amount,
        expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
      });
      setDepositModalOpen(true);
      message.success(t('sellerFinance.toast.depositSuccess'));
    } catch {
      message.error(t('sellerFinance.toast.depositFailed'));
    } finally {
      setDepositLoading(false);
    }
  };

  const handleQuickDeposit = (amount) => {
    setSelectedDepositAmount(amount);
    setDepositAmount(formatInputAmount(String(amount)));
  };

  /* ─── Withdraw ─────────────────────────────────────────── */
  const handleWithdraw = async () => {
    const amount = parseAmount(withdrawAmount);
    if (!amount || amount < 50000) {
      message.warning(t('sellerFinance.validation.minWithdraw'));
      return;
    }
    if (!withdrawBank || !withdrawAccount || !withdrawAccountName) {
      message.warning(t('sellerFinance.validation.incompleteBankInfo'));
      return;
    }
    if (amount > (balance?.availableBalance || 0)) {
      message.warning(t('sellerFinance.validation.insufficientBalance'));
      return;
    }
    setWithdrawPinOpen(true);
  };

  const handleWithdrawConfirm = async () => {
    setWithdrawPinOpen(false);
    setWithdrawLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      message.success(t('sellerFinance.toast.withdrawSuccess'));
      setWithdrawAmount('');
      setWithdrawBank('');
      setWithdrawAccount('');
      setWithdrawAccountName('');
      fetchBalance();
      fetchTransactions(1);
    } catch {
      message.error(t('sellerFinance.toast.withdrawFailed'));
    } finally {
      setWithdrawLoading(false);
    }
  };

  /* ─── Convert to RP ────────────────────────────────────── */
  const handleConvert = async () => {
    const amount = parseAmount(convertAmount);
    if (!amount || amount < 10000) {
      message.warning(t('sellerFinance.validation.minConvert'));
      return;
    }
    if (amount > (balance?.availableBalance || 0)) {
      message.warning(t('sellerFinance.validation.insufficientBalance'));
      return;
    }
    try {
      setConvertLoading(true);
      const resp = await financeService.convertToRewardPoints({ amount });
      message.success(
        t('sellerFinance.convert.successMsg', {
          amount: formatCurrency(amount),
          points: resp?.data?.rewardPoints?.toLocaleString(locale),
        })
      );
      setConvertAmount('');
      fetchBalance();
      fetchTransactions(1);
    } catch (err) {
      const msg = err?.response?.data?.message || t('sellerFinance.toast.convertFailed');
      message.error(msg);
    } finally {
      setConvertLoading(false);
    }
  };

  const handleQuickConvert = (amount) => {
    setSelectedConvertAmount(amount);
    setConvertAmount(formatInputAmount(String(amount)));
  };

  /* ─── Save bank account ────────────────────────────────── */
  const handleSaveBank = async () => {
    if (!bankForm.bankCode || !bankForm.accountNumber || !bankForm.accountName) {
      message.warning(t('sellerFinance.validation.incompleteForm'));
      return;
    }
    try {
      await financeService.saveBankAccount(bankForm);
      message.success(t('sellerFinance.toast.saveBankSuccess'));
      setBankForm({ bankCode: '', accountNumber: '', accountName: '' });
      setShowBankForm(false);
      fetchBankAccounts();
    } catch {
      message.error(t('sellerFinance.toast.saveBankFailed'));
    }
  };

  /* ─── Pagination ───────────────────────────────────────── */
  const totalPages = Math.ceil(txTotal / txPageSize);
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, txPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [txPage, totalPages]);

  /* ─── Copy helper ───────────────────────────────────────── */
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(t('sellerFinance.toast.copied'));
    } catch {
      message.error(t('sellerFinance.toast.copyFailed'));
    }
  };

  /* ─── Tab badge for pending withdraws ─────────────────── */
  const pendingWithdrawCount = useMemo(
    () => transactions.filter((tx) => tx.type === 'withdraw' && tx.status === 'pending').length,
    [transactions],
  );

  /* ─── Render action body ──────────────────────────────── */
  const renderActionBody = () => {
    if (activeTab === 'deposit') {
      return (
        <div className={styles.actionBodyGrid}>
          {/* Bank Info */}
          <div>
            <div className={styles.bankInfoCard}>
              <h3 className={styles.bankInfoCardTitle}>{t('sellerFinance.deposit.transferInfo')}</h3>
              <div className={styles.bankInfoRow}>
                <span className={styles.bankInfoLabel}>{t('sellerFinance.deposit.bank')}</span>
                <span className={styles.bankInfoValue}>Vietcombank</span>
              </div>
              <div className={styles.bankInfoRow}>
                <span className={styles.bankInfoLabel}>{t('sellerFinance.deposit.accountNumber')}</span>
                <span className={styles.bankInfoValue}>
                  1234567890
                  <button className={styles.bankInfoCopy} onClick={() => copyToClipboard('1234567890')} title={t('sellerFinance.depositModal.copyBtn')}>
                    <Copy size={14} />
                  </button>
                </span>
              </div>
              <div className={styles.bankInfoRow}>
                <span className={styles.bankInfoLabel}>{t('sellerFinance.deposit.accountName')}</span>
                <span className={styles.bankInfoValue}>GZMART JOINT STOCK</span>
              </div>
            </div>
            <div className={styles.noticeBox}>
              <Info size={16} className={styles.noticeBoxIcon} />
              <p className={styles.noticeBoxText}>
                <strong>{t('sellerFinance.deposit.note')}:</strong> {t('sellerFinance.deposit.noteText')}
              </p>
            </div>
          </div>

          {/* Deposit Form */}
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t('sellerFinance.deposit.amountToDeposit')}</label>
              <AmountInput value={depositAmount} onChange={setDepositAmount} placeholder={t('sellerFinance.deposit.amountPlaceholder')} />
            </div>
            <div className={styles.quickAmountGrid}>
              {QUICK_AMOUNTS.map((qa) => (
                <button
                  key={qa.value}
                  className={`${styles.quickAmountBtn} ${selectedDepositAmount === qa.value ? styles.quickAmountBtnActive : ''}`}
                  onClick={() => handleQuickDeposit(qa.value)}
                >
                  {qa.label}
                </button>
              ))}
            </div>
            <button
              className={styles.submitBtn}
              onClick={handleDeposit}
              disabled={depositLoading || !parseAmount(depositAmount)}
            >
              {depositLoading ? t('sellerFinance.deposit.processing') : t('sellerFinance.deposit.confirmBtn')}
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === 'convert') {
      return (
        <div className={styles.actionBodyGrid}>
          {/* Info */}
          <div>
            <div className={styles.bankInfoCard}>
              <h3 className={styles.bankInfoCardTitle}>{t('sellerFinance.convert.title')}</h3>
              <div className={styles.bankInfoRow}>
                <span className={styles.bankInfoLabel}>{t('sellerFinance.convert.conversionRate')}</span>
                <span className={styles.bankInfoValue}>{t('sellerFinance.convert.rateValue')}</span>
              </div>
              <div className={styles.bankInfoRow}>
                <span className={styles.bankInfoLabel}>{t('sellerFinance.convert.availableBalance')}</span>
                <span className={styles.bankInfoValue}>
                  {balance?.availableBalance != null ? formatCurrency(balance.availableBalance) : '—'}
                </span>
              </div>
              <div className={styles.bankInfoRow}>
                <span className={styles.bankInfoLabel}>{t('sellerFinance.convert.currentRP')}</span>
                <span className={styles.bankInfoValue}>
                  {balance?.rewardPoints != null ? `${Number(balance.rewardPoints).toLocaleString(locale)} pts` : '—'}
                </span>
              </div>
            </div>
            <div className={styles.noticeBox}>
              <Info size={16} className={styles.noticeBoxIcon} />
              <p className={styles.noticeBoxText}>
                <strong>{t('sellerFinance.convert.note')}:</strong> {t('sellerFinance.convert.noteText')}
              </p>
            </div>
          </div>

          {/* Convert Form */}
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t('sellerFinance.convert.amountToConvert')}</label>
              <AmountInput value={convertAmount} onChange={setConvertAmount} placeholder={t('sellerFinance.convert.amountPlaceholder')} />
            </div>
            <div className={styles.quickAmountGrid}>
              {QUICK_AMOUNTS.map((qa) => (
                <button
                  key={qa.value}
                  className={`${styles.quickAmountBtn} ${selectedConvertAmount === qa.value ? styles.quickAmountBtnActive : ''}`}
                  onClick={() => handleQuickConvert(qa.value)}
                >
                  {qa.label}
                </button>
              ))}
            </div>
            <button
              className={styles.submitBtn}
              onClick={handleConvert}
              disabled={!parseAmount(convertAmount) || convertLoading}
            >
              {convertLoading ? t('sellerFinance.convert.processing') : t('sellerFinance.convert.confirmBtn')}
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === 'withdraw') {
      return (
        <div className={styles.actionBodyGrid}>
          {/* Bank Account */}
          <div>
            <div className={styles.bankInfoCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className={styles.bankInfoCardTitle} style={{ margin: 0 }}>{t('sellerFinance.withdraw.recipientAccount')}</h3>
                <button
                  className={styles.submitBtn}
                  style={{ padding: '0.375rem 0.875rem', fontSize: '0.75rem', width: 'auto' }}
                  onClick={() => setShowBankForm(!showBankForm)}
                >
                  {showBankForm ? t('sellerFinance.withdraw.closeBtn') : t('sellerFinance.withdraw.updateBtn')}
                </button>
              </div>

              {showBankForm ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <select
                    className={styles.bankSelect}
                    value={bankForm.bankCode}
                    onChange={(e) => setBankForm((f) => ({ ...f, bankCode: e.target.value }))}
                  >
                    <option value="">{t('sellerFinance.withdraw.selectBank')}</option>
                    {BANK_LIST.map((b) => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                  <input
                    className={styles.formInput}
                    style={{ fontSize: '0.875rem', fontWeight: 600 }}
                    placeholder={t('sellerFinance.withdraw.accountNumber')}
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value }))}
                  />
                  <input
                    className={styles.formInput}
                    style={{ fontSize: '0.875rem', fontWeight: 600 }}
                    placeholder={t('sellerFinance.withdraw.accountHolderName')}
                    value={bankForm.accountName}
                    onChange={(e) => setBankForm((f) => ({ ...f, accountName: e.target.value }))}
                  />
                  <button className={styles.submitBtn} onClick={handleSaveBank} style={{ fontSize: '0.8125rem' }}>
                    {t('sellerFinance.withdraw.saveBtn')}
                  </button>
                </div>
              ) : savedBankAccounts.length > 0 ? (
                savedBankAccounts.map((acc, idx) => (
                  <div key={idx} className={styles.bankInfoRow}>
                    <span className={styles.bankInfoLabel}>{acc.bankName || acc.bankCode}</span>
                    <span className={styles.bankInfoValue}>{acc.accountNumber}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.8125rem' }}>
                  {t('sellerFinance.withdraw.noBankAccount')}
                </div>
              )}
            </div>
            <div className={styles.noticeBox}>
              <Info size={16} className={styles.noticeBoxIcon} />
              <p className={styles.noticeBoxText}>
                <strong>{t('sellerFinance.withdraw.note')}:</strong> {t('sellerFinance.withdraw.noteText')}
              </p>
            </div>
          </div>

          {/* Withdraw Form */}
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t('sellerFinance.withdraw.amountToWithdraw')}</label>
              <AmountInput
                value={withdrawAmount}
                onChange={setWithdrawAmount}
                placeholder={t('sellerFinance.withdraw.amountPlaceholder')}
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                {t('sellerFinance.withdraw.availableBalance')}: {balance?.availableBalance != null ? formatCurrency(balance.availableBalance) : '—'}
              </span>
            </div>
            <div className={styles.quickAmountGrid}>
              {QUICK_AMOUNTS.map((qa) => (
                <button
                  key={qa.value}
                  className={`${styles.quickAmountBtn} ${parseAmount(withdrawAmount) === qa.value ? styles.quickAmountBtnActive : ''}`}
                  onClick={() => {
                    setWithdrawAmount(formatInputAmount(String(qa.value)));
                  }}
                >
                  {qa.label}
                </button>
              ))}
            </div>
            <button
              className={styles.submitBtn}
              onClick={handleWithdraw}
              disabled={withdrawLoading || !parseAmount(withdrawAmount)}
            >
              {withdrawLoading ? t('sellerFinance.withdraw.processing') : t('sellerFinance.withdraw.confirmBtn')}
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageContent}>

        {/* ── Header ── */}
        <div className={styles.headerCard}>
          <div className={styles.headerInner}>
            <div className={styles.headerLeft}>
              <nav className={styles.headerBreadcrumb}>
                <a href="#">{t('sellerFinance.breadcrumb.dashboard')}</a>
                <span>/</span>
                <span>{t('sellerFinance.breadcrumb.finance')}</span>
              </nav>
              <h1 className={styles.headerTitle}>{t('sellerFinance.pageTitle')}</h1>
            </div>
            <div className={styles.headerRight}>
              <Button
                icon={<RefreshCw size={14} />}
                onClick={() => {
                  fetchBalance(); fetchTransactions(1); fetchQuickStats();
                }}
              >
                {t('sellerFinance.refresh')}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Balance Overview ── */}
        {balanceLoading ? (
          <SkeletonBalanceGrid />
        ) : (
          <div className={styles.balanceGrid}>
            {/* Main: Available Balance */}
            <div className={styles.balanceMainCard}>
              <div className={styles.balanceMainCardTop}>
                <div className={styles.balanceMainCardLabel}>{t('sellerFinance.balance.availableBalance')}</div>
                <div className={styles.balanceMainCardAmount}>
                  {balance?.availableBalance != null
                    ? Math.round(balance.availableBalance).toLocaleString(locale)
                    : '0'}
                  <span className={styles.balanceMainCardAmountSmall}> VND</span>
                </div>
              </div>
              <div className={styles.balanceMainCardBottom}>
                <div className={styles.balanceMainCardRp}>
                  <div className={styles.balanceMainCardRpLabel}>{t('sellerFinance.balance.rewardPoints')}</div>
                  <div className={styles.balanceMainCardRpValue}>
                    {balance?.rewardPoints != null
                      ? Number(balance.rewardPoints).toLocaleString(locale)
                      : '0'} pts
                  </div>
                </div>
              </div>
            </div>

            {/* Sub: Total Earnings */}
            <div className={styles.balanceSubCard}>
              <div className={styles.balanceSubCardIcon} style={{ background: '#f0fdf4' }}>
                <TrendingUp size={20} color="#16a34a" />
              </div>
              <div>
                <div className={styles.balanceSubCardLabel}>{t('sellerFinance.balance.totalEarnings')}</div>
                <div className={styles.balanceSubCardValue}>
                  {balance?.totalEarning != null ? formatCurrency(balance.totalEarning) : '—'}
                </div>
              </div>
            </div>

            {/* Sub: Total Withdrawn */}
            <div className={styles.balanceSubCard}>
              <div className={styles.balanceSubCardIcon} style={{ background: '#eff6ff' }}>
                <ArrowDownToLine size={20} color="#1a56db" />
              </div>
              <div>
                <div className={styles.balanceSubCardLabel}>{t('sellerFinance.balance.totalWithdrawn')}</div>
                <div className={styles.balanceSubCardValue}>
                  {balance?.totalWithdraw != null ? formatCurrency(balance.totalWithdraw) : '—'}
                </div>
              </div>
            </div>

            {/* Sub: Total Refund */}
            <div className={styles.balanceSubCard}>
              <div className={styles.balanceSubCardIcon} style={{ background: '#fef2f2' }}>
                <ArrowDownToLine size={20} color="#dc2626" />
              </div>
              <div>
                <div className={styles.balanceSubCardLabel}>{t('sellerFinance.balance.totalRefund')}</div>
                <div className={styles.balanceSubCardValue}>
                  {balance?.totalRefund != null ? formatCurrency(balance.totalRefund) : '—'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Action Tabs ── */}
        <div className={styles.actionSection}>
          <div className={styles.actionTabs}>
            {ACTION_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.actionTab} ${activeTab === tab.key ? styles.actionTabActive : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <i className={`bi ${tab.icon} ${styles.actionTabIcon}`} />
                {tab.label}
                {tab.key === 'withdraw' && pendingWithdrawCount > 0 && (
                  <span className={`${styles.actionTabBadge} ${activeTab === tab.key ? styles.actionTabBadgeActive : ''}`}>
                    {pendingWithdrawCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className={styles.actionBody}>{renderActionBody()}</div>
        </div>

        {/* ── Quick Stats Row ── */}
        {statsLoading ? (
          <div className={styles.quickStatsRow}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={`${styles.skeleton}`} style={{ height: 72, borderRadius: 12 }} />
            ))}
          </div>
        ) : (
          <div className={styles.quickStatsRow}>
            <div className={styles.quickStatCard}>
              <div className={styles.quickStatLeft}>
                <div className={styles.quickStatIcon} style={{ background: '#fff7ed', color: '#ea580c' }}>
                  <Clock size={20} />
                </div>
                <div className={styles.quickStatContent}>
                  <span className={styles.quickStatLabel}>{t('sellerFinance.quickStats.pendingApprovals')}</span>
                  <span className={styles.quickStatValue}>
                    {quickStats.pendingApprovals} {t('sellerFinance.quickStats.pendingUnit')}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className={styles.quickStatArrow} />
            </div>
            <div className={styles.quickStatCard}>
              <div className={styles.quickStatLeft}>
                <div className={styles.quickStatIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <Check size={20} />
                </div>
                <div className={styles.quickStatContent}>
                  <span className={styles.quickStatLabel}>{t('sellerFinance.quickStats.approvedToday')}</span>
                  <span className={styles.quickStatValue}>
                    {quickStats.approvedToday} {t('sellerFinance.quickStats.approvedUnit')}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className={styles.quickStatArrow} />
            </div>
            <div className={styles.quickStatCard}>
              <div className={styles.quickStatLeft}>
                <div className={styles.quickStatIcon} style={{ background: '#eff6ff', color: '#1a56db' }}>
                  <History size={20} />
                </div>
                <div className={styles.quickStatContent}>
                  <span className={styles.quickStatLabel}>{t('sellerFinance.quickStats.totalTransactions')}</span>
                  <span className={styles.quickStatValue}>
                    {quickStats.totalTransactions.toLocaleString(locale)} {t('sellerFinance.quickStats.transactionsUnit')}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className={styles.quickStatArrow} />
            </div>
          </div>
        )}

        {/* ── Transaction History ── */}
        <div className={styles.historySection}>
          <div className={styles.historyHeader}>
            <h3 className={styles.historyTitle}>{t('sellerFinance.transactionHistory.title')}</h3>
            <div className={styles.historyFilters}>
              <div className={styles.historySearchWrap}>
                <i className={`bi bi-search ${styles.historySearchIcon}`} style={{ fontSize: '14px' }} />
                <input
                  className={styles.historySearch}
                  placeholder={t('sellerFinance.transactionHistory.searchPlaceholder')}
                  value={txSearch}
                  onChange={(e) => {
                    setTxSearch(e.target.value); setTxPage(1);
                  }}
                />
              </div>
              <select
                className={styles.historySelect}
                value={txTypeFilter}
                onChange={(e) => {
                  setTxTypeFilter(e.target.value); setTxPage(1);
                }}
              >
                <option value="">{t('sellerFinance.transactionHistory.filterAll')}</option>
                <option value="deposit">{t('sellerFinance.transactionHistory.filterDeposit')}</option>
                <option value="withdraw">{t('sellerFinance.transactionHistory.filterWithdraw')}</option>
                <option value="convert_rp">{t('sellerFinance.transactionHistory.filterConvertRp')}</option>
                <option value="earning">{t('sellerFinance.transactionHistory.filterEarning')}</option>
                <option value="refund">{t('sellerFinance.transactionHistory.filterRefund')}</option>
              </select>
              <div className={styles.historyDateRange}>
                <i className="bi bi-calendar3" style={{ fontSize: '14px' }} />
                <span>{t('sellerFinance.transactionHistory.dateRange')}</span>
              </div>
              <button className={styles.historyFilterBtn} title={t('sellerFinance.transactionHistory.advancedFilter')}>
                <i className="bi bi-funnel" style={{ fontSize: '14px' }} />
              </button>
            </div>
          </div>

          {/* Table */}
          {txLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Spin />
            </div>
          ) : transactions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <History size={24} />
              </div>
              <p>{t('sellerFinance.transactionHistory.empty')}</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>{t('sellerFinance.transactionHistory.table.date')}</th>
                      <th>{t('sellerFinance.transactionHistory.table.transactionId')}</th>
                      <th>{t('sellerFinance.transactionHistory.table.type')}</th>
                      <th>{t('sellerFinance.transactionHistory.table.amount')}</th>
                      <th>{t('sellerFinance.transactionHistory.table.balanceAfter')}</th>
                      <th>{t('sellerFinance.transactionHistory.table.status')}</th>
                      <th style={{ textAlign: 'right' }}>{t('sellerFinance.transactionHistory.table.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const typeConfig = TX_TYPE_CONFIG[tx.type] || TX_TYPE_CONFIG.deposit;
                      const statusConfig = TX_STATUS_CONFIG[tx.status] || TX_STATUS_CONFIG.completed;
                      const { date, time } = formatDate(tx.createdAt);
                      const isPositive = typeConfig.isPositive;

                      return (
                        <tr key={tx._id || tx.transactionId}>
                          <td>
                            <div className={styles.txDate}>
                              <span className={styles.txDateMain}>{date}</span>
                              <span className={styles.txDateTime}>{time}</span>
                            </div>
                          </td>
                          <td>
                            <span className={styles.txId}>{tx.transactionId || `#${tx._id?.slice(-8).toUpperCase()}`}</span>
                          </td>
                          <td>
                            <div className={styles.txTypeCell}>
                              <span className={styles.txTypeDot} style={{ background: typeConfig.dotColor }} />
                              <span className={styles.txTypeLabel}>{typeConfig.label}</span>
                            </div>
                          </td>
                          <td>
                            <span className={isPositive ? styles.txAmountPositive : styles.txAmountNegative}>
                              {isPositive ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                            </span>
                          </td>
                          <td>
                            <span className={styles.txBalance}>
                              {tx.balanceAfter != null ? formatCurrency(tx.balanceAfter) : '—'}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.txStatus} ${statusConfig.className}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className={styles.txAction}>
                            <button className={styles.txActionBtn} title={t('sellerFinance.transactionHistory.viewDetails')}>
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer / Pagination */}
              <div className={styles.historyFooter}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                  {t('sellerFinance.transactionHistory.showing', { shown: transactions.length, total: txTotal })}
                </span>
                <div className={styles.historyPagination}>
                  <button
                    className={`${styles.historyPageBtn} ${txPage === 1 ? styles.historyPageBtnDisabled : ''}`}
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    disabled={txPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      className={`${styles.historyPageBtn} ${p === txPage ? styles.historyPageBtnActive : ''}`}
                      onClick={() => setTxPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className={`${styles.historyPageBtn} ${txPage === totalPages ? styles.historyPageBtnDisabled : ''}`}
                    onClick={() => setTxPage((p) => Math.min(totalPages, p + 1))}
                    disabled={txPage === totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      {/* ── Modals ── */}
      <DepositModal
        open={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        depositData={depositData}
        loading={depositLoading}
        t={t}
      />
      <WithdrawPinModal
        open={withdrawPinOpen}
        onClose={() => setWithdrawPinOpen(false)}
        amount={parseAmount(withdrawAmount)}
        onSuccess={handleWithdrawConfirm}
        t={t}
      />
    </div>
  );
};

export default SellerFinancePage;
