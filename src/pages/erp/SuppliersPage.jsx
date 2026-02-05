import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../../store/slices/erpSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from '@assets/styles/erp/SuppliersPage.module.css';

const SuppliersPage = () => {
  const dispatch = useDispatch();
  const { suppliers, suppliersPagination, loading, error } = useSelector((state) => state.erp);

  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20,
  });

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxCode: '',
    bankAccount: '',
    bankName: '',
    paymentTerms: '',
    notes: '',
  });

  useEffect(() => {
    dispatch(fetchSuppliers(filters));
  }, [dispatch, filters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await dispatch(updateSupplier({ id: editingSupplier._id, updateData: formData })).unwrap();
      } else {
        await dispatch(createSupplier(formData)).unwrap();
      }
      setShowModal(false);
      resetForm();
      dispatch(fetchSuppliers(filters));
    } catch (err) {
      console.error('Failed to save supplier:', err);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      taxCode: supplier.taxCode || '',
      bankAccount: supplier.bankAccount || '',
      bankName: supplier.bankName || '',
      paymentTerms: supplier.paymentTerms || '',
      notes: supplier.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa nhà cung cấp này?')) {
      try {
        await dispatch(deleteSupplier(id)).unwrap();
        dispatch(fetchSuppliers(filters));
      } catch (err) {
        console.error('Failed to delete supplier:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxCode: '',
      bankAccount: '',
      bankName: '',
      paymentTerms: '',
      notes: '',
    });
    setEditingSupplier(null);
  };

  const getStatusBadge = (status) => {
    return status === 'Active' ? (
      <span className={styles.badgeActive}>Hoạt động</span>
    ) : (
      <span className={styles.badgeInactive}>Ngừng hoạt động</span>
    );
  };

  if (loading && !suppliers.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Quản lý Nhà Cung Cấp</h1>
        <button
          className={styles.btnPrimary}
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Thêm Nhà Cung Cấp
        </button>
      </div>

      {error && <div className={styles.alert}>{error.error || error}</div>}

      <div className={styles.filters}>
        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Active">Hoạt động</option>
          <option value="Inactive">Ngừng hoạt động</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên NCC</th>
              <th>Người liên hệ</th>
              <th>Điện thoại</th>
              <th>Email</th>
              <th>Độ tin cậy</th>
              <th>Trạng thái</th>
              <th>Tổng đơn</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier._id}>
                <td>
                  <Link to={`/erp/suppliers/${supplier._id}`} className={styles.link}>
                    {supplier.name}
                  </Link>
                </td>
                <td>{supplier.contactPerson || '-'}</td>
                <td>{supplier.phone || '-'}</td>
                <td>{supplier.email || '-'}</td>
                <td>
                  <div className={styles.scoreBar}>
                    <div
                      className={styles.scoreFill}
                      style={{ width: `${supplier.reliabilityScore || 0}%` }}
                    />
                    <span>{supplier.reliabilityScore || 0}/100</span>
                  </div>
                </td>
                <td>{getStatusBadge(supplier.status)}</td>
                <td>{supplier.totalOrders || 0}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.btnEdit} onClick={() => handleEdit(supplier)}>
                      Sửa
                    </button>
                    <button className={styles.btnDelete} onClick={() => handleDelete(supplier._id)}>
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {suppliersPagination && (
        <div className={styles.pagination}>
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            ← Trước
          </button>
          <span>
            Trang {filters.page} / {suppliersPagination.totalPages}
          </span>
          <button
            disabled={filters.page === suppliersPagination.totalPages}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Sau →
          </button>
        </div>
      )}

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editingSupplier ? 'Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>
                    Tên nhà cung cấp <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Người liên hệ</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Mã số thuế</label>
                  <input
                    type="text"
                    name="taxCode"
                    value={formData.taxCode}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Số tài khoản</label>
                  <input
                    type="text"
                    name="bankAccount"
                    value={formData.bankAccount}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Ngân hàng</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Điều khoản thanh toán</label>
                  <input
                    type="text"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Net 30 days"
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Ghi chú</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Hủy
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {editingSupplier ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
