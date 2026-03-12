import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Button, Alert, Upload, message } from 'antd';
import { PictureOutlined, CloseOutlined } from '@ant-design/icons';
import rmaService from '@services/api/rmaService';
import { API_BASE_URL } from '@services/axiosClient';

const ReturnRequestModal = ({ show, order, onHide, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [requestType, setRequestType] = useState('refund');
  const [images, setImages] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Check eligibility when modal opens
  React.useEffect(() => {
    if (show && order?._id) {
      checkEligibility();
    } else {
      // Reset state when modal closes
      setEligibility(null);
      setError(null);
      form.resetFields();
      setImages([]);
    }
  }, [show, order]);

  const checkEligibility = async () => {
    setCheckingEligibility(true);
    setError(null);

    try {
      const response = await rmaService.checkEligibility(order._id);
      setEligibility(response.data);

      if (!response.data.isEligible) {
        setError(response.data.reason || 'Order is not eligible for return/exchange');
      }
    } catch (err) {
      console.error('[ReturnRequestModal] Error checking eligibility:', err);
      setError(err.response?.data?.message || 'Failed to check eligibility');
      setEligibility({ isEligible: false });
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleImageUpload = (info) => {
    console.log('🔵 [ReturnRequestModal] Upload status:', {
      status: info.file.status,
      fileName: info.file.name,
      response: info.file.response,
      error: info.file.error,
      timestamp: new Date().toISOString(),
    });

    // Track uploading state
    if (info.file.status === 'uploading') {
      setUploading(true);
    }

    if (info.file.status === 'done') {
      setUploading(false);

      // Backend returns { success, message, data: { url } }
      const url = info.file.response?.data?.url || info.file.response?.url;
      console.log('✅ [ReturnRequestModal] Upload done, extracting URL:', {
        fullResponse: info.file.response,
        extractedUrl: url,
      });

      if (url) {
        setImages((prev) => [...prev, url]);
        message.success(`Image uploaded successfully! (${images.length + 1}/5)`);
      } else {
        console.error('❌ [ReturnRequestModal] Upload response missing URL:', info.file.response);
        message.error('Upload succeeded but URL not found in response');
      }
    } else if (info.file.status === 'error') {
      setUploading(false);

      console.error('❌ [ReturnRequestModal] Upload error:', {
        error: info.file.error,
        response: info.file.response,
      });
      message.error(`Upload failed: ${info.file.error?.message || 'Unknown error'}`);
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values) => {
    if (images.length === 0) {
      message.error('Please upload at least 1 image as evidence');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData = {
        orderId: order._id,
        type: requestType,
        reason: values.reason,
        description: values.description,
        images: images,
        items: order.items.map((item) => ({
          orderItemId: item._id,
          quantity: item.quantity, // Return all items by default
        })),
      };

      console.log('🔵 [ReturnRequestModal] Submitting return/refund request:', {
        requestData,
        orderNumber: order.orderNumber,
        imageCount: images.length,
        timestamp: new Date().toISOString(),
      });

      const response = await rmaService.createReturnRequest(requestData);

      console.log(
        '✅ [ReturnRequestModal] Return/refund request submitted successfully:',
        response
      );
      message.success(
        requestType === 'refund'
          ? 'Refund request submitted successfully!'
          : 'Exchange request submitted successfully!'
      );

      if (onSuccess) {
        onSuccess(response.data);
      }

      onHide();
    } catch (err) {
      console.error('❌ [ReturnRequestModal] Error creating return request:', {
        error: err,
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        timestamp: new Date().toISOString(),
      });
      setError(err.response?.data?.message || 'Failed to create return request');
    } finally {
      setLoading(false);
    }
  };

  const returnReasons = [
    { value: 'defective', label: 'Product is defective or damaged' },
    { value: 'wrong_item', label: 'Wrong item received' },
    { value: 'not_as_described', label: 'Product not as described' },
    { value: 'wrong_size', label: 'Wrong size/color' },
    { value: 'damaged_in_shipping', label: 'Damaged during shipping' },
    { value: 'change_of_mind', label: 'Change of mind' },
    { value: 'other', label: 'Other reason' },
  ];

  return (
    <Modal title="Request Return/Refund" open={show} onCancel={onHide} footer={null} width={600}>
      {checkingEligibility ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Checking eligibility...</span>
          </div>
          <p className="mt-3">Checking eligibility...</p>
        </div>
      ) : !eligibility?.isEligible ? (
        <div>
          <Alert
            title="Not Eligible"
            description={error || 'This order is not eligible for return/exchange'}
            type="error"
            showIcon
            style={{ marginBottom: 20 }}
          />
          <Button type="default" onClick={onHide} block>
            Close
          </Button>
        </div>
      ) : (
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          {error && (
            <Alert
              title="Error"
              description={error}
              type="error"
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: 16 }}
            />
          )}

          <Alert
            title="Eligibility Confirmed"
            description={`You can request a return/exchange for this order. ${
              eligibility.daysSinceDelivery !== undefined
                ? `Delivered ${eligibility.daysSinceDelivery} day(s) ago. You have ${
                    7 - eligibility.daysSinceDelivery
                  } day(s) remaining.`
                : 'Request within the return period.'
            } ${
              requestType === 'refund'
                ? 'Refund will be credited to your GZMart wallet.'
                : 'A new order will be created for the exchange.'
            }`}
            type="success"
            showIcon
            style={{ marginBottom: 20 }}
          />

          {/* Request Type */}
          <Form.Item label="Request Type" required>
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn ${requestType === 'refund' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setRequestType('refund')}
              >
                Refund (Get money back)
              </button>
              <button
                type="button"
                className={`btn ${requestType === 'exchange' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setRequestType('exchange')}
              >
                Exchange (Replace item)
              </button>
            </div>
          </Form.Item>

          {/* Reason */}
          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, message: 'Please select a reason' }]}
          >
            <select className="form-control">
              <option value="">Select a reason...</option>
              {returnReasons.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </Form.Item>

          {/* Description */}
          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: 'Please provide a description' },
              { min: 10, message: 'Description must be at least 10 characters' },
            ]}
          >
            <textarea
              className="form-control"
              rows={4}
              placeholder="Please describe the issue in detail (minimum 10 characters)..."
            />
          </Form.Item>

          {/* Image Upload */}
          <Form.Item
            label="Evidence Photos"
            required
            help={`Upload up to 5 images as evidence. Supported formats: JPG, PNG, GIF (max 10MB each)`}
          >
            <Upload
              action={`${API_BASE_URL}/api/upload/single`}
              name="image"
              headers={{
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              }}
              onChange={handleImageUpload}
              showUploadList={false}
              accept="image/jpeg,image/png,image/gif,image/webp"
              maxCount={5}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('You can only upload image files!');
                  return Upload.LIST_IGNORE;
                }
                const isLt10M = file.size / 1024 / 1024 < 10;
                if (!isLt10M) {
                  message.error('Image must be smaller than 10MB!');
                  return Upload.LIST_IGNORE;
                }
                console.log('🔵 [Upload] Starting upload:', {
                  name: file.name,
                  size: `${(file.size / 1024).toFixed(2)} KB`,
                  type: file.type,
                  uploadUrl: `${API_BASE_URL}/api/upload/single`,
                });
                return true;
              }}
            >
              <Button
                icon={<PictureOutlined />}
                loading={uploading}
                disabled={images.length >= 5 || uploading}
                style={{ width: '100%' }}
              >
                {uploading
                  ? 'Uploading...'
                  : images.length === 0
                    ? 'Upload Image'
                    : `Upload More (${images.length}/5)`}
              </Button>
            </Upload>

            {images.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {images.map((url, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      width: 100,
                      height: 100,
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={url}
                      alt={`Evidence ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<CloseOutlined />}
                      size="small"
                      onClick={() => handleRemoveImage(index)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(0,0,0,0.5)',
                        color: 'white',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <small className="text-muted">At least 1 image required. Max 5 images.</small>
          </Form.Item>

          {/* Items Info */}
          <Alert
            title="Items to Return"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                {order?.items?.map((item) => (
                  <li key={item._id}>
                    {item.productId?.name} - Qty: {item.quantity} -{' '}
                    {item.price.toLocaleString('vi-VN')}₫
                  </li>
                ))}
              </ul>
            }
            type="info"
            style={{ marginBottom: 20 }}
          />

          {/* Submit Buttons */}
          <div className="d-flex gap-2">
            <Button type="default" onClick={onHide} block disabled={loading}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Submit {requestType === 'refund' ? 'Refund' : 'Exchange'} Request
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

ReturnRequestModal.propTypes = {
  show: PropTypes.bool.isRequired,
  order: PropTypes.object,
  onHide: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default ReturnRequestModal;
