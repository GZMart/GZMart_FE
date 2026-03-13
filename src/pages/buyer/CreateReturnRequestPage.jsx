import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
  Image,
  Row,
  Col,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import orderService from '@services/api/orderService';
import rmaService from '@services/api/rmaService';
import uploadService from '@services/api/uploadService';

/**
 * CreateReturnRequestPage
 * Buyer creates return/exchange request for delivered order
 */
const CreateReturnRequestPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [eligibility, setEligibility] = useState(null);

  // Form state
  const [type, setType] = useState('refund'); // 'refund' or 'exchange'
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const reasonOptions = [
    { value: 'wrong_size', label: 'Size không vừa' },
    { value: 'defective', label: 'Sản phẩm lỗi' },
    { value: 'wrong_item', label: 'Gửi sai hàng' },
    { value: 'not_as_described', label: 'Không đúng mô tả' },
    { value: 'damaged_in_shipping', label: 'Hư hỏng trong vận chuyển' },
    { value: 'change_of_mind', label: 'Đổi ý (chỉ trong 24h)' },
    { value: 'other', label: 'Lý do khác' },
  ];

  useEffect(() => {
    fetchOrderAndEligibility();
  }, [orderId]);

  const fetchOrderAndEligibility = async () => {
    try {
      setLoading(true);

      // Fetch order details
      const orderResponse = await orderService.getOrderById(orderId);
      setOrder(orderResponse.data);

      // Check eligibility
      const eligibilityResponse = await rmaService.checkEligibility(orderId);
      setEligibility(eligibilityResponse.data);

      // Pre-select all items
      if (orderResponse.data.items) {
        const allItems = orderResponse.data.items.map((item) => ({
          orderItemId: item._id,
          quantity: item.quantity,
          selected: true,
        }));
        setSelectedItems(allItems);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error(error.response?.data?.message || 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (itemId, selected) => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.orderItemId === itemId ? { ...item, selected } : item))
    );
  };

  const handleQuantityChange = (itemId, quantity) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.orderItemId === itemId ? { ...item, quantity: parseInt(quantity) } : item
      )
    );
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
      return;
    }

    try {
      setUploading(true);
      const uploadPromises = files.map((file) => uploadService.uploadImage(file));
      const uploadResults = await Promise.all(uploadPromises);

      const imageUrls = uploadResults.map((result) => result.data.url);
      setImages((prev) => [...prev, ...imageUrls]);

      toast.success(`Đã tải lên ${files.length} hình ảnh`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Lỗi khi tải hình ảnh');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url) => {
    setImages((prev) => prev.filter((img) => img !== url));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!reason) {
      toast.error('Vui lòng chọn lý do đổi trả');
      return;
    }

    if (description.trim().length < 10) {
      toast.error('Mô tả phải có ít nhất 10 ký tự');
      return;
    }

    const itemsToReturn = selectedItems
      .filter((item) => item.selected)
      .map((item) => ({
        orderItemId: item.orderItemId,
        quantity: item.quantity,
      }));

    if (itemsToReturn.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    if (images.length === 0) {
      toast.error('Vui lòng tải lên ít nhất một hình ảnh minh chứng');
      return;
    }

    try {
      setSubmitting(true);

      const requestData = {
        orderId,
        type,
        reason,
        description: description.trim(),
        images,
        items: itemsToReturn,
      };

      const response = await rmaService.createReturnRequest(requestData);

      toast.success('Yêu cầu đổi trả đã được tạo thành công!');
      navigate(`/buyer/returns/${response.data._id}`);
    } catch (error) {
      console.error('Error creating return request:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo yêu cầu đổi trả');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải thông tin đơn hàng...</p>
      </Container>
    );
  }

  if (!eligibility?.isEligible) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Không thể tạo yêu cầu đổi trả</Alert.Heading>
          <p>{eligibility?.reason || 'Đơn hàng không đủ điều kiện để đổi trả'}</p>
          <Button variant="outline-danger" onClick={() => navigate('/buyer/orders')}>
            Quay lại danh sách đơn hàng
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Tạo Yêu Cầu Đổi Trả</h2>

      {/* Eligibility Info */}
      <Alert variant="info" className="mb-4">
        <strong>Đơn hàng #{order?.orderNumber}</strong>
        <br />
        Giao hàng: {new Date(eligibility.deliveredDate).toLocaleDateString('vi-VN')}
        <br />
        Đã qua: {eligibility.daysSinceDelivery} ngày (tối đa 7 ngày)
      </Alert>

      <Form onSubmit={handleSubmit}>
        {/* Type Selection */}
        <Card className="mb-4">
          <Card.Body>
            <h5>Loại Yêu Cầu</h5>
            <Form.Check
              type="radio"
              label={
                <div>
                  <strong>Hoàn tiền (Refund)</strong>
                  <br />
                  <small className="text-muted">Nhận lại tiền dưới dạng coin trong ví</small>
                </div>
              }
              name="type"
              value="refund"
              checked={type === 'refund'}
              onChange={(e) => setType(e.target.value)}
              className="mb-3"
            />
            <Form.Check
              type="radio"
              label={
                <div>
                  <strong>Đổi hàng (Exchange)</strong>
                  <br />
                  <small className="text-muted">Đổi sang size/màu khác (cùng sản phẩm)</small>
                </div>
              }
              name="type"
              value="exchange"
              checked={type === 'exchange'}
              onChange={(e) => setType(e.target.value)}
            />
          </Card.Body>
        </Card>

        {/* Reason Selection */}
        <Card className="mb-4">
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>
                Lý do đổi trả <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select value={reason} onChange={(e) => setReason(e.target.value)} required>
                <option value="">Chọn lý do...</option>
                {reasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Mô tả chi tiết <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Vui lòng mô tả chi tiết vấn đề (ít nhất 10 ký tự)..."
                required
                minLength={10}
                maxLength={1000}
              />
              <Form.Text className="text-muted">{description.length}/1000 ký tự</Form.Text>
            </Form.Group>
          </Card.Body>
        </Card>

        {/* Item Selection */}
        <Card className="mb-4">
          <Card.Body>
            <h5 className="mb-3">Chọn Sản Phẩm Đổi Trả</h5>
            {order?.items?.map((item, index) => {
              const selectedItem = selectedItems.find((si) => si.orderItemId === item._id);
              return (
                <div key={item._id} className="border rounded p-3 mb-3">
                  <Row>
                    <Col md={1}>
                      <Form.Check
                        type="checkbox"
                        checked={selectedItem?.selected || false}
                        onChange={(e) => handleItemSelect(item._id, e.target.checked)}
                      />
                    </Col>
                    <Col md={2}>
                      <Image src={item.image} fluid rounded />
                    </Col>
                    <Col md={5}>
                      <h6>{item.productName}</h6>
                      <p className="text-muted mb-1">{item.variantName}</p>
                      <Badge bg="secondary">SKU: {item.sku}</Badge>
                    </Col>
                    <Col md={2}>
                      <strong>{item.finalPrice?.toLocaleString('vi-VN')}₫</strong>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Số lượng</Form.Label>
                        <Form.Control
                          type="number"
                          min={1}
                          max={item.quantity}
                          value={selectedItem?.quantity || 1}
                          onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                          disabled={!selectedItem?.selected}
                        />
                        <Form.Text className="text-muted">Tối đa: {item.quantity}</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              );
            })}
          </Card.Body>
        </Card>

        {/* Image Upload */}
        <Card className="mb-4">
          <Card.Body>
            <h5 className="mb-3">
              Hình Ảnh Minh Chứng <span className="text-danger">*</span>
            </h5>
            <p className="text-muted">
              Vui lòng tải lên ít nhất một hình ảnh chứng minh vấn đề của sản phẩm
            </p>

            <Form.Group className="mb-3">
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </Form.Group>

            {uploading && (
              <div className="text-center mb-3">
                <Spinner animation="border" size="sm" /> Đang tải hình ảnh...
              </div>
            )}

            <Row>
              {images.map((url, index) => (
                <Col key={index} md={3} className="mb-3">
                  <div className="position-relative">
                    <Image src={url} fluid rounded />
                    <Button
                      variant="danger"
                      size="sm"
                      className="position-absolute top-0 end-0 m-2"
                      onClick={() => removeImage(url)}
                    >
                      ✕
                    </Button>
                  </div>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>

        {/* Submit Buttons */}
        <div className="d-flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/buyer/orders')}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={submitting || images.length === 0}>
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang gửi yêu cầu...
              </>
            ) : (
              'Gửi Yêu Cầu Đổi Trả'
            )}
          </Button>
        </div>
      </Form>

      {/* Policy Notice */}
      <Alert variant="warning" className="mt-4">
        <Alert.Heading>Chính Sách Đổi Trả</Alert.Heading>
        <ul className="mb-0">
          <li>Đổi ý: Chỉ trong vòng 24 giờ sau khi nhận hàng, phí ship do bạn chi trả</li>
          <li>Sản phẩm lỗi/sai hàng: Trong vòng 7 ngày, miễn phí ship hoàn trả</li>
          <li>Hoàn tiền dưới dạng coin (1 VND = 1 coin) để sử dụng cho đơn hàng tiếp theo</li>
          <li>Seller có 3 ngày để phản hồi, sau đó yêu cầu sẽ tự động được chấp nhận</li>
        </ul>
      </Alert>
    </Container>
  );
};

export default CreateReturnRequestPage;
