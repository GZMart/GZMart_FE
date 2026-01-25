import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { PUBLIC_ROUTES } from '@constants/routes';
import styles from '@assets/styles/LoginPage/LoginPage.module.css';
import Header from '@components/common/Header';
import Footer from '@components/common/Footer';
import { registerUser } from '@store/slices/authSlice';

const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      fullName: Yup.string()
        .min(2, 'Họ tên phải có ít nhất 2 ký tự')
        .required('Vui lòng nhập họ và tên'),
      email: Yup.string()
        .email('Email không hợp lệ')
        .required('Vui lòng nhập email'),
      password: Yup.string()
        .required('Please input your password!')
        .min(8, 'Password must be at least 8 characters!')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter!')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter!')
        .matches(/[0-9]/, 'Password must contain at least one number!')
        .matches(/[@$!%*?&#]/, 'Password must contain at least one special character (@$!%*?&#)!'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const result = await dispatch(
          registerUser({
            fullName: values.fullName,
            email: values.email,
            password: values.password,
          })
        ).unwrap();

        // Đăng ký thành công - OTP đã được gửi
        let message = 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.';

        // Commented out dev mode OTP display as requested
        /*
        if (result?.otp && import.meta.env.DEV) {
          message += `\n\n🔐 Mã OTP (Development): ${result.otp}`;
          console.log('🔐 Registration OTP:', result.otp);
        }
        */

        toast.success(message, {
          autoClose: result?.otp ? 10000 : 3000, // Show longer if OTP is included
        });

        // Navigate to OTP verification page
        setTimeout(() => {
          navigate(PUBLIC_ROUTES.OTP_VERIFICATION, {
            state: {
              email: values.email,
              fullName: values.fullName,
              otp: result?.otp, // Pass OTP in development
            },
          });
        }, 1000);
      } catch (error) {
        // Hiển thị lỗi - error đã được format từ authSlice
        const errorMessage = error || 'Đăng ký thất bại. Vui lòng thử lại.';
        toast.error(errorMessage);
        setLoading(false);
      }
    },
  });

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      // TODO: Implement Google OAuth - cần lấy thông tin từ Google OAuth
      toast.info('Tính năng đăng ký bằng Google đang được phát triển');
      setLoading(false);
    } catch (error) {
      toast.error('Đăng ký Google thất bại');
      setLoading(false);
    }
  };

  const handleFacebookSignup = async () => {
    try {
      setLoading(true);
      // TODO: Implement Facebook OAuth - cần lấy thông tin từ Facebook OAuth
      toast.info('Tính năng đăng ký bằng Facebook đang được phát triển');
      setLoading(false);
    } catch (error) {
      toast.error('Đăng ký Facebook thất bại');
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <Header />

      {/* Main Register Content */}
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
            <span>Back</span>
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
                <h1 className={styles.title}>Create an Account</h1>
                <p className={styles.subtitle}>Join us today</p>
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
                <span className={styles.signupText}>Already have an account?</span>
                <Link to={PUBLIC_ROUTES.LOGIN} className={styles.signupLink}>
                  Login
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className={styles.rightSection}>
            <div className={styles.formWrapper}>
              <form onSubmit={formik.handleSubmit} className={styles.loginForm}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    className={`${styles.input} ${
                      formik.touched.fullName && formik.errors.fullName ? 'is-invalid' : ''
                    }`}
                    placeholder="Enter your full name"
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.fullName && formik.errors.fullName && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {formik.errors.fullName}
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    name="email"
                    className={`${styles.input} ${
                      formik.touched.email && formik.errors.email ? 'is-invalid' : ''
                    }`}
                    placeholder="Enter your email address"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {formik.errors.email}
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Password</label>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className={`${styles.input} ${
                        formik.touched.password && formik.errors.password ? 'is-invalid' : ''
                      }`}
                      placeholder="Enter your password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M3 3L21 21M10.5 10.5C10.0353 10.9646 9.75 11.6022 9.75 12.3C9.75 13.6569 10.8431 14.75 12 14.75C12.6978 14.75 13.3354 14.4647 13.8 14M6.5 6.5C4.8 7.7 3 10 3 12C3 15 7.5 19 12 19C13.5 19 15 18.5 16.5 17.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M12 5C16.5 5 21 8 21 12C21 13 20.5 14 19.5 15"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {formik.touched.password && formik.errors.password && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {formik.errors.password}
                    </div>
                  )}
                </div>

                <button type="submit" className={styles.loginButton} disabled={loading}>
                  {loading ? 'Đang đăng ký...' : 'Sign Up'}
                </button>

                <div className={styles.divider}>
                  <span>Or</span>
                </div>

                <button type="button" className={styles.socialButton} onClick={handleGoogleSignup}>
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign Up with Google</span>
                </button>

                <button
                  type="button"
                  className={styles.socialButtonFacebook}
                  onClick={handleFacebookSignup}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Sign Up with Facebook</span>
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

export default RegisterPage;
