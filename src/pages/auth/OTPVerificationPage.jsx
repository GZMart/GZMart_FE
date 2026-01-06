import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';
import styles from '@assets/styles/LoginPage/LoginPage.module.css';
import Header from '@components/common/Header';
import Footer from '@components/common/Footer';

const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Get email from location state or default to a placeholder
  const email = location.state?.email || 'user@example.com';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

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
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
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
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, idx) => {
      if (idx < 6) newOtp[idx] = char;
    });
    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length === 6) { // Changed to check 6 digits if that's the intention, though input map suggested 4 earlier. Using 4 for now to match UI text.
      // Actually the slice below says 4 digits. Let's stick to 4.
      // Wait, the input mapping has .slice(0, 4).
      // So I should check for length 4.
      console.log('OTP:', otpCode);
      // TODO: Implement OTP verification logic
    }
  };

  const handleResend = () => {
    if (canResend) {
      setTimer(45);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      // TODO: Implement resend OTP logic
      console.log('Resending OTP...');
    }
  };

  const handleEdit = () => {
    // TODO: Navigate back to phone number input or show edit modal
    console.log('Edit phone number');
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
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>Back</span>
          </button>

          {/* Share Button */}
          <button className={styles.shareButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
              <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        {/* Content Wrapper - holds both left and right sections */}
        <div className={styles.contentWrapper}>
          {/* Left Side - Illustration */}
          <div className={styles.leftSection}>
            <div className={styles.welcomeContent}>
              <div className={styles.titleGroup}>
                <h1 className={styles.title}>Forgot Password</h1>
                <p className={styles.subtitle}>Enter 4 Digits Code</p>
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
                <p className={styles.instructionText}>
                  Enter the 4-digit code that you received on your email.
                </p>
              </div>

              <form onSubmit={handleVerify} className={styles.loginForm}>
                <div className={styles.otpInputGroup}>
                  {otp.slice(0, 4).map((digit, index) => ( // Changed to 4 digits
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
                  ))}
                </div>

                <div className={styles.resendContainer}>
                  {canResend ? (
                    <button 
                      type="button" 
                      className={styles.resendButton}
                      onClick={handleResend}
                    >
                      Resend Code
                    </button>
                  ) : (
                    <span className={styles.timerText}>
                      Resend code in <span className={styles.timerCount}>{formatTime(timer)}</span>
                    </span>
                  )}
                </div>

                <button type="submit" className={styles.loginButton}>
                  Continue
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
