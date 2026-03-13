import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Form, Alert, Image, Spin, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import rmaService from '@services/api/rmaService';

const { TextArea } = Form;

const ReturnDetailsModal = ({ visible, returnRequest, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!returnRequest) {
    return null;
  }

  const handleRespond = async (decision) => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError(null);

      const response = await rmaService.respondToReturnRequest(returnRequest._original._id, {
        decision,
        notes: values.notes || '',
      });

      message.success(`Return request ${decision}d successfully!`);

      if (onSuccess) {
        onSuccess(response.data);
      }

      form.resetFields();
      onClose();
    } catch (err) {
      console.error('[ReturnDetailsModal] Error responding:', err);
      if (err.errorFields) {
        // Form validation error
        return;
      }
      setError(err.response?.data?.message || `Failed to ${decision} return request`);
      message.error(`Failed to ${decision} return request`);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await rmaService.processRefund(returnRequest._original._id);

      message.success(
        `Refund processed successfully! ${response.data.coinsAdded} coins added to customer wallet.`
      );

      if (onSuccess) {
        onSuccess(response.data);
      }

      onClose();
    } catch (err) {
      console.error('[ReturnDetailsModal] Error processing refund:', err);
      setError(err.response?.data?.message || 'Failed to process refund');
      message.error('Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  const isPending = returnRequest.status === 'pending_review';
  const isApproved = returnRequest.status === 'approved';

  return (
    <Modal
      title="Return Request Details"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Spin spinning={loading}>
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Basic Info */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <strong>Return ID:</strong>
              <div>{returnRequest.id}</div>
            </div>
            <div>
              <strong>Order ID:</strong>
              <div>{returnRequest.orderId}</div>
            </div>
            <div>
              <strong>Customer:</strong>
              <div>{returnRequest.customer}</div>
            </div>
            <div>
              <strong>Date Requested:</strong>
              <div>{returnRequest.date}</div>
            </div>
            <div>
              <strong>Type:</strong>
              <div style={{ textTransform: 'capitalize' }}>
                {returnRequest._original?.type || 'N/A'}
              </div>
            </div>
            <div>
              <strong>Status:</strong>
              <div>
                <span
                  className={`badge bg-${
                    returnRequest.status === 'pending_review'
                      ? 'warning'
                      : returnRequest.status === 'approved'
                        ? 'success'
                        : returnRequest.status === 'rejected'
                          ? 'danger'
                          : 'info'
                  }`}
                >
                  {returnRequest.status?.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div style={{ marginBottom: 16 }}>
          <strong>Reason:</strong>
          <div style={{ marginTop: 4, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            {returnRequest.reason}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <strong>Description:</strong>
          <div style={{ marginTop: 4, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            {returnRequest._original?.description || 'No description provided'}
          </div>
        </div>

        {/* Evidence Images */}
        {returnRequest._original?.images?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <strong>Evidence Photos:</strong>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <Image.PreviewGroup>
                {returnRequest._original.images.map((url, index) => (
                  <Image
                    key={index}
                    src={url}
                    alt={`Evidence ${index + 1}`}
                    width={100}
                    height={100}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                  />
                ))}
              </Image.PreviewGroup>
            </div>
          </div>
        )}

        {/* Items */}
        <div style={{ marginBottom: 24 }}>
          <strong>Items to Return:</strong>
          <table className="table table-sm mt-2">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Quantity</th>
                <th style={{ textAlign: 'right' }}>Refund Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{returnRequest.product}</td>
                <td>{returnRequest.category}</td>
                <td>{returnRequest._original?.items?.length || 1}</td>
                <td style={{ textAlign: 'right' }}>
                  {returnRequest.price.toLocaleString('vi-VN')}₫
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Response Form (only for pending requests) */}
        {isPending && (
          <Form form={form} layout="vertical">
            <Form.Item
              label="Response Notes (Optional)"
              name="notes"
              rules={[{ max: 500, message: 'Notes cannot exceed 500 characters' }]}
            >
              <TextArea rows={3} placeholder="Add any notes for the customer..." maxLength={500} />
            </Form.Item>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleRespond('approve')}
                loading={loading}
                block
              >
                Approve Request
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleRespond('reject')}
                loading={loading}
                block
              >
                Reject Request
              </Button>
            </div>
          </Form>
        )}

        {/* Process Refund (only for approved requests) */}
        {isApproved && returnRequest._original?.type === 'refund' && (
          <div style={{ marginTop: 16 }}>
            <Alert
              message="Ready to Process Refund"
              description="This request has been approved. Click below to add coins to the customer's wallet."
              type="info"
              style={{ marginBottom: 12 }}
            />
            <Button type="primary" onClick={handleProcessRefund} loading={loading} block>
              Process Refund ({returnRequest.price.toLocaleString('vi-VN')}₫)
            </Button>
          </div>
        )}

        {/* Close Button */}
        {!isPending && !isApproved && (
          <Button type="default" onClick={onClose} block>
            Close
          </Button>
        )}
      </Spin>
    </Modal>
  );
};

ReturnDetailsModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  returnRequest: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default ReturnDetailsModal;
