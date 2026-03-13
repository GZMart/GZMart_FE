import React, { useState } from 'react';
import { Form, Row, Col, InputGroup, Button } from 'react-bootstrap';
import { DatePicker, Table, Avatar, Button as AntButton } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from '@assets/styles/seller/VoucherCreate.module.css';
import ProductSelectorModal from '@components/seller/vouchers/ProductSelectorModal';

const { RangePicker } = DatePicker;

const VoucherForm = ({
  formData,
  handleChange,
  handleDateChange,
  voucherType,
  applyTo,
  setApplyTo,
  selectedProducts,
  handleProductSelect,
  handleRemoveProduct,
  isEdit,
  handleSubmit,
  navigate,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const disabledDate = (current) =>
    // Can not select days before today and today
    current && current < dayjs().endOf('day').subtract(1, 'day');
  const productColumns = [
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="d-flex align-items-center gap-2">
          <Avatar
            shape="square"
            size={40}
            src={record.images?.[0] || 'https://via.placeholder.com/40'}
          />
          <div style={{ lineHeight: '1.2' }}>
            <div className="fw-medium text-truncate" style={{ maxWidth: '200px' }}>
              {text}
            </div>
            <small className="text-muted">
              SKU: {record.models?.[0]?.sku || record.sku || 'N/A'}
            </small>
          </div>
        </div>
      ),
    },
    {
      title: 'Price',
      key: 'price',
      width: 120,
      render: (_, record) => {
        const price = record.models?.[0]?.price || record.originalPrice || 0;
        return `₫${Number(price).toLocaleString()}`;
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <AntButton
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveProduct(record._id || record.id)}
        />
      ),
    },
  ];

  return (
    <>
      {/* Section A: Basic Info */}
      <div className={styles.formSection}>
        <h5 className={styles.sectionTitle}>
          <i className="bi bi-info-circle me-2 text-primary"></i>
          Basic Information
        </h5>

        <Form.Group as={Row} className="mb-4">
          <Form.Label column sm={3} className={`${styles.formLabel} ${styles.required}`}>
            Voucher Type
          </Form.Label>
          <Col sm={9}>
            <div
              className="d-flex align-items-center p-3 border rounded bg-light"
              style={{ width: 'fit-content' }}
            >
              <div className="bg-white p-2 rounded shadow-sm me-3 border">
                <i
                  className={`bi ${voucherType === 'product' ? 'bi-box-seam' : voucherType === 'private' ? 'bi-incognito' : voucherType === 'live' ? 'bi-camera-video' : voucherType === 'video' ? 'bi-play-circle' : voucherType === 'new_buyer' ? 'bi-person-plus' : voucherType === 'repeat_buyer' ? 'bi-arrow-repeat' : voucherType === 'follower' ? 'bi-heart' : 'bi-shop'} text-primary fs-5`}
                ></i>
              </div>
              <div>
                <div className="fw-bold text-dark text-capitalize">
                  {voucherType === 'live'
                    ? 'Shopee Live'
                    : voucherType === 'video'
                      ? 'Shopee Video'
                      : voucherType === 'new_buyer'
                        ? 'New Buyer'
                        : voucherType === 'repeat_buyer'
                          ? 'Repeat Buyer'
                          : voucherType}{' '}
                  Voucher
                </div>
                <div className="small text-muted">
                  {voucherType === 'product'
                    ? 'Applicable to specific products'
                    : voucherType === 'private'
                      ? 'Hidden voucher, shared via code'
                      : voucherType === 'live'
                        ? 'Exclusive to Livestream'
                        : voucherType === 'video'
                          ? 'Exclusive to Shopee Video'
                          : voucherType === 'new_buyer'
                            ? 'Exclusive to new customers'
                            : voucherType === 'repeat_buyer'
                              ? 'Reward for returning customers'
                              : voucherType === 'follower'
                                ? 'Reward for new followers'
                                : 'Applicable to all products'}
                </div>
              </div>
            </div>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-4">
          <Form.Label column sm={3} className={`${styles.formLabel} ${styles.required}`}>
            Voucher Name
          </Form.Label>
          <Col sm={9}>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Summer Sale Voucher"
              maxLength={100}
              className="py-2"
            />
            <div className="d-flex justify-content-between mt-1">
              <div className={styles.helperText}>
                This name is for your reference and <strong>will not</strong> be displayed to
                buyers.
              </div>
              <span className="text-muted small">{formData.name.length}/100</span>
            </div>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-4">
          <Form.Label column sm={3} className={`${styles.formLabel} ${styles.required}`}>
            Voucher Code
          </Form.Label>
          <Col sm={9}>
            <InputGroup className="mb-1">
              <InputGroup.Text className={styles.inputGroupText}>
                {formData.codePrefix}
              </InputGroup.Text>
              <Form.Control
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Enter 5 characters (A-Z, 0-9)"
                maxLength={5}
                disabled={isEdit}
                className="font-monospace text-uppercase py-2"
              />
            </InputGroup>
            <div className={styles.helperText}>
              Only alphanumeric characters allowed. Preview:{' '}
              <strong>
                {formData.codePrefix}
                {formData.code || 'XXXXX'}
              </strong>
            </div>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-2">
          <Form.Label column sm={3} className={`${styles.formLabel} ${styles.required}`}>
            Usage Period
          </Form.Label>
          <Col sm={9}>
            <RangePicker
              showTime
              className="w-100 py-2"
              onChange={handleDateChange}
              value={
                formData.startTime && formData.endTime
                  ? [dayjs(formData.startTime), dayjs(formData.endTime)]
                  : []
              }
              disabledDate={disabledDate}
              size="large"
            />
            <div className={styles.helperText}>
              Buyers can collect and use the voucher within this period.
            </div>
          </Col>
        </Form.Group>
      </div>

      {/* Section: Applicable Products */}
      {(voucherType === 'product' ||
        voucherType === 'private' ||
        voucherType === 'live' ||
        voucherType === 'video') && (
        <div className={styles.formSection}>
          <h5 className={styles.sectionTitle} style={{ marginBottom: '24px' }}>
            <i className="bi bi-box-seam me-2 text-primary"></i>
            Applicable Products
          </h5>

          {(voucherType === 'private' || voucherType === 'live' || voucherType === 'video') && (
            <Form.Group as={Row} className="mb-4">
              <Form.Label column sm={3} className={styles.formLabel}>
                Product Scope
              </Form.Label>
              <Col sm={9}>
                <div className="d-flex gap-4">
                  <Form.Check
                    type="radio"
                    id="scope-all"
                    label="All Products"
                    name="applyTo"
                    value="all"
                    checked={applyTo === 'all'}
                    onChange={() => setApplyTo('all')}
                  />
                  <Form.Check
                    type="radio"
                    id="scope-specific"
                    label="Specific Products"
                    name="applyTo"
                    value="specific"
                    checked={applyTo === 'specific'}
                    onChange={() => setApplyTo('specific')}
                  />
                </div>
              </Col>
            </Form.Group>
          )}

          {(applyTo === 'specific' || voucherType === 'product') && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted small">
                  Selected Products: {selectedProducts.length}
                </span>
                <Button variant="outline-primary" size="sm" onClick={() => setIsModalVisible(true)}>
                  <i className="bi bi-plus-lg me-1"></i> Add Product
                </Button>
              </div>

              {selectedProducts.length > 0 ? (
                <Table
                  dataSource={selectedProducts}
                  columns={productColumns}
                  rowKey={(r) => r._id || r.id}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  className="border rounded"
                />
              ) : (
                <div className="text-center p-4 border rounded bg-light text-muted">
                  <i className="bi bi-basket fs-3 d-block mb-2"></i>
                  No products selected. Please add products to apply the voucher.
                </div>
              )}

              <ProductSelectorModal
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onConfirm={(products) => {
                  handleProductSelect(products);
                  setIsModalVisible(false);
                }}
                initialSelectedIds={selectedProducts.map((p) => p._id || p.id)}
              />
            </div>
          )}
        </div>
      )}

      {/* Section B: Discount Settings */}
      <div className={styles.formSection}>
        <h5 className={styles.sectionTitle}>
          <i className="bi bi-gear me-2 text-primary"></i>
          Discount Settings
        </h5>

        <Form.Group as={Row} className="mb-4">
          <Form.Label column sm={3} className={`${styles.formLabel} ${styles.required}`}>
            Discount Type
          </Form.Label>
          <Col sm={9}>
            <div className="d-flex gap-4 mb-3 p-3 bg-light rounded border">
              <Form.Check
                type="radio"
                id="type-amount"
                label={<span className="fw-medium">Fixed Amount</span>}
                name="discountType"
                value="amount"
                checked={formData.discountType === 'amount'}
                onChange={handleChange}
              />
              <Form.Check
                type="radio"
                id="type-percent"
                label={<span className="fw-medium">Percentage</span>}
                name="discountType"
                value="percent"
                checked={formData.discountType === 'percent'}
                onChange={handleChange}
              />
            </div>

            <InputGroup className="mb-2" style={{ maxWidth: '320px' }}>
              <Form.Control
                type="number"
                placeholder={formData.discountType === 'percent' ? 'Enter 1-99' : 'Enter Amount'}
                name="discountValue"
                value={formData.discountValue}
                onChange={handleChange}
                className="py-2"
                min="0"
              />
              <InputGroup.Text className={styles.inputGroupText}>
                {formData.discountType === 'percent' ? '%' : '₫'}
              </InputGroup.Text>
            </InputGroup>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-4">
          <Form.Label column sm={3} className={styles.formLabel}>
            Min. Basket Price
          </Form.Label>
          <Col sm={9}>
            <InputGroup style={{ maxWidth: '320px' }} className="mb-1">
              <InputGroup.Text className={styles.inputGroupText}>₫</InputGroup.Text>
              <Form.Control
                type="number"
                placeholder="0"
                name="minBasketPrice"
                value={formData.minBasketPrice}
                onChange={handleChange}
                className="py-2"
                min="0"
              />
            </InputGroup>
            <div className={styles.helperText}>
              Minimum order value required to use this voucher. Leave 0 for no minimum.
            </div>
          </Col>
        </Form.Group>

        <Row className="mb-2">
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className={`${styles.formLabel} ${styles.required}`}>
                Usage Quantity
              </Form.Label>
              <Form.Control
                type="number"
                placeholder="Total limit"
                name="usageLimit"
                value={formData.usageLimit}
                onChange={handleChange}
                className="py-2"
                min="0"
              />
              <div className={styles.helperText}>Total vouchers available.</div>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className={`${styles.formLabel} ${styles.required}`}>
                Max Usage / Buyer
              </Form.Label>
              <Form.Control
                type="number"
                value={formData.maxPerBuyer}
                name="maxPerBuyer"
                onChange={handleChange}
                className="py-2"
                min="1"
              />
              <div className={styles.helperText}>Limit per customer account.</div>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {/* Section C: Display */}
      <div className={styles.formSection}>
        <h5 className={styles.sectionTitle}>
          <i className="bi bi-eye me-2 text-primary"></i>
          Display Settings
        </h5>
        <Form.Group as={Row} className="mb-2">
          <Form.Label column sm={3} className={styles.formLabel}>
            Display Level
          </Form.Label>
          <Col sm={9}>
            <div className="d-flex flex-column gap-3">
              <div
                className={`p-3 border rounded ${formData.displaySetting === 'public' ? 'border-primary bg-primary-subtle' : ''} ${voucherType === 'private' || voucherType === 'live' || voucherType === 'video' ? 'opacity-50' : ''}`}
              >
                <Form.Check
                  type="radio"
                  label={<span className="fw-medium">Display on all pages</span>}
                  name="displaySetting"
                  id="disp-public"
                  value="public"
                  checked={formData.displaySetting === 'public'}
                  onChange={handleChange}
                  disabled={
                    voucherType === 'private' || voucherType === 'live' || voucherType === 'video'
                  }
                />
                <div className="ms-4 small text-muted mt-1">
                  Show on Shop Home, Product Detail, and Feed. Best for maximising reach.
                </div>
              </div>

              <div
                className={`p-3 border rounded ${formData.displaySetting === 'private' || formData.displaySetting === 'live' || formData.displaySetting === 'video' ? 'border-primary bg-primary-subtle' : ''}`}
              >
                <Form.Check
                  type="radio"
                  label={
                    <span className="fw-medium">
                      {voucherType === 'live'
                        ? 'Live Stream Only'
                        : voucherType === 'video'
                          ? 'Shopee Video Only'
                          : 'Do not display'}
                    </span>
                  }
                  name="displaySetting"
                  id="disp-private"
                  value={
                    voucherType === 'live' ? 'live' : voucherType === 'video' ? 'video' : 'private'
                  }
                  checked={
                    formData.displaySetting === 'private' ||
                    formData.displaySetting === 'live' ||
                    formData.displaySetting === 'video'
                  }
                  onChange={handleChange}
                  disabled={
                    voucherType === 'private' || voucherType === 'live' || voucherType === 'video'
                  }
                />
                <div className="ms-4 small text-muted mt-1">
                  {voucherType === 'private'
                    ? 'Private Vouchers are always hidden. Share custom code with specific buyers.'
                    : voucherType === 'live'
                      ? "Only displayed during Shop's Livestream on Shopee Live."
                      : voucherType === 'video'
                        ? "Only displayed on Shop's Video content."
                        : 'Voucher will not be shown publicly. You can share format via code only.'}
                </div>
              </div>
            </div>
          </Col>
        </Form.Group>
      </div>

      {/* Footer Actions */}
      <div className="d-flex justify-content-end align-items-center gap-3 mt-5 pt-4 border-top">
        <Button
          variant="light"
          className="px-4 py-2 border fw-medium text-secondary"
          style={{ borderRadius: '8px', minWidth: '120px' }}
          onClick={() => navigate('/seller/vouchers')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Cancel
        </Button>
        <Button
          variant="primary"
          className="px-5 py-2 shadow fw-bold text-white d-flex align-items-center"
          style={{
            borderRadius: '8px',
            background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
            border: 'none',
          }}
          onClick={handleSubmit}
        >
          {isEdit ? (
            <>
              <i className="bi bi-check2-circle me-2 fs-5"></i> Update Voucher
            </>
          ) : (
            <>
              <i className="bi bi-plus-lg me-2 fs-5"></i> Create Voucher
            </>
          )}
        </Button>
      </div>
    </>
  );
};

export default VoucherForm;
