import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table, Spin, Empty, Pagination, Statistic, Row, Col, Card, Button, Space, Tag, message } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import PageFilters from '../../components/common/PageFilters';
import OrderStatusModal from '../../components/seller/orders/OrderStatusModal';
import { orderSellerService } from '../../services/api/orderSellerService';
import { formatCurrency } from '../../utils/formatters';

const OrdersPage = () => {
  const [searchParams] = useSearchParams();

  // State management
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    paymentMethod: 'all',
    shippingMethod: 'all',
    sortBy: 'newest-first',
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const itemsPerPage = 10;

  // Order status options with labels
  const orderStatuses = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'delivered_pending_confirmation', label: 'Pending Confirmation' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'refund_pending', label: 'Refund Pending' },
    { value: 'under_investigation', label: 'Under Investigation' },
  ];

  // Fetch orders
  useEffect(() => {
    fetchOrders(currentPage);
  }, [filters, currentPage]);

  const fetchOrders = async (page) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: itemsPerPage,
        sortBy: filters.sortBy,
      };

      // Add status filter if not 'all'
      if (filters.status !== 'all') {
        params.status = filters.status;
      }

      // Add payment method filter if not 'all'
      if (filters.paymentMethod !== 'all') {
        params.paymentMethod = filters.paymentMethod;
      }

      // Add shipping method filter if not 'all'
      if (filters.shippingMethod !== 'all') {
        params.shippingMethod = filters.shippingMethod;
      }

      const response = await orderSellerService.getAll(params);

      if (response.success) {
        setOrders(response.data || []);
        setTotalPages(response.pages || 1);
      } else {
        setError('Failed to load orders');
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setCurrentPage(1); // Reset to first page
  };

  const handleViewDetails = (order) => {
    // Navigate to order details page
    window.location.href = `/seller/orders/${order._id}`;
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleStatusModalClose = () => {
    setShowStatusModal(false);
    setSelectedOrder(null);
  };

  const handleStatusUpdateSuccess = () => {
    handleStatusModalClose();
    fetchOrders(currentPage); // Refresh orders
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        const response = await orderSellerService.cancel(orderId, {
          cancellationReason: 'Cancelled by seller',
        });

        if (response.success) {
          alert('Order cancelled successfully');
          fetchOrders(currentPage);
        } else {
          alert('Failed to cancel order');
        }
      } catch (err) {
        console.error('Error cancelling order:', err);
        alert('Error cancelling order');
      }
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Get status color for Ant Design Tag
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

  // Format order data for table
  const tableData = orders.map((order) => ({
    key: order._id,
    _id: order._id,
    orderNumber: order.orderNumber,
    buyer: order.userId?.name || 'Unknown',
    buyerEmail: order.userId?.email || '',
    totalItems: order.items?.length || 0,
    totalPrice: order.totalPrice,
    status: order.status,
    paymentMethod: order.paymentMethod,
    shippingMethod: order.shippingMethod,
    shippingAddress: order.shippingAddress,
    createdAt: new Date(order.createdAt).toLocaleDateString('vi-VN'),
    paymentStatus: order.paymentStatus,
    _originalData: order,
  }));

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Customer',
      key: 'buyer',
      width: 140,
      render: (_, record) => (
        <div>
          <p style={{ marginBottom: 4, fontSize: '13px' }}>{record.buyer}</p>
          <p style={{ marginBottom: 0, color: '#999', fontSize: '11px' }}>{record.buyerEmail}</p>
        </div>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'totalItems',
      key: 'totalItems',
      width: 60,
      align: 'center',
    },
    {
      title: 'Total',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 100,
      render: (price) => <strong style={{ color: '#1890ff', fontSize: '13px' }}>{formatCurrency(price)}</strong>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => <Tag color={getStatusTagColor(status)} style={{ fontSize: '11px' }}>{status.replace(/_/g, ' ').toUpperCase()}</Tag>,
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 90,
      render: (status) => <Tag color={getPaymentStatusTagColor(status)} style={{ fontSize: '11px' }}>{status?.toUpperCase() || 'PENDING'}</Tag>,
    },
    {
      title: 'Shipping',
      dataIndex: 'shippingMethod',
      key: 'shippingMethod',
      width: 85,
      render: (method) => <span style={{ fontSize: '13px' }}>{method?.toUpperCase()}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 90,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record._originalData)}
            title="View Details"
          />
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleUpdateStatus(record._originalData)}
            disabled={record.status === 'completed' || record.status === 'cancelled'}
            title="Update Status"
          />
          <Button
            type="primary"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleCancelOrder(record._id)}
            disabled={
              record.status === 'completed' ||
              record.status === 'cancelled' ||
              record.status === 'shipped' ||
              record.status === 'delivered'
            }
            title="Cancel Order"
          />
        </Space>
      ),
    },
  ];

  // Show loading state
  if (loading && orders.length === 0) {
    return (
      <div style={{ padding: '24px' }}>
        <PageHeader
          title="Orders"
          subtitle="Manage your customer orders"
          showButton={false}
        />
        <Card style={{ marginTop: '24px' }}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spin size="large" />
          </div>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <PageHeader
          title="Orders"
          subtitle="Manage your customer orders"
          showButton={false}
        />
        <Card style={{ marginTop: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#ff4d4f', fontSize: '16px', marginBottom: '8px' }}>
              ⚠️ Error Loading Orders
            </p>
            <p>{error}</p>
          </div>
          <Button type="primary" onClick={() => fetchOrders(currentPage)} icon={<ReloadOutlined />}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '0px' }}>
      <div style={{ padding: '12px 16px 0 16px' }}>
        <PageHeader
          title="Orders"
          subtitle="Manage your customer orders"
          showButton={false}
        />
      </div>

      {/* Filters */}
      <Card style={{ margin: '8px 16px', borderRadius: '4px' }}>
        <PageFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          filterConfigs={[
            {
              name: 'status',
              label: 'Status',
              options: orderStatuses,
            },
            {
              name: 'paymentMethod',
              label: 'Payment Method',
              options: [
                { value: 'all', label: 'All Methods' },
                { value: 'vnpay', label: 'VNPay' },
                { value: 'cash_on_delivery', label: 'Cash on Delivery' },
                { value: 'payos', label: 'PayOS' },
              ],
            },
            {
              name: 'shippingMethod',
              label: 'Shipping Method',
              options: [
                { value: 'all', label: 'All Methods' },
                { value: 'standard', label: 'Standard' },
                { value: 'express', label: 'Express' },
                { value: 'next_day', label: 'Next Day' },
                { value: 'store', label: 'In Store' },
              ],
            },
            {
              name: 'sortBy',
              label: 'Sort By',
              options: [
                { value: 'newest-first', label: 'Newest First' },
                { value: 'oldest-first', label: 'Oldest First' },
                { value: 'total-high', label: 'Total: High to Low' },
                { value: 'total-low', label: 'Total: Low to High' },
              ],
            },
          ]}
        />
      </Card>

      {/* Orders Table */}
      <Card style={{ margin: '8px 16px', borderRadius: '4px' }}>
        <Spin spinning={loading}>
          {tableData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Empty description="No orders found" />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={{
                current: currentPage,
                pageSize: itemsPerPage,
                total: totalPages * itemsPerPage,
                onChange: handlePageChange,
                showSizeChanger: false,
                size: 'small',
              }}
              scroll={{ x: 'max-content' }}
              rowHoverable
              size="small"
            />
          )}
        </Spin>
      </Card>

      {selectedOrder && (
        <OrderStatusModal
          show={showStatusModal}
          order={selectedOrder}
          onHide={handleStatusModalClose}
          onSuccess={handleStatusUpdateSuccess}
        />
      )}
    </div>
  );
};

export default OrdersPage;
