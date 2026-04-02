import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Drawer, Form, Button, Select, Input, DatePicker, Alert, Space } from 'antd';
import { toast } from 'react-toastify';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { orderSellerService } from '../../../services/api/orderSellerService';

const OrderStatusModal = ({ show, order, onHide, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState(order?.status || '');

  useEffect(() => {
    setNewStatus(order?.status || '');
  }, [order?.status, show]);

  const formatStatusLabel = (status) => {
    const normalizeLegacyStatus = (s) => {
      const n = String(s || '')
        .trim()
        .toLowerCase();
      if (!n) {
return n;
}
      if (n === 'processing') {
return 'confirmed';
}
      if (n === 'packing') {
return 'packed';
}
      if (n === 'shipping') {
return 'shipped';
}
      if (n === 'delivered_pending_confirmation') {
return 'delivered';
}
      return n;
    };

    const normalized = normalizeLegacyStatus(status);
    if (!normalized) {
return 'Unknown';
}
    if (normalized === 'shipped') {
return 'Shipping';
}
    return normalized.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Get available status transitions based on current status
  const getAvailableStatuses = () => {
    const current = order?.status || '';
    const statusTransitions = {
      // Canonical: pending -> confirmed -> packed -> shipped -> delivered -> completed
      pending: ['confirmed', 'cancelled'],
      confirmed: ['packed', 'cancelled'],
      packed: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['completed'],
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

      if (values.trackingNumber) {
        statusData.trackingNumber = values.trackingNumber;
      }
      if (values.estimatedDelivery) {
        statusData.estimatedDelivery = values.estimatedDelivery.toISOString();
      }
      if (values.notes) {
        statusData.notes = values.notes;
      }
      if (values.reason) {
        statusData.reason = values.reason;
      }

      const isShippingStatus = newStatus === 'shipped';
      const canUseShippingTimer = ['confirmed', 'packed'].includes(order?.status);
      const shouldUseShippingTimer = isShippingStatus && canUseShippingTimer;
      const response = shouldUseShippingTimer
        ? await orderSellerService.startShipping(order._id)
        : await orderSellerService.updateStatus(order._id, statusData);

      if (response.success) {
        toast.success(
          shouldUseShippingTimer
            ? 'Shipping started successfully. Delivery timer is now running.'
            : 'Order status updated successfully'
        );
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
    <Drawer
      title={`Update Order Status - ${order?.orderNumber || ''}`}
      open={show}
      onClose={handleCancel}
      placement="right"
      width={560}
      destroyOnClose
      extra={
        <Button icon={<CloseOutlined />} onClick={handleCancel}>
          Close
        </Button>
      }
    >
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '16px' }} />}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item>
          <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
            Current Status
          </label>
          <Input value={formatStatusLabel(order?.status)} disabled />
        </Form.Item>

        <Form.Item label="New Status *" required>
          <Select
            placeholder="Select new status"
            value={newStatus || undefined}
            onChange={setNewStatus}
            disabled={availableStatuses.length === 0}
            options={availableStatuses.map((status) => ({
              label: formatStatusLabel(status),
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
          <Form.Item label="Tracking Number" name="trackingNumber">
            <Input placeholder="Enter tracking number" />
          </Form.Item>
        )}

        {newStatus === 'shipped' && (
          <Form.Item label="Estimated Delivery Date" name="estimatedDelivery">
            <DatePicker showTime format="DD/MM/YYYY HH:mm" />
          </Form.Item>
        )}

        <Form.Item label="Reason for Status Change" name="reason">
          <Input.TextArea
            rows={3}
            placeholder="e.g., Handed over to shipper, Customer confirmed delivery..."
          />
        </Form.Item>

        <Form.Item label="Additional Notes" name="notes">
          <Input.TextArea rows={3} placeholder="Any additional notes about this status update" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid #f0f0f0',
              paddingTop: 16,
              marginTop: 8,
            }}
          >
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button
                type="primary"
                loading={loading}
                onClick={() => form.submit()}
                disabled={!newStatus || availableStatuses.length === 0}
                icon={<SaveOutlined />}
              >
                Update Status
              </Button>
            </Space>
          </div>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

OrderStatusModal.propTypes = {
  show: PropTypes.bool.isRequired,
  order: PropTypes.object.isRequired,
  onHide: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default OrderStatusModal;
