import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Container } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';
import styles from '@assets/styles/LoginPage/LoginPage.module.css';
import Header from '@components/common/Header';
import Footer from '@components/common/Footer';
import { loginUser } from '@store/slices/authSlice';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hiển thị thông báo từ location state (nếu có)
  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message);
      // Clear state để không hiển thị lại khi refresh
      window.history.replaceState({}, document.title);
    }
    if (location.state?.email) {
      setFormData((prev) => ({ ...prev, email: location.state.email }));
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await dispatch(
        loginUser({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        })
      ).unwrap();

      // Login thành công
      toast.success('Đăng nhập thành công!');

      // Redirect dựa trên role
      const user = result.user;
      if (user?.role === 'seller') {
        navigate('/seller/dashboard');
      } else if (user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate(PUBLIC_ROUTES.HOME);
      }
    } catch (error) {
      // Hiển thị lỗi
      toast.error(error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      // TODO: Implement Google OAuth - cần lấy thông tin từ Google OAuth
      // Tạm thời chỉ log
      console.log('Login with Google');
      toast.info('Tính năng đăng nhập bằng Google đang được phát triển');
      setLoading(false);
    } catch (error) {
      toast.error('Đăng nhập Google thất bại');
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      // TODO: Implement Facebook OAuth - cần lấy thông tin từ Facebook OAuth
      // Tạm thời chỉ log
      console.log('Login with Facebook');
      toast.info('Tính năng đăng nhập bằng Facebook đang được phát triển');
      setLoading(false);
    } catch (error) {
      toast.error('Đăng nhập Facebook thất bại');
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <Header />

      {/* Main Login Content */}
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
                <h1 className={styles.title}>Welcome Back</h1>
                <p className={styles.subtitle}>Login to your account</p>
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
                <span className={styles.signupText}>First time here?</span>
                <Link to={PUBLIC_ROUTES.REGISTER} className={styles.signupLink}>
                  Signup
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className={styles.rightSection}>
            <div className={styles.formWrapper}>
              <form onSubmit={handleSubmit} className={styles.loginForm}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Password</label>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={styles.input}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
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
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    />
                    <span style={{ marginLeft: '7px' }}>Remember me</span>
                  </label>
                </div>

                <button type="submit" className={styles.loginButton} disabled={loading}>
                  {loading ? 'Đang đăng nhập...' : 'Login'}
                </button>

                <div className={styles.divider}>
                  <span>Or</span>
                </div>

                <button type="button" className={styles.socialButton} onClick={handleGoogleLogin}>
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
                  <span>Login with Google</span>
                </button>

                <button
                  type="button"
                  className={styles.socialButtonFacebook}
                  onClick={handleFacebookLogin}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Login with Facebook</span>
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

export default LoginPage;
