import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Popconfirm,
  Tag,
  Statistic,
  Row,
  Col,
  message,
  Empty,
  Spin,
  Select,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EllipsisOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import flashsaleService from '../../services/api/flashsaleService';
import styles from '../../assets/styles/seller/FlashSales.module.css';

const FlashSalesPage = () => {
  const [loading, setLoading] = useState(false);
  const [flashSales, setFlashSales] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedFlashSale, setSelectedFlashSale] = useState(null);
  const [form] = Form.useForm();
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Fetch flash sales
  const fetchFlashSales = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await flashsaleService.getAll({ page, limit });
      setFlashSales(response.data || []);
      setPagination({
        page: response.page || page,
        limit: response.limit || limit,
        total: response.total || 0,
      });
    } catch (error) {
      message.error('Lỗi khi lấy danh sách flash sale');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats for selected flash sale
  const fetchStats = async (flashSaleId) => {
    try {
      setStatsLoading(true);
      const response = await flashsaleService.getStats(flashSaleId);
      setStats(response.data);
    } catch (error) {
      message.error('Lỗi khi lấy thống kê');
      console.error(error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashSales();
  }, []);

  // Handle create/update
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const data = {
        productId: values.productId,
        salePrice: values.salePrice,
        totalQuantity: values.totalQuantity,
        startAt: values.startAt.toISOString(),
        endAt: values.endAt.toISOString(),
      };

      if (selectedFlashSale) {
        await flashsaleService.update(selectedFlashSale._id, data);
        message.success('Cập nhật flash sale thành công');
      } else {
        await flashsaleService.create(data);
        message.success('Tạo flash sale thành công');
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedFlashSale(null);
      fetchFlashSales(pagination.page);
    } catch (error) {
      message.error(selectedFlashSale ? 'Lỗi cập nhật flash sale' : 'Lỗi tạo flash sale');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await flashsaleService.delete(id);
      message.success('Xóa flash sale thành công');
      fetchFlashSales(pagination.page);
    } catch (error) {
      message.error('Lỗi xóa flash sale');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (record) => {
    setSelectedFlashSale(record);
    form.setFieldsValue({
      productId: record.productId._id,
      salePrice: record.salePrice,
      totalQuantity: record.totalQuantity,
      startAt: dayjs(record.startAt),
      endAt: dayjs(record.endAt),
    });
    setIsModalVisible(true);
  };

  // Handle detail view
  const handleViewDetail = (record) => {
    setSelectedFlashSale(record);
    setIsDetailModalVisible(true);
    fetchStats(record._id);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedFlashSale(null);
  };

  // Table columns
  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: ['productId', 'name'],
      key: 'productName',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Giá',
      key: 'price',
      width: 120,
      render: (_, record) => (
        <div className={styles.priceColumn}>
          <div className={styles.salePrice}>
            {record.salePrice?.toLocaleString('vi-VN')} ₫
          </div>
          <div className={styles.originalPrice}>
            {record.productId?.originalPrice?.toLocaleString('vi-VN')}
          </div>
        </div>
      ),
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 140,
      render: (_, record) => (
        <div className={styles.quantityColumn}>
          <span className={styles.sold}>{record.soldQuantity} / {record.totalQuantity}</span>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{
                width: `${(record.soldQuantity / record.totalQuantity) * 100}%`,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 200,
      render: (_, record) => (
        <div className={styles.timeColumn}>
          <div>Bắt đầu: {dayjs(record.startAt).format('DD/MM HH:mm')}</div>
          <div>Kết thúc: {dayjs(record.endAt).format('DD/MM HH:mm')}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => {
        const statusConfig = {
          upcoming: { color: 'blue', label: 'Sắp diễn ra' },
          active: { color: 'green', label: 'Đang diễn ra' },
          ended: { color: 'default', label: 'Đã kết thúc' },
          cancelled: { color: 'red', label: 'Đã hủy' },
        };
        const config = statusConfig[status] || { color: 'default', label: status };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 60,
      fixed: 'right',
      align: 'center',
      render: (_, record) => {
        const items = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Sửa',
            onClick: () => handleEdit(record),
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Xóa',
            onClick: () => handleDelete(record._id),
            danger: true,
          },
        ];

        return (
          <Dropdown
            menu={{ items }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<EllipsisOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        );
      },
    },
  ];

  const handleTableChange = (newPagination) => {
    fetchFlashSales(newPagination.current, newPagination.pageSize);
  };

  // Filter flash sales by search text
  const filteredFlashSales = flashSales.filter((item) => {
    const searchLower = searchText.toLowerCase();
    return (
      item.productId?.name?.toLowerCase().includes(searchLower) ||
      item.productId?.sku?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý Flash Sale</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Tạo Flash Sale
        </Button>
      </div>

      {/* Main content */}
      <Card className={styles.card} style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Tìm kiếm theo tên sản phẩm, SKU..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ maxWidth: 350 }}
          />
        </div>
      </Card>

      <Card className={styles.card}>
        <Spin spinning={loading}>
          {filteredFlashSales.length > 0 ? (
            <Table
              columns={columns}
              dataSource={filteredFlashSales}
              rowKey="_id"
              pagination={{
                current: pagination.page,
                pageSize: pagination.limit,
                total: pagination.total,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} flash sale`,
              }}
              onChange={handleTableChange}
              size="small"
              onRow={(record) => ({
                onClick: () => handleViewDetail(record),
                style: { cursor: 'pointer' },
              })}
            />
          ) : (
            <Empty description={searchText ? 'Không tìm thấy flash sale' : 'Chưa có flash sale nào'} />
          )}
        </Spin>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={selectedFlashSale ? 'Cập nhật Flash Sale' : 'Tạo Flash Sale'}
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="back" onClick={handleCloseModal}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
            {selectedFlashSale ? 'Cập nhật' : 'Tạo'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Sản phẩm"
            name="productId"
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
          >
            <Input placeholder="Nhập ID sản phẩm" />
          </Form.Item>

          <Form.Item
            label="Giá bán"
            name="salePrice"
            rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
          >
            <InputNumber
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập giá bán"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Số lượng"
            name="totalQuantity"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
          >
            <InputNumber min={1} placeholder="Nhập số lượng" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Thời gian bắt đầu"
            name="startAt"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu' }]}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Thời gian kết thúc"
            name="endAt"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian kết thúc' }]}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Thống kê Flash Sale"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        <Spin spinning={statsLoading}>
          {stats ? (
            <div className={styles.statsContainer}>
              <div className={styles.productInfo}>
                <h3>{selectedFlashSale?.productId?.name}</h3>
                <p className={styles.sku}>SKU: {selectedFlashSale?.productId?.sku}</p>
              </div>

              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Giá bán"
                    value={stats.salePrice}
                    suffix="₫"
                    valueStyle={{ fontSize: 16, color: '#1890ff' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Giá gốc"
                    value={stats.originalPrice}
                    suffix="₫"
                    valueStyle={{ fontSize: 16 }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Giảm giá"
                    value={stats.discountPercent}
                    suffix="%"
                    valueStyle={{ fontSize: 16, color: '#f5222d' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Tiền giảm"
                    value={stats.discountAmount}
                    suffix="₫"
                    valueStyle={{ fontSize: 16 }}
                  />
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={12} sm={8}>
                  <Statistic
                    title="Đã bán"
                    value={stats.soldQuantity}
                    suffix={`/${stats.totalQuantity}`}
                    valueStyle={{ fontSize: 16, color: '#52c41a' }}
                  />
                </Col>
                <Col xs={12} sm={8}>
                  <Statistic
                    title="Tỷ lệ bán"
                    value={stats.soldPercentage}
                    suffix="%"
                    valueStyle={{ fontSize: 16 }}
                  />
                </Col>
                <Col xs={12} sm={8}>
                  <Statistic
                    title="Còn lại"
                    value={stats.remainingQuantity}
                    valueStyle={{ fontSize: 16, color: '#faad14' }}
                  />
                </Col>
              </Row>

              <div className={styles.timeInfo} style={{ marginTop: 16 }}>
                <p>
                  <strong>Bắt đầu:</strong> {dayjs(stats.startAt).format('DD/MM/YYYY HH:mm')}
                </p>
                <p>
                  <strong>Kết thúc:</strong> {dayjs(stats.endAt).format('DD/MM/YYYY HH:mm')}
                </p>
                {stats.timeRemaining && (
                  <p>
                    <strong>Thời gian còn lại:</strong>{' '}
                    {Math.ceil(stats.timeRemaining / 3600000)} giờ
                  </p>
                )}
              </div>

              <div className={styles.progressContainer} style={{ marginTop: 16 }}>
                <p style={{ marginBottom: 8, fontWeight: 500 }}>Tiến độ bán hàng</p>
                <div className={styles.fullProgressBar}>
                  <div
                    className={styles.fullProgress}
                    style={{
                      width: `${stats.soldPercentage}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <Empty description="Không có dữ liệu thống kê" />
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default FlashSalesPage;
