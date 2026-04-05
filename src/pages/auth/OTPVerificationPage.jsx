import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { PUBLIC_ROUTES } from '@constants/routes';
import styles from '@assets/styles/common/LoginPage/LoginPage.module.css';
import Header from '@components/common/Header';
import Footer from '@components/common/Footer';
import authService from '@services/api/authService';
import { loginSuccess } from '@store/slices/authSlice';

const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { t } = useTranslation();
  // Get email and OTP (if in development) from location state
  const email = location.state?.email;
  const devOTP = location.state?.otp; // OTP from registration (development only)

  const [otp, setOtp] = useState(['', '', '', '']); // 4 digits
  const [timer, setTimer] = useState(60); // 60 seconds
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      toast.error(t('otp_page.errors.invalid_email_redirect'));
      navigate(PUBLIC_ROUTES.REGISTER);
    }
  }, [email, navigate, t]);

  // In development, show OTP if available (Disabled)
  useEffect(() => {
    /*
    if (devOTP && import.meta.env.DEV) {
      console.log('🔐 OTP from registration:', devOTP);
      // setOtp(devOTP.split(''));
    }
    */
  }, [devOTP]);

  // Helper function to format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4); // 4 digits
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newOtp = ['', '', '', ''];
    pastedData.split('').forEach((char, idx) => {
      if (idx < 4) {
        newOtp[idx] = char;
      }
    });
    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length - 1, 3);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 4) {
      toast.error(t('otp_page.validation.required_otp'));
      return;
    }

    if (!email) {
      toast.error(t('otp_page.validation.invalid_email'));
      return;
    }

    setVerifying(true);

    try {
      const response = await authService.verifyOTP({ email, otp: otpCode });

      // OTP verified successfully
      if (response.data && response.data.user && response.data.tokens) {
        // Dispatch login success to update Redux state
        dispatch(
          loginSuccess({
            user: response.data.user,
            token: response.data.tokens.accessToken,
            refreshToken: response.data.tokens.refreshToken,
          })
        );

        toast.success(t('otp_page.success_message'));

        // Navigate based on user role
        const user = response.data.user;
        setTimeout(() => {
          if (user.role === 'seller') {
            navigate('/seller/dashboard');
          } else if (user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate(PUBLIC_ROUTES.HOME);
          }
        }, 1000);
      } else {
        toast.error(t('otp_page.errors.default'));
      }
    } catch (error) {
      const errorMessage =
        error.message || error.response?.data?.error || t('otp_page.errors.default');
      toast.error(errorMessage);
      // Clear OTP on error
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) {
      return;
    }

    setLoading(true);
    try {
      const response = await authService.sendOTP(email);

      const message = t('otp_page.resend_success');

      // In development, show OTP if available (Disabled)
      /*
      if (response?.otp && import.meta.env.DEV) {
        message += `\n\n🔐 Mã OTP (Development): ${response.otp}`;
         console.log('🔐 Resend OTP:', response.otp);
      }
      */

      toast.success(message, {
        autoClose: response?.otp ? 10000 : 3000,
      });

      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      const errorMessage =
        error.message || error.response?.data?.error || t('otp_page.errors.resend_failed');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <Header />

      {/* Main OTP Verification Content */}
      <div className={styles.loginContainer}>
        {/* Navigation Bar spanning full width with Back and Share buttons */}
        <div className={styles.navigationBar}>
          {/* Back Button - Circle with text */}
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <div className={styles.backIconCircle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span>{t('otp_page.back')}</span>
          </button>

          {/* Share Button */}
          <button className={styles.shareButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
              <path
                d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>

        {/* Content Wrapper - holds both left and right sections */}
        <div className={styles.contentWrapper}>
          {/* Left Side - Illustration */}
          <div className={styles.leftSection}>
            <div className={styles.welcomeContent}>
              <div className={styles.titleGroup}>
                <h1 className={styles.title}>{t('otp_page.title')}</h1>
                <p className={styles.subtitle}>{t('otp_page.subtitle')}</p>
              </div>

              <div className={styles.illustrationWrapper}>
                <div className={styles.cssIllustration}>
                  {/* Background animated circles */}
                  <div className={styles.bgCircle}></div>
                  <div className={styles.bgCircle}></div>
                  <div className={styles.bgCircle}></div>

                  {/* Main shopping bag */}
                  <div className={styles.shoppingBag}>
                    <div className={styles.bagHandle}></div>
                    <div className={styles.bagBody}>
                      <div className={styles.bagItem}></div>
                      <div className={styles.bagItem}></div>
                      <div className={styles.bagItem}></div>
                    </div>
                  </div>

                  {/* Floating cart */}
                  <div className={styles.floatingCart}>
                    <div className={styles.cartBody}>
                      <div className={styles.cartWheel}></div>
                      <div className={styles.cartWheel}></div>
                    </div>
                  </div>

                  {/* Price tag */}
                  <div className={styles.priceTag}>%</div>

                  {/* Decorative floating circles */}
                  <div className={styles.floatingCircle}></div>
                  <div className={styles.floatingCircle}></div>
                  <div className={styles.floatingCircle}></div>
                </div>
              </div>

              <div className={styles.signupPrompt}>
                <span className={styles.signupText}>{email}</span>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className={styles.rightSection}>
            <div className={`${styles.formWrapper} ${styles.otpWrapper}`}>
              <div className={styles.otpHeader}>
                <p className={styles.instructionText}>{t('otp_page.instruction')}</p>
              </div>

              <form onSubmit={handleVerify} className={styles.loginForm}>
                <div className={styles.otpInputGroup}>
                  {otp.slice(0, 4).map(
                    (
                      digit,
                      index // Changed to 4 digits
                    ) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        maxLength="1"
                        className={styles.otpInput}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        autoFocus={index === 0}
                      />
                    )
                  )}
                </div>

                <div className={styles.resendContainer}>
                  {canResend ? (
                    <button
                      type="button"
                      className={styles.resendButton}
                      onClick={handleResend}
                      disabled={loading}
                    >
                      {loading ? t('otp_page.sending') : t('otp_page.resend_button')}
                    </button>
                  ) : (
                    <span className={styles.timerText}>
                      {t('otp_page.resend_timer')}{' '}
                      <span className={styles.timerCount}>{formatTime(timer)}</span>
                    </span>
                  )}
                </div>

                <button type="submit" className={styles.loginButton} disabled={verifying}>
                  {verifying ? t('otp_page.verifying') : t('otp_page.submit_button')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OTPVerificationPage;
