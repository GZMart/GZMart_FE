import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { PUBLIC_ROUTES } from '@constants/routes';
import Header from '@components/common/Header';
import Footer from '@components/common/Footer';
import styles from '@assets/styles/ChangePasswordPage/ChangePasswordPage.module.css';
import { changeUserPassword } from '@store/slices/authSlice';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required(
        t('change_password_page.validation.required_current_password')
      ),
      password: Yup.string()
        .required(t('change_password_page.validation.required_password'))
        .min(8, t('change_password_page.validation.min_password'))
        .matches(/[A-Z]/, t('change_password_page.validation.uppercase'))
        .matches(/[a-z]/, t('change_password_page.validation.lowercase'))
        .matches(/[0-9]/, t('change_password_page.validation.number'))
        .matches(/[@$!%*?&#]/, t('change_password_page.validation.special_char')),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], t('change_password_page.validation.password_match'))
        .required(t('change_password_page.validation.required_confirm_password')),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const resultAction = await dispatch(
          changeUserPassword({
            currentPassword: values.currentPassword,
            newPassword: values.password,
          })
        );

        if (changeUserPassword.fulfilled.match(resultAction)) {
          toast.success(t('change_password_page.success_message'));
          // Navigate to home
          navigate('/');
        } else {
          const errorMessage = resultAction.payload;
          if (errorMessage === 'Current password is incorrect') {
            toast.error(t('change_password_page.errors.incorrect_current_password'));
          } else {
            toast.error(errorMessage || t('change_password_page.errors.default'));
          }
        }
      } catch (error) {
        toast.error(t('change_password_page.errors.general'));
      } finally {
        setLoading(false);
      }
    },
  });

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
            <h1 className={styles.title}>{t('change_password_page.title')}</h1>
            <p className={styles.subtitle}>{t('change_password_page.subtitle')}</p>
          </div>

          <form onSubmit={formik.handleSubmit} className={styles.formWrapper}>
            {/* Current Password */}
            <div className={styles.formGroup}>
              <div className={styles.passwordWrapper}>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  className={`${styles.input} ${
                    formik.touched.currentPassword && formik.errors.currentPassword
                      ? styles['is-invalid']
                      : ''
                  }`}
                  placeholder={t('change_password_page.current_password_placeholder')}
                  value={formik.values.currentPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
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
              {formik.touched.currentPassword && formik.errors.currentPassword && (
                <div className={styles.errorMessage}>{formik.errors.currentPassword}</div>
              )}
            </div>

            {/* Password */}
            <div className={styles.formGroup}>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`${styles.input} ${
                    formik.touched.password && formik.errors.password ? styles['is-invalid'] : ''
                  }`}
                  placeholder={t('change_password_page.new_password_placeholder')}
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
                  placeholder={t('change_password_page.confirm_password_placeholder')}
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
                ? t('change_password_page.submitting')
                : t('change_password_page.submit_button')}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ChangePasswordPage;
