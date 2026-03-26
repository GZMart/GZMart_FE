import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import {
  ArrowLeft,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { purchaseOrderService } from '../../../services/api/purchaseOrderService';
import erpService from '../../../services/api/erpService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const fmtVnd = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n || 0);

const fmtCny = (n) => `¥${(Number(n) || 0).toFixed(2)}`;

// ── Default empty row ─────────────────────────────────────────────────────────
const makeRow = (overrides = {}) => ({
  productName: '',
  sku: '',
  quantity: 1,
  unitPriceCny: 0,
  weightKg: 0,
  ...overrides,
});

export default function POCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  // Items — pre-filled from URL params if present
  const [items, setItems] = useState([makeRow()]);
  const [exchangeRate, setExchangeRate] = useState(3500);
  const [buyingFeeRate, setBuyingFeeRate] = useState(0.05); // 5%

  // ── Decode pre-filled products from URL ─────────────────────────────────────
  useEffect(() => {
    const raw = searchParams.get('products');
    if (!raw) {
return;
}
    try {
      const decoded = JSON.parse(decodeURIComponent(raw));
      const parsed = Array.isArray(decoded) ? decoded : [decoded];
      const rows = parsed.map((p) =>
        makeRow({
          productId: p._id || p.productId,
          modelId: p.lowestStockModel?._id || p.modelId,
          productName: p.name || '',
          sku: p.lowestStockModel?.sku || p.sku || '',
          quantity: Math.max(1, Math.round((20 - (p.stock || 0)) * 1.2)),
          unitPriceCny: p.lowestStockModel?.price || p.price || 0,
          weightKg: p.weightKg || 0,
        }),
      );
      setItems(rows.length > 0 ? rows : [makeRow()]);
      if (parsed[0]?.name) {
        message.info(`Đã điền sẵn ${rows.length} sản phẩm sắp hết hàng`);
      }
    } catch {
      // ignore malformed param
    }
  }, [searchParams]);

  // ── Fetch exchange rate ──────────────────────────────────────────────────────
  useEffect(() => {
    erpService
      .getExchangeRate()
      .then((r) => {
        if (r?.data?.rate) {
setExchangeRate(r.data.rate);
}
      })
      .catch(() => {});
  }, []);

  // ── Fetch suppliers ──────────────────────────────────────────────────────────
  const fetchSuppliers = () => {
    setSuppliersLoading(true);
    purchaseOrderService
      .getSuppliers({ status: 'Active', limit: 100 })
      .then((r) => {
        const data = r?.data?.data || r?.data || [];
        setSuppliers(Array.isArray(data) ? data : []);
      })
      .catch(() => message.error('Không tải được danh sách nhà cung cấp'))
      .finally(() => setSuppliersLoading(false));
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // ── Cost preview ──────────────────────────────────────────────────────────────
  const costPreview = useMemo(() => {
    const totalCny = items.reduce(
      (s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPriceCny) || 0),
      0,
    );
    const totalVnd = totalCny * exchangeRate;
    const buyingFee = totalVnd * buyingFeeRate;
    const costBasis = totalVnd + buyingFee;

    return {
      totalCny,
      totalVnd,
      buyingFee,
      costBasis,
    };
  }, [items, exchangeRate, buyingFeeRate]);

  // ── Item helpers ─────────────────────────────────────────────────────────────
  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)),
    );
  };

  const addItem = () => setItems((prev) => [...prev, makeRow()]);

  const removeItem = (index) => {
    if (items.length <= 1) {
return;
}
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Create supplier inline ────────────────────────────────────────────────────
  const handleCreateSupplier = async () => {
    const name = newSupplierName.trim();
    if (!name) {
      message.warning('Nhập tên nhà cung cấp');
      return;
    }
    setCreatingSupplier(true);
    try {
      const res = await purchaseOrderService.createSupplier({ name, status: 'Active' });
      const created = res?.data || res;
      setSuppliers((prev) => [created, ...prev]);
      form.setFieldValue('supplierId', created._id);
      setSupplierModalOpen(false);
      setNewSupplierName('');
      message.success('Đã tạo nhà cung cấp');
    } catch (err) {
      message.error(err?.response?.data?.message || 'Tạo nhà cung cấp thất bại');
    } finally {
      setCreatingSupplier(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (values) => {
    if (!values.supplierId) {
      message.warning('Vui lòng chọn nhà cung cấp');
      return;
    }
    const validItems = items.filter((it) => it.sku || it.productName);
    if (validItems.length === 0) {
      message.warning('Cần ít nhất 1 sản phẩm có SKU hoặc tên');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        supplierId: values.supplierId,
        notes: values.notes || '',
        items: validItems.map((it) => ({
          productId: it.productId || undefined,
          modelId: it.modelId || undefined,
          productName: it.productName,
          sku: it.sku,
          quantity: Number(it.quantity) || 1,
          unitPriceCny: Number(it.unitPriceCny) || 0,
          weightKg: Number(it.weightKg) || 0,
        })),
        importConfig: {
          exchangeRate,
          buyingServiceFeeRate: buyingFeeRate,
        },
      };

      const res = await purchaseOrderService.createPurchaseOrder(payload);
      const poId = res?.data?._id || res?._id;
      message.success('Tạo PO thành công!');
      navigate(`/seller/purchase-orders/${poId}`);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Tạo PO thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 8, color: '#64748B' }}
        >
          Quay lại
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShoppingCart size={18} color="#3B82F6" />
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>Tạo đơn nhập hàng (PO)</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {items.filter((it) => it.productId).length > 0
                ? `${items.filter((it) => it.productId).length} sản phẩm sắp hết hàng được điền sẵn`
                : 'Tạo PO mới từ đầu'}
            </Text>
          </div>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={20} align="top">
          {/* ── Left: Supplier + Items ── */}
          <Col span={16}>
            {/* Supplier */}
            <Card
              title={
                <Space>
                  <Package size={14} color="#3B82F6" />
                  <Text strong>Nhà cung cấp</Text>
                </Space>
              }
              style={{ borderRadius: 12, marginBottom: 16 }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <Form.Item
                name="supplierId"
                label="Chọn nhà cung cấp"
                rules={[{ required: true, message: 'Chọn nhà cung cấp' }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  placeholder="-- Chọn nhà cung cấp --"
                  showSearch
                  optionFilterProp="label"
                  loading={suppliersLoading}
                  options={suppliers.map((s) => ({
                    value: s._id,
                    label: s.name,
                  }))}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ padding: '4px 8px' }}>
                        <Button
                          type="dashed"
                          size="small"
                          icon={<Plus size={13} />}
                          onClick={() => setSupplierModalOpen(true)}
                          block
                        >
                          + Thêm nhà cung cấp mới
                        </Button>
                      </div>
                    </>
                  )}
                />
              </Form.Item>
            </Card>

            {/* Items */}
            <Card
              title={
                <Space>
                  <TrendingUp size={14} color="#3B82F6" />
                  <Text strong>Sản phẩm ({items.length})</Text>
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  icon={<Plus size={14} />}
                  onClick={addItem}
                  size="small"
                >
                  Thêm sản phẩm
                </Button>
              }
              style={{ borderRadius: 12, marginBottom: 16 }}
              styles={{ body: { padding: 0 } }}
            >
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 100px 120px 100px 48px',
                gap: 8,
                padding: '10px 20px',
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
              }}>
                {['Sản phẩm', 'SKU', 'Số lượng', 'Đơn giá (¥)', 'Cân nặng (kg)', ''].map((h) => (
                  <Text key={h} style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                    {h}
                  </Text>
                ))}
              </div>

              {/* Rows */}
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 100px 120px 100px 48px',
                    gap: 8,
                    padding: '12px 20px',
                    borderBottom: idx < items.length - 1 ? '1px solid #F1F5F9' : 'none',
                    alignItems: 'center',
                  }}
                >
                  {/* Product name */}
                  <Input
                    placeholder="Tên sản phẩm"
                    value={item.productName}
                    onChange={(e) => updateItem(idx, 'productName', e.target.value)}
                    style={{ borderRadius: 6 }}
                    size="small"
                  />

                  {/* SKU */}
                  <Input
                    placeholder="SKU (VD: SP-001)"
                    value={item.sku}
                    onChange={(e) => updateItem(idx, 'sku', e.target.value)}
                    style={{ borderRadius: 6 }}
                    size="small"
                  />

                  {/* Quantity */}
                  <InputNumber
                    min={1}
                    value={item.quantity}
                    onChange={(v) => updateItem(idx, 'quantity', v)}
                    style={{ width: '100%', borderRadius: 6 }}
                    size="small"
                  />

                  {/* Unit price CNY */}
                  <InputNumber
                    min={0}
                    step={0.01}
                    value={item.unitPriceCny}
                    onChange={(v) => updateItem(idx, 'unitPriceCny', v)}
                    formatter={(v) => `¥ ${v}`}
                    parser={(v) => parseFloat(v.replace(/¥\s?/g, '')) || 0}
                    style={{ width: '100%', borderRadius: 6 }}
                    size="small"
                  />

                  {/* Weight */}
                  <InputNumber
                    min={0}
                    step={0.01}
                    value={item.weightKg}
                    onChange={(v) => updateItem(idx, 'weightKg', v)}
                    placeholder="kg"
                    style={{ width: '100%', borderRadius: 6 }}
                    size="small"
                  />

                  {/* Delete */}
                  <Button
                    type="text"
                    danger
                    icon={<Trash2 size={14} />}
                    onClick={() => removeItem(idx)}
                    disabled={items.length <= 1}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </div>
              ))}
            </Card>

            {/* Notes */}
            <Card
              title={<Text strong style={{ fontSize: 13 }}>Ghi chú</Text>}
              style={{ borderRadius: 12 }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <Form.Item name="notes" style={{ marginBottom: 0 }}>
                <TextArea
                  rows={3}
                  placeholder="Ghi chú cho đơn nhập hàng (tùy chọn)"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Card>
          </Col>

          {/* ── Right: Cost Preview ── */}
          <Col span={8}>
            <div style={{ position: 'sticky', top: 24 }}>
              <Card
                title={
                  <Space>
                    <Package size={14} color="#3B82F6" />
                    <Text strong>Chi phí dự kiến</Text>
                  </Space>
                }
                style={{ borderRadius: 12, marginBottom: 12 }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                {/* Exchange rate */}
                <div style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                    Tỷ giá CNY → VND
                  </Text>
                  <InputNumber
                    min={1000}
                    step={10}
                    value={exchangeRate}
                    onChange={(v) => setExchangeRate(v || 3500)}
                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(v) => parseFloat(v.replace(/,/g, '')) || 3500}
                    style={{ width: '100%', borderRadius: 6 }}
                    size="small"
                  />
                </div>

                {/* Buying fee */}
                <div style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                    Phí mua hàng (%)
                  </Text>
                  <InputNumber
                    min={0}
                    max={100}
                    step={0.5}
                    value={buyingFeeRate * 100}
                    onChange={(v) => setBuyingFeeRate((v || 0) / 100)}
                    formatter={(v) => `${v}%`}
                    parser={(v) => parseFloat(v.replace(/%/g, '')) || 0}
                    style={{ width: '100%', borderRadius: 6 }}
                    size="small"
                  />
                </div>

                <Divider style={{ margin: '0 0 14px', borderColor: '#F1F5F9' }} />

                {/* Preview rows */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Tổng (¥)</Text>
                  <Text strong style={{ fontSize: 13 }}>{fmtCny(costPreview.totalCny)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Tổng (VND)</Text>
                  <Text strong style={{ fontSize: 13 }}>{fmtVnd(costPreview.totalVnd)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Phí mua hàng</Text>
                  <Text style={{ fontSize: 13, color: '#F97316' }}>+{fmtVnd(costPreview.buyingFee)}</Text>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: 14 }}>Tổng dự kiến</Text>
                  <Text strong style={{ fontSize: 15, color: '#3B82F6' }}>
                    {fmtVnd(costPreview.costBasis)}
                  </Text>
                </div>
              </Card>

              {/* Submit */}
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                onClick={form.submit}
                block
                size="large"
                style={{ borderRadius: 10, height: 48, fontWeight: 600 }}
              >
                Tạo đơn nhập hàng
              </Button>

              <Button
                type="text"
                block
                onClick={() => navigate(-1)}
                style={{ marginTop: 8, color: '#94A3B8' }}
              >
                Hủy bỏ
              </Button>
            </div>
          </Col>
        </Row>
      </Form>

      {/* Inline supplier modal */}
      {supplierModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => {
 if (e.target === e.currentTarget) {
setSupplierModalOpen(false);
} 
}}
        >
          <Card
            title="Thêm nhà cung cấp mới"
            extra={
              <Button
                type="text"
                icon={<X size={16} />}
                onClick={() => setSupplierModalOpen(false)}
              />
            }
            style={{ width: 420, borderRadius: 12 }}
          >
            <div style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 6 }}>
                Tên nhà cung cấp *
              </Text>
              <Input
                placeholder="VD: Nhà cung cấp ABC"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                onPressEnter={handleCreateSupplier}
                style={{ borderRadius: 8 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => setSupplierModalOpen(false)}>Hủy</Button>
              <Button type="primary" loading={creatingSupplier} onClick={handleCreateSupplier}>
                Tạo mới
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
