import { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Switch,
  Button,
  message,
  Typography,
  Space,
} from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { platformSettingsService } from '@services/api/platformSettingsService';
import styles from '@assets/styles/admin/UsersPage.module.css';

const { Paragraph } = Typography;

const SystemConfigPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await platformSettingsService.get();
      const data = res.data;
      form.setFieldsValue({
        maintenanceMode: data.maintenanceMode ?? false,
        maintenanceMessage: data.maintenanceMessage ?? '',
        siteDisplayName: data.siteDisplayName ?? '',
        supportEmail: data.supportEmail ?? '',
        supportPhone: data.supportPhone ?? '',
      });
    } catch (e) {
      console.error(e);
      message.error('Không tải được cấu hình nền tảng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await platformSettingsService.update(values);
      message.success('Đã lưu');
    } catch (e) {
      if (e?.errorFields) {
return;
}
      console.error(e);
      message.error(e.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.usersPage}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <i className="bi bi-gear-wide-connected" />
          </div>
          <div>
            <h1>Cấu hình nền tảng</h1>
            <p className={styles.subtitle}>
              Thiết lập vận hành (không lưu secret thanh toán — dùng env)
            </p>
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Tải lại
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={onSave}
            loading={saving}
            style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
          >
            Lưu
          </Button>
        </Space>
      </div>

      <Card className={styles.tableWrap} loading={loading}>
        <Paragraph type="secondary">
          Document singleton trên server; dùng cho bảo trì có thông báo và thông tin hiển thị cơ bản.
        </Paragraph>
        <Form form={form} layout="vertical" style={{ maxWidth: 520 }}>
          <Form.Item name="maintenanceMode" label="Chế độ bảo trì" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="maintenanceMessage" label="Thông báo bảo trì">
            <Input.TextArea rows={3} placeholder="Hiển thị cho người dùng khi bật bảo trì (nếu FE đọc API này)" />
          </Form.Item>
          <Form.Item name="siteDisplayName" label="Tên hiển thị site">
            <Input />
          </Form.Item>
          <Form.Item name="supportEmail" label="Email hỗ trợ">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="supportPhone" label="Hotline">
            <Input />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SystemConfigPage;
