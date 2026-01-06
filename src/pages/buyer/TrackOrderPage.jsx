import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Typography, Row, Col, Space, message } from 'antd';
import { LeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { isValidEmail, isEmpty } from '@utils/validators';
import '../../assets/styles/buyer/TrackOrderPage.css';

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
    <div className="track-order-page">
      <div className="track-order-container">
        {/* Header Section */}
        <div className="track-order-header">
          <div className="back-button-group">
            <Button 
              type="text" 
              icon={<LeftOutlined />}
              onClick={() => navigate(-1)}
              className="back-button"
            />
            <span className="back-text">Back</span>
          </div>
          <Title level={1} className="page-title">
            Track Order
          </Title>
        </div>

        {/* Content Card */}
        <Card className="track-order-card">
          {/* Description */}
          <div className="track-order-description">
            <Paragraph>
              To track your order please enter your order ID in the input field below and press the &ldquo;Track Order&rdquo; button. 
              this was given to you on your receipt and in the confirmation email you should have received.
            </Paragraph>
          </div>

          {/* Form Section */}
          <div className="track-order-form">
            <Row gutter={[24, 24]}>
              {/* Order ID Field */}
              <Col xs={24} md={12}>
                <div className="form-group">
                  <label className="form-label">Order ID</label>
                  <Input
                    name="orderId"
                    placeholder="ID..."
                    value={formData.orderId}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    status={errors.orderId ? 'error' : ''}
                    className="form-input"
                  />
                  {errors.orderId && (
                    <span className="error-message">{errors.orderId}</span>
                  )}
                </div>
              </Col>

              {/* Billing Email Field */}
              <Col xs={24} md={12}>
                <div className="form-group">
                  <label className="form-label">Billing Email</label>
                  <Input
                    name="billingEmail"
                    type="email"
                    placeholder="Email address"
                    value={formData.billingEmail}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    status={errors.billingEmail ? 'error' : ''}
                    className="form-input"
                  />
                  {errors.billingEmail && (
                    <span className="error-message">{errors.billingEmail}</span>
                  )}
                </div>
              </Col>
            </Row>

            {/* Info Message */}
            <div className="info-message">
              <div className="info-icon">ⓘ</div>
              <Text className="info-text">
                Order ID that we sended to your in your email address.
              </Text>
            </div>

            {/* Track Order Button */}
            <div className="button-group">
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={handleTrackOrder}
                className="track-button"
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
