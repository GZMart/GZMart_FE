import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Button, Select, Input, DatePicker, Alert, message } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { orderSellerService } from '../../../services/api/orderSellerService';
import dayjs from 'dayjs';

const OrderStatusModal = ({ show, order, onHide, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState(order?.status || '');

  // Get available status transitions based on current status
  const getAvailableStatuses = () => {
    const current = order?.status || '';
    const statusTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['delivered_pending_confirmation', 'completed'],
      delivered_pending_confirmation: ['completed', 'refund_pending'],
      completed: [],
      cancelled: ['refund_pending'],
      refund_pending: ['refunded', 'under_investigation'],
      refunded: [],
      under_investigation: ['completed', 'refund_pending'],
    };
    return statusTransitions[current] || [];
  };

  const availableStatuses = getAvailableStatuses();

  const handleSubmit = async (values) => {
    if (!newStatus) {
      setError('Please select a status');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const statusData = {
        newStatus,
      };

      if (values.trackingNumber) statusData.trackingNumber = values.trackingNumber;
      if (values.estimatedDelivery) 
        statusData.estimatedDelivery = values.estimatedDelivery.toISOString();
      if (values.notes) statusData.notes = values.notes;
      if (values.reason) statusData.reason = values.reason;

      const response = await orderSellerService.updateStatus(order._id, statusData);

      if (response.success) {
        message.success('Order status updated successfully');
        onSuccess();
      } else {
        setError(response.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setNewStatus(order?.status || '');
    setError(null);
    onHide();
  };

  return (
    <Modal
      title={`Update Order Status - ${order?.orderNumber}`}
      open={show}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
          disabled={!newStatus || availableStatuses.length === 0}
          icon={<SaveOutlined />}
        >
          Update Status
        </Button>,
      ]}
      width={600}
    >
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '16px' }} />}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item>
          <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
            Current Status
          </label>
          <Input
            value={order?.status?.replace(/_/g, ' ').toUpperCase() || ''}
            disabled
          />
        </Form.Item>

        <Form.Item
          label="New Status *"
          required
        >
          <Select
            placeholder="Select new status"
            value={newStatus || undefined}
            onChange={setNewStatus}
            disabled={availableStatuses.length === 0}
            options={availableStatuses.map((status) => ({
              label: status.replace(/_/g, ' ').toUpperCase(),
              value: status,
            }))}
          />
          {availableStatuses.length === 0 && (
            <p style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
              This order cannot transition to other statuses
            </p>
          )}
        </Form.Item>

        {newStatus === 'shipped' && (
          <Form.Item
            label="Tracking Number"
            name="trackingNumber"
          >
            <Input placeholder="Enter tracking number" />
          </Form.Item>
        )}

        {(newStatus === 'shipped' || newStatus === 'processing') && (
          <Form.Item
            label="Estimated Delivery Date"
            name="estimatedDelivery"
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" />
          </Form.Item>
        )}

        <Form.Item
          label="Reason for Status Change"
          name="reason"
        >
          <Input.TextArea
            rows={3}
            placeholder="e.g., Handed over to shipper, Customer confirmed delivery..."
          />
        </Form.Item>

        <Form.Item
          label="Additional Notes"
          name="notes"
        >
          <Input.TextArea
            rows={3}
            placeholder="Any additional notes about this status update"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

OrderStatusModal.propTypes = {
  show: PropTypes.bool.isRequired,
  order: PropTypes.object.isRequired,
  onHide: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default OrderStatusModal;
