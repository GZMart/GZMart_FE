import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchSuppliers, createPurchaseOrder } from '../../store/slices/erpSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from '@assets/styles/erp/CreatePurchaseOrderPage.module.css';

const CreatePurchaseOrderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { suppliers, loading } = useSelector((state) => state.erp);

  const [formData, setFormData] = useState({
    supplierId: '',
    expectedDeliveryDate: '',
    shippingCost: 0,
    taxAmount: 0,
    otherCost: 0,
    notes: '',
  });

  const [items, setItems] = useState([
    {
      productId: '',
      modelId: '',
      sku: '',
      quantity: 1,
      unitPrice: 0,
    },
  ]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchSuppliers({ limit: 100 }));
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        modelId: '',
        sku: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateFinalAmount = () => {
    const total = calculateTotalAmount();
    return (
      total +
      parseFloat(formData.shippingCost || 0) +
      parseFloat(formData.taxAmount || 0) +
      parseFloat(formData.otherCost || 0)
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.supplierId) {
      newErrors.supplierId = 'Vui lòng chọn nhà cung cấp';
    }

    items.forEach((item, index) => {
      if (!item.sku) {
        newErrors[`sku_${index}`] = 'SKU không được để trống';
      }
      if (!item.productId) {
        newErrors[`productId_${index}`] = 'Product ID không được để trống';
      }
      if (item.quantity <= 0) {
        newErrors[`quantity_${index}`] = 'Số lượng phải lớn hơn 0';
      }
      if (item.unitPrice <= 0) {
        newErrors[`unitPrice_${index}`] = 'Đơn giá phải lớn hơn 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      alert('Vui lòng kiểm tra lại thông tin');
      return;
    }

    try {
      const orderData = {
        ...formData,
        items: items.map((item) => ({
          ...item,
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
        })),
        shippingCost: parseFloat(formData.shippingCost || 0),
        taxAmount: parseFloat(formData.taxAmount || 0),
        otherCost: parseFloat(formData.otherCost || 0),
      };

      await dispatch(createPurchaseOrder(orderData)).unwrap();
      alert('Tạo đơn mua hàng thành công!');
      navigate('/erp/purchase-orders');
    } catch (err) {
      console.error('Failed to create purchase order:', err);
      alert('Không thể tạo đơn mua hàng: ' + (err.error || err));
    }
  };

  if (loading && !suppliers.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tạo Đơn Mua Hàng</h1>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => navigate('/erp/purchase-orders')}
        >
          ← Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Supplier & Delivery Info */}
        <div className={styles.section}>
          <h2>Thông tin đơn hàng</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>
                Nhà cung cấp <span className={styles.required}>*</span>
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleInputChange}
                className={errors.supplierId ? styles.error : ''}
                required
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && <span className={styles.errorText}>{errors.supplierId}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Ngày giao dự kiến</label>
              <input
                type="date"
                name="expectedDeliveryDate"
                value={formData.expectedDeliveryDate}
                onChange={handleInputChange}
              />
            </div>

            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Ghi chú</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Nhập ghi chú cho đơn hàng..."
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Sản phẩm đặt hàng</h2>
            <button type="button" className={styles.btnAdd} onClick={addItem}>
              + Thêm sản phẩm
            </button>
          </div>

          <div className={styles.itemsContainer}>
            {items.map((item, index) => (
              <div key={index} className={styles.itemCard}>
                <div className={styles.itemHeader}>
                  <h3>Sản phẩm #{index + 1}</h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className={styles.btnRemove}
                      onClick={() => removeItem(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className={styles.itemGrid}>
                  <div className={styles.formGroup}>
                    <label>
                      Product ID <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      placeholder="507f1f77bcf86cd799439011"
                      className={errors[`productId_${index}`] ? styles.error : ''}
                    />
                    {errors[`productId_${index}`] && (
                      <span className={styles.errorText}>{errors[`productId_${index}`]}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Model ID</label>
                    <input
                      type="text"
                      value={item.modelId}
                      onChange={(e) => handleItemChange(index, 'modelId', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      SKU <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      value={item.sku}
                      onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
                      placeholder="IP15-256-BLK"
                      className={errors[`sku_${index}`] ? styles.error : ''}
                    />
                    {errors[`sku_${index}`] && (
                      <span className={styles.errorText}>{errors[`sku_${index}`]}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      Số lượng <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="1"
                      className={errors[`quantity_${index}`] ? styles.error : ''}
                    />
                    {errors[`quantity_${index}`] && (
                      <span className={styles.errorText}>{errors[`quantity_${index}`]}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      Đơn giá (VNĐ) <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      min="0"
                      step="1000"
                      className={errors[`unitPrice_${index}`] ? styles.error : ''}
                    />
                    {errors[`unitPrice_${index}`] && (
                      <span className={styles.errorText}>{errors[`unitPrice_${index}`]}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Thành tiền</label>
                    <input
                      type="text"
                      value={formatCurrency(item.quantity * item.unitPrice)}
                      disabled
                      className={styles.calculated}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Costs */}
        <div className={styles.section}>
          <h2>Chi phí bổ sung</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Phí vận chuyển (VNĐ)</label>
              <input
                type="number"
                name="shippingCost"
                value={formData.shippingCost}
                onChange={handleInputChange}
                min="0"
                step="1000"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Thuế (VNĐ)</label>
              <input
                type="number"
                name="taxAmount"
                value={formData.taxAmount}
                onChange={handleInputChange}
                min="0"
                step="1000"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Chi phí khác (VNĐ)</label>
              <input
                type="number"
                name="otherCost"
                value={formData.otherCost}
                onChange={handleInputChange}
                min="0"
                step="1000"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Tổng tiền hàng:</span>
            <strong>{formatCurrency(calculateTotalAmount())}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Phí vận chuyển:</span>
            <span>{formatCurrency(formData.shippingCost || 0)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Thuế:</span>
            <span>{formatCurrency(formData.taxAmount || 0)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Chi phí khác:</span>
            <span>{formatCurrency(formData.otherCost || 0)}</span>
          </div>
          <div className={styles.summaryRow + ' ' + styles.total}>
            <span>Tổng cộng:</span>
            <strong>{formatCurrency(calculateFinalAmount())}</strong>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => navigate('/erp/purchase-orders')}
          >
            Hủy
          </button>
          <button type="submit" className={styles.btnPrimary}>
            Tạo đơn mua hàng
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePurchaseOrderPage;
