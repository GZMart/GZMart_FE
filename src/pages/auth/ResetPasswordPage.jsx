import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { PUBLIC_ROUTES } from '@constants/routes';
import Header from '@components/common/Header';
import Footer from '@components/common/Footer';
import styles from '@assets/styles/common/ResetPasswordPage/ResetPasswordPage.module.css';
import { resetPassword } from '@store/slices/authSlice';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error(t('reset_password_page.errors.missing_token'));
      navigate(PUBLIC_ROUTES.LOGIN);
    }
  }, [token, navigate, t]);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .required(t('reset_password_page.validation.required_password'))
        .min(8, 'Password must be at least 8 characters!')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter!')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter!')
        .matches(/[0-9]/, 'Password must contain at least one number!')
        .matches(/[@$!%*?&#]/, 'Password must contain at least one special character (@$!%*?&#)!'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], t('reset_password_page.validation.password_match'))
        .required(t('reset_password_page.validation.required_confirm_password')),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await dispatch(
          resetPassword({
            token,
            newPassword: values.password,
          })
        ).unwrap();

        toast.success(t('reset_password_page.success_message'));
        navigate(PUBLIC_ROUTES.LOGIN);
      } catch (error) {
        toast.error(error || t('reset_password_page.errors.default'));
      } finally {
        setLoading(false);
      }
    },
  });

  if (!token) {
    return null;
  }

  return (
    <div className={styles.loginContainer}>
      <Header />

      <div className={styles.contentWrapper}>
        <div
          style={{
            width: '100%',
            maxWidth: '500px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            textAlign: 'center',
          }}
        >
          <div>
            <h1 className={styles.title}>{t('reset_password_page.title')}</h1>
            <p className={styles.subtitle}>{t('reset_password_page.subtitle')}</p>
          </div>

          <form onSubmit={formik.handleSubmit} className={styles.formWrapper}>
            {/* Password */}
            <div className={styles.formGroup}>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`${styles.input} ${
                    formik.touched.password && formik.errors.password ? styles['is-invalid'] : ''
                  }`}
                  placeholder={t('reset_password_page.password_placeholder')}
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
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <div className={styles.errorMessage}>{formik.errors.password}</div>
              )}
            </div>

            {/* Confirm Password */}
            <div className={styles.formGroup}>
              <div className={styles.passwordWrapper}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className={`${styles.input} ${
                    formik.touched.confirmPassword && formik.errors.confirmPassword
                      ? styles['is-invalid']
                      : ''
                  }`}
                  placeholder={t('reset_password_page.confirm_password_placeholder')}
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <div className={styles.errorMessage}>{formik.errors.confirmPassword}</div>
              )}
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading
                ? t('reset_password_page.submitting')
                : t('reset_password_page.submit_button')}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
