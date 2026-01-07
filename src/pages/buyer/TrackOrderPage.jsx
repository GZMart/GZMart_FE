import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Typography, Row, Col, Space, message } from 'antd';
import { LeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { isValidEmail, isEmpty } from '@utils/validators';
import styles from '@assets/styles/buyer/TrackOrderPage.module.css';

const TrackOrderPage = () => {
  const navigate = useNavigate();
  const { Title, Paragraph, Text } = Typography;

  const [formData, setFormData] = useState({
    orderId: '',
    billingEmail: '',
  });

  const [errors, setErrors] = useState({
    orderId: null,
    billingEmail: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateField = (name, value) => {
    let error = null;

    if (name === 'orderId') {
      if (isEmpty(value)) {
        error = 'Order ID is required';
      }
    }

    if (name === 'billingEmail') {
      if (isEmpty(value)) {
        error = 'Email is required';
      } else if (!isValidEmail(value)) {
        error = 'Please enter a valid email address';
      }
    }

    return error;
  };

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleTrackOrder = () => {
    // Validate both fields
    const orderIdError = validateField('orderId', formData.orderId);
    const emailError = validateField('billingEmail', formData.billingEmail);

    setErrors({
      orderId: orderIdError,
      billingEmail: emailError,
    });

    if (!orderIdError && !emailError) {
      // Navigate to order details page with orderId
      navigate(`/track-order-details/${formData.orderId}`, {
        state: { email: formData.billingEmail }
      });
    }
  };

  return (
    <div className={styles.trackOrderPage}>
      <div className={styles.trackOrderContainer}>
        {/* Header Section */}
        <div className={styles.trackOrderHeader}>
          <div className={styles.backButtonGroup}>
            <Button 
              type="text" 
              icon={<LeftOutlined />}
              onClick={() => navigate(-1)}
              className={styles.backButton}
            />
            <span className={styles.backText}>Back</span>
          </div>
          <Title level={1} className={styles.pageTitle}>
            Track Order
          </Title>
        </div>

        {/* Content Card */}
        <Card className={styles.trackOrderCard}>
          {/* Description */}
          <div className={styles.trackOrderDescription}>
            <Paragraph>
              To track your order please enter your order ID in the input field below and press the &ldquo;Track Order&rdquo; button. 
              this was given to you on your receipt and in the confirmation email you should have received.
            </Paragraph>
          </div>

          {/* Form Section */}
          <div className={styles.trackOrderForm}>
            <Row gutter={[24, 24]}>
              {/* Order ID Field */}
              <Col xs={24} md={12}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Order ID</label>
                  <Input
                    name="orderId"
                    placeholder="ID..."
                    value={formData.orderId}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    status={errors.orderId ? 'error' : ''}
                    className={styles.formInput}
                  />
                  {errors.orderId && (
                    <span className={styles.errorMessage}>{errors.orderId}</span>
                  )}
                </div>
              </Col>

              {/* Billing Email Field */}
              <Col xs={24} md={12}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Billing Email</label>
                  <Input
                    name="billingEmail"
                    type="email"
                    placeholder="Email address"
                    value={formData.billingEmail}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    status={errors.billingEmail ? 'error' : ''}
                    className={styles.formInput}
                  />
                  {errors.billingEmail && (
                    <span className={styles.errorMessage}>{errors.billingEmail}</span>
                  )}
                </div>
              </Col>
            </Row>

            {/* Info Message */}
            <div className={styles.infoMessage}>
              <div className={styles.infoIcon}>ⓘ</div>
              <Text className={styles.infoText}>
                Order ID that we sended to your in your email address.
              </Text>
            </div>

            {/* Track Order Button */}
            <div className={styles.buttonGroup}>
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={handleTrackOrder}
                className={styles.trackButton}
              >
                TRACK ORDER
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TrackOrderPage;
