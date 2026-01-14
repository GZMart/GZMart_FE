import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Card, Button, Tag, Alert, Table, Spin, Divider, Space, Statistic, Modal } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import OrderStatusModal from '../../components/seller/orders/OrderStatusModal';
import OrderStatusTimeline from '../../components/seller/orders/OrderStatusTimeline';
import { orderSellerService } from '../../services/api/orderSellerService';
import { formatCurrency } from '../../utils/formatters';

const OrderDetailsPage = () => {
  const { id: orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch order details
  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [orderResponse, historyResponse] = await Promise.all([
        orderSellerService.getById(orderId),
        orderSellerService.getHistory(orderId),
      ]);

      if (orderResponse.success) {
        setOrder(orderResponse.data);
      } else {
        setError('Failed to load order details');
      }

      if (historyResponse.success) {
        setHistory(historyResponse.data?.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusModalClose = () => {
    setShowStatusModal(false);
  };

  const handleStatusUpdateSuccess = () => {
    handleStatusModalClose();
    fetchOrderDetails();
  };

  const handleCancelOrder = async () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        setActionLoading(true);
        const response = await orderSellerService.cancel(orderId, {
          cancellationReason: 'Cancelled by seller',
        });

        if (response.success) {
          alert('Order cancelled successfully');
          fetchOrderDetails();
        } else {
          alert('Failed to cancel order');
        }
      } catch (err) {
        console.error('Error cancelling order:', err);
        alert('Error cancelling order');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handlePrintDeliveryNote = async () => {
    try {
      setActionLoading(true);
      const response = await orderSellerService.getDeliveryNote(orderId);

      if (response.success) {
        // Create a new window with the HTML content
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write(response.html || response.data?.html);
        printWindow.document.close();
        printWindow.print();
      } else {
        alert('Failed to generate delivery note');
      }
    } catch (err) {
      console.error('Error generating delivery note:', err);
      alert('Error generating delivery note');
    } finally {
      setActionLoading(false);
    }
  };

  // Get status badge color
  const getStatusTagColor = (status) => {
    const colors = {
      pending: 'gold',
      processing: 'blue',
      shipped: 'cyan',
      delivered: 'green',
      delivered_pending_confirmation: 'blue',
      completed: 'green',
      cancelled: 'red',
      refunded: 'orange',
      refund_pending: 'orange',
      under_investigation: 'red',
    };
    return colors[status] || 'default';
  };

  // Get payment status badge color
  const getPaymentStatusTagColor = (status) => {
    const colors = {
      pending: 'gold',
      completed: 'green',
      failed: 'red',
      refunding: 'blue',
      refunded: 'green',
    };
    return colors[status] || 'default';
  };

  // Prepare items table data
  const itemsTableData = order?.items?.map((item, idx) => ({
    key: idx,
    productName: item.productId?.name || 'Unknown Product',
    sku: item.sku || 'N/A',
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal,
    tierSelections: item.tierSelections,
  })) || [];

  const itemsColumns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      render: (text, record) => (
        <div>
          <p style={{ marginBottom: 4 }}>{text}</p>
          {record.tierSelections && (
            <p style={{ marginBottom: 0, color: '#999', fontSize: '12px' }}>
              {Object.entries(record.tierSelections)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </p>
          )}
        </div>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 100,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price) => formatCurrency(price),
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      render: (subtotal) => <strong>{formatCurrency(subtotal)}</strong>,
    },
  ];

  // Show loading state
  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <PageHeader title="Order Details" showButton={false} />
        <Card style={{ marginTop: '24px' }}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spin size="large" />
          </div>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error || !order) {
    return (
      <div style={{ padding: '24px' }}>
        <PageHeader title="Order Details" showButton={false} />
        <Card style={{ marginTop: '24px' }}>
          <Alert
            message="Error Loading Order"
            description={error || 'Order not found'}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={() => (window.location.href = '/seller/orders')}
          >
            Back to Orders
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space style={{ marginBottom: '24px' }} direction="vertical" style={{ width: '100%' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => (window.location.href = '/seller/orders')}
        >
          Back to Orders
        </Button>
        <PageHeader
          title={`Order #${order.orderNumber}`}
          subtitle={`Created on ${new Date(order.createdAt).toLocaleDateString('vi-VN')}`}
          showButton={false}
        />
      </Space>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {/* Order Summary */}
          <Card
            title="Order Summary"
            extra={
              <Space>
                <Tag color={getStatusTagColor(order.status)}>
                  {order.status.replace(/_/g, ' ').toUpperCase()}
                </Tag>
                <Tag color={getPaymentStatusTagColor(order.paymentStatus)}>
                  {order.paymentStatus?.toUpperCase() || 'PENDING'}
                </Tag>
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12}>
                <div>
                  <p style={{ color: '#999', marginBottom: '4px' }}>Customer</p>
                  <h5 style={{ marginBottom: '4px' }}>{order.userId?.name || 'Unknown'}</h5>
                  <p style={{ color: '#999' }}>{order.userId?.email || 'N/A'}</p>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <p style={{ color: '#999', marginBottom: '4px' }}>Order Date</p>
                  <h5 style={{ marginBottom: '4px' }}>
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </h5>
                  <p style={{ color: '#999' }}>
                    {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                  </p>
                </div>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12}>
                <div>
                  <p style={{ color: '#999', marginBottom: '4px' }}>Shipping Address</p>
                  <h5>{order.shippingAddress}</h5>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <p style={{ color: '#999', marginBottom: '4px' }}>Shipping Method</p>
                  <h5>{order.shippingMethod?.toUpperCase()}</h5>
                </div>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12}>
                <div>
                  <p style={{ color: '#999', marginBottom: '4px' }}>Payment Method</p>
                  <h5>{order.paymentMethod?.toUpperCase().replace(/_/g, ' ')}</h5>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <p style={{ color: '#999', marginBottom: '4px' }}>Notes</p>
                  <h5>{order.notes || 'No notes'}</h5>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Order Items */}
          <Card title={`Order Items (${order.items?.length || 0})`} style={{ marginBottom: '24px' }}>
            <Table
              columns={itemsColumns}
              dataSource={itemsTableData}
              pagination={false}
              scroll={{ x: 500 }}
              bordered
            />
          </Card>

          {/* Status Timeline */}
          {history.length > 0 && (
            <Card title="Status History">
              <OrderStatusTimeline history={history} />
            </Card>
          )}
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          {/* Order Total Card */}
          <Card title="Order Total" style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Subtotal:</span>
                <strong>{formatCurrency(order.subtotal)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Shipping:</span>
                <strong>{formatCurrency(order.shippingCost)}</strong>
              </div>
              {order.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Tax:</span>
                  <strong>{formatCurrency(order.tax)}</strong>
                </div>
              )}
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Discount:</span>
                  <strong style={{ color: '#ff4d4f' }}>-{formatCurrency(order.discount)}</strong>
                </div>
              )}
            </div>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px' }}>Total:</span>
              <h3 style={{ color: '#1890ff', marginBottom: 0 }}>{formatCurrency(order.totalPrice)}</h3>
            </div>
          </Card>

          {/* Actions Card */}
          <Card title="Actions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                block
                icon={<EditOutlined />}
                onClick={() => setShowStatusModal(true)}
                disabled={order.status === 'completed' || order.status === 'cancelled'}
              >
                Update Status
              </Button>
              <Button
                type="default"
                block
                icon={<PrinterOutlined />}
                onClick={handlePrintDeliveryNote}
                loading={actionLoading}
              >
                Print Delivery Note
              </Button>
              <Button
                type="primary"
                danger
                block
                icon={<DeleteOutlined />}
                onClick={handleCancelOrder}
                disabled={
                  order.status === 'completed' ||
                  order.status === 'cancelled' ||
                  actionLoading
                }
              >
                Cancel Order
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Status Update Modal */}
      {order && (
        <OrderStatusModal
          show={showStatusModal}
          order={order}
          onHide={handleStatusModalClose}
          onSuccess={handleStatusUpdateSuccess}
        />
      )}
    </div>
  );
};

export default OrderDetailsPage;
