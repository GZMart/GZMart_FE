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
import styles from '@assets/styles/ForgotPasswordPage/ForgotPasswordPage.module.css';
import { forgotPassword } from '@store/slices/authSlice';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email(t('forgot_password_page.validation.invalid_email'))
        .required(t('forgot_password_page.validation.required_email')),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await dispatch(forgotPassword(values.email)).unwrap();

        setSubmittedEmail(values.email);
        setSuccess(true);
        toast.success(t('forgot_password_page.success_title'));
      } catch (error) {
        if (error === 'User not found' || error?.message === 'User not found') {
          toast.error(t('reset_password_page.errors.user_not_found'));
        } else {
          toast.error(error || t('forgot_password_page.error_message'));
        }
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className={styles.loginContainer}>
      <Header />

      <div className={styles.contentWrapper}>
        {!success ? (
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
              <h1 className={styles.title}>{t('forgot_password_page.title')}</h1>
              <p className={styles.subtitle}>{t('forgot_password_page.subtitle')}</p>
            </div>

            <form onSubmit={formik.handleSubmit} className={styles.formWrapper}>
              <div className={styles.formGroup}>
                <input
                  type="email"
                  name="email"
                  className={`${styles.input} ${
                    formik.touched.email && formik.errors.email ? styles['is-invalid'] : ''
                  }`}
                  placeholder={t('forgot_password_page.email_placeholder')}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.email && formik.errors.email && (
                  <div className={styles.errorMessage}>{formik.errors.email}</div>
                )}
              </div>

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? (
                  t('forgot_password_page.submitting')
                ) : (
                  <>
                    {t('forgot_password_page.submit_button')}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div>
              <button className={styles.backLink} onClick={() => navigate(PUBLIC_ROUTES.LOGIN)}>
                {t('forgot_password_page.back_to_login')}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 className={styles.successTitle}>{t('forgot_password_page.success_title')}</h3>
            <p className={styles.successText}>
              {t('forgot_password_page.success_message', { email: submittedEmail })}
            </p>
            <button className={styles.submitButton} onClick={() => navigate(PUBLIC_ROUTES.LOGIN)}>
              {t('forgot_password_page.back_to_login')}
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
