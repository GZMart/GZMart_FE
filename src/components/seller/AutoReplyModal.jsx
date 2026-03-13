import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthToken } from '../../utils/storage';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const AutoReplyModal = ({ show, onHide }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        isEnabled: false,
        message: '',
        cooldownHours: 24,
    });

    useEffect(() => {
        if (show) {
            fetchSettings();
        }
    }, [show]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            const res = await axios.get(`${API_URL}/api/chat/auto-reply`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                setSettings({
                    isEnabled: res.data.isEnabled || false,
                    message: res.data.message || '',
                    cooldownHours: res.data.cooldownHours || 24,
                });
            }
        } catch (error) {
            console.error('Error fetching auto reply settings:', error);
            toast.error('Không thể tải cài đặt tự động trả lời');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = getAuthToken();
            await axios.put(`${API_URL}/api/chat/auto-reply`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Đã lưu cài đặt tự động trả lời');
            onHide();
        } catch (error) {
            console.error('Error saving auto reply settings:', error);
            toast.error('Có lỗi xảy ra khi lưu cài đặt');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Cài đặt tự động trả lời tin nhắn (Auto-reply)</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" />
                    </div>
                ) : (
                    <Form>
                        <Form.Group className="mb-4">
                            <Form.Check
                                type="switch"
                                id="auto-reply-switch"
                                label="Bật tính năng tự động trả lời"
                                checked={settings.isEnabled}
                                onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                            />
                            <Form.Text className="text-muted">
                                Hệ thống sẽ tự động gửi tin nhắn mẫu khi Khách hàng mới bắt đầu chat hoặc gửi sản phẩm yêu cầu hỗ trợ.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>Nội dung tin nhắn tự động</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                placeholder="VD: Xin chào, cảm ơn bạn đã quan tâm. Chúng tôi sẽ trả lời bạn trong giây lát."
                                value={settings.message}
                                onChange={(e) => setSettings({ ...settings, message: e.target.value })}
                                disabled={!settings.isEnabled}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Thời gian chờ giữa 2 lần nhận tự động (Giờ)</Form.Label>
                            <Form.Select
                                value={settings.cooldownHours}
                                onChange={(e) => setSettings({ ...settings, cooldownHours: parseInt(e.target.value) })}
                                disabled={!settings.isEnabled}
                            >
                                <option value={1}>1 giờ (Gửi lại rất nhanh)</option>
                                <option value={4}>4 giờ (Gửi lại sau 1 buổi)</option>
                                <option value={12}>12 giờ (Nửa ngày)</option>
                                <option value={24}>24 giờ (1 ngày - Khuyến nghị)</option>
                                <option value={48}>48 giờ (2 ngày)</option>
                            </Form.Select>
                            <Form.Text className="text-muted">
                                Để tránh spam, nếu khách tiếp tục nhắn tin trong thời gian chờ này, hệ thống sẽ KHÔNG tự động gửi lại tin nhắn mẫu nữa (trừ phi Shop đã chủ động phản hồi).
                            </Form.Text>
                        </Form.Group>
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={saving}>
                    Hủy
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
                    {saving ? (
                        <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> Đang lưu...</>
                    ) : 'Lưu cài đặt'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

AutoReplyModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
};

export default AutoReplyModal;
