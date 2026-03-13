import React from 'react';
import { Row, Col, Button, Table, Badge } from 'react-bootstrap';
import { Avatar } from 'antd';
import styles from '@assets/styles/seller/VoucherCreate.module.css';

const VoucherDetails = ({ formData, voucherType, selectedProducts, navigate }) => {
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
  ];

  const DetailItem = ({ label, value }) => (
    <div className="mb-3 border-bottom pb-2">
      <div className="text-muted small text-uppercase mb-1">{label}</div>
      <div className="fw-medium text-dark">{value}</div>
    </div>
  );

  return (
    <>
      {/* Section A: Basic Info */}
      <div className={styles.formSection}>
        <h5 className={styles.sectionTitle}>
          <i className="bi bi-info-circle me-2 text-primary"></i>
          Basic Information
        </h5>

        <Row className="mb-4">
          <Col md={12}>
            <div
              className="d-flex align-items-center p-3 border rounded bg-light mb-4"
              style={{ width: 'fit-content' }}
            >
              <div className="bg-white p-2 rounded shadow-sm me-3 border">
                <i
                  className={`bi ${voucherType === 'product' ? 'bi-box-seam' : voucherType === 'private' ? 'bi-incognito' : voucherType === 'live' ? 'bi-camera-video' : voucherType === 'video' ? 'bi-play-circle' : voucherType === 'new_buyer' ? 'bi-person-plus' : voucherType === 'repeat_buyer' ? 'bi-arrow-repeat' : voucherType === 'follower' ? 'bi-heart' : 'bi-shop'} text-primary fs-5`}
                ></i>
              </div>
              <div>
                <div className="fw-bold text-dark text-capitalize">{voucherType} Voucher</div>
                <div className="small text-muted">Read-only view</div>
              </div>
            </div>
          </Col>

          <Col md={6}>
            <DetailItem label="Voucher Name" value={formData.name} />
            <DetailItem label="Voucher Code" value={formData.codePrefix + formData.code} />
          </Col>
          <Col md={6}>
            <DetailItem
              label="Usage Period"
              value={
                <div>
                  <div>
                    <i className="bi bi-calendar-event me-2"></i>
                    {formData.startTime ? new Date(formData.startTime).toLocaleString() : 'N/A'}
                  </div>
                  <div className="text-muted small ms-4">to</div>
                  <div>
                    <i className="bi bi-calendar-check me-2"></i>
                    {formData.endTime ? new Date(formData.endTime).toLocaleString() : 'N/A'}
                  </div>
                </div>
              }
            />
          </Col>
        </Row>
      </div>

      {/* Section: Applicable Products */}
      {(voucherType === 'product' || selectedProducts.length > 0) && (
        <div className={styles.formSection}>
          <h5 className={styles.sectionTitle} style={{ marginBottom: '24px' }}>
            <i className="bi bi-box-seam me-2 text-primary"></i>
            Applicable Products ({selectedProducts.length})
          </h5>

          {selectedProducts.length > 0 ? (
            <Table responsive className="align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="border-0">Product</th>
                  <th className="border-0">Price</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((p) => (
                  <tr key={p._id || p.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Avatar
                          shape="square"
                          size={40}
                          src={p.images?.[0] || 'https://via.placeholder.com/40'}
                        />
                        <div style={{ lineHeight: '1.2' }}>
                          <div className="fw-medium text-truncate" style={{ maxWidth: '250px' }}>
                            {p.name}
                          </div>
                          <small className="text-muted">
                            SKU: {p.models?.[0]?.sku || p.sku || 'N/A'}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>₫{(p.models?.[0]?.price || p.originalPrice || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-muted fst-italic">
              No specific products selected (applies to all relevant items).
            </div>
          )}
        </div>
      )}

      {/* Section B: Discount Settings */}
      <div className={styles.formSection}>
        <h5 className={styles.sectionTitle}>
          <i className="bi bi-gear me-2 text-primary"></i>
          Discount Logic
        </h5>
        <Row>
          <Col md={4}>
            <DetailItem
              label="Type"
              value={formData.discountType === 'percent' ? 'Percentage' : 'Fixed Amount'}
            />
          </Col>
          <Col md={4}>
            <DetailItem
              label="Value"
              value={
                formData.discountType === 'percent' ? (
                  <Badge bg="primary" className="fs-6">
                    {formData.discountValue}% OFF
                  </Badge>
                ) : (
                  <Badge bg="success" className="fs-6">
                    ₫{Number(formData.discountValue).toLocaleString()} OFF
                  </Badge>
                )
              }
            />
          </Col>
          <Col md={4}>
            <DetailItem
              label="Min. Spend"
              value={`₫${Number(formData.minBasketPrice || 0).toLocaleString()}`}
            />
          </Col>
          <Col md={6}>
            <DetailItem label="Total Usage Limit" value={formData.usageLimit} />
          </Col>
          <Col md={6}>
            <DetailItem label="Max Per Buyer" value={formData.maxPerBuyer} />
          </Col>
        </Row>
      </div>

      {/* Section C: Display */}
      <div className={styles.formSection}>
        <h5 className={styles.sectionTitle}>
          <i className="bi bi-eye me-2 text-primary"></i>
          Display Settings
        </h5>
        <div className="p-3 bg-light rounded border d-flex align-items-center gap-3">
          <i
            className={`bi ${formData.displaySetting === 'public' ? 'bi-globe' : 'bi-lock'} fs-4 text-secondary`}
          ></i>
          <div>
            <div className="fw-bold text-dark">
              {formData.displaySetting === 'public' ? 'Public (All Pages)' : 'Private / Restricted'}
            </div>
            <div className="small text-muted">
              {formData.displaySetting === 'public'
                ? 'Visible on Shop Home, Product Detail, and Feed.'
                : 'Hidden from public lists. Accessible via code or specific channels only.'}
            </div>
          </div>
        </div>
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
          Back to List
        </Button>
      </div>
    </>
  );
};

export default VoucherDetails;
