import { Container, Row, Col, Button, Card, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PUBLIC_ROUTES } from '@constants/routes';
import rmaService from '@services/api/rmaService';

/**
 * My Wallet Page Component
 * Displays wallet coin balance and transaction history
 */
const MyWalletPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchWalletInfo();
  }, []);

  const fetchWalletInfo = async () => {
    try {
      setLoading(true);
      const response = await rmaService.getWalletInfo();
      
      setWalletData(response.data);
      setBalance(response.data.balance || 0);
      setTransactions(response.data.transactions || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching wallet info:', error);
      toast.error('Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };
      type: 'withdrawal',
      description: 'Withdrawal Initiated for Product Name and Product ID',
      amount: -2490,
      balance: 5000,
      date: new Date('2022-04-25'),
    },
  ]);

  const handleBack = () => {

  const getTransactionTypeBadge = (type) => {
    const typeMap = {
      refund: { bg: 'success', icon: '↓', text: 'Hoàn tiền' },
      purchase: { bg: 'danger', icon: '↑', text: 'Mua hàng' },
      reward: { bg: 'info', icon: '↓', text: 'Thưởng' },
      admin_adjustment: { bg: 'warning', icon: '~', text: 'Điều chỉnh' },
      promotion: { bg: 'primary', icon: '↓', text: 'Khuyến mãi' },
      withdrawal: { bg: 'secondary', icon: '↑', text: 'Rút tiền' },
    };

    const config = typeMap[type] || { bg: 'secondary', icon: '?', text: type };
    return (
      <Badge bg={config.bg}>
        {config.icon} {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải thông tin ví...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Ví Coin Của Tôi</h2>
        <Button variant="outline-primary" onClick={() => navigate('/buyer/returns')}>
          Yêu cầu đổi trả
        </Button>
      </div>

      {/* Balance Card */}
      <Card className="mb-4 shadow-sm">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={6}>
              <div className="mb-3">
                <h6 className="text-muted mb-1">Số dư khả dụng</h6>
                <h1 className="display-4 text-primary mb-0">
                  {balance.toLocaleString('vi-VN')} 
                  <span className="fs-4 text-muted ms-2">coins</span>
                </h1>
              </div>
              <p className="text-muted mb-0">
                <i className="bi bi-info-circle me-2"></i>
                1 coin = 1 VND (dùng cho đơn hàng tiếp theo)
              </p>
            </Col>
            <Col md={6}>
              {stats && (
                <Card className="bg-light">
                  <Card.Body>
                    <h6 className="mb-3">Thống kê</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Tổng nhận:</span>
                      <strong className="text-success">
                        +{stats.totalEarned?.toLocaleString('vi-VN') || 0} coins
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Tổng chi:</span>
                      <strong className="text-danger">
                        -{stats.totalSpent?.toLocaleString('vi-VN') || 0} coins
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Giao dịch:</span>
                      <strong>{stats.transactionCount || 0}</strong>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Info Alert */}
      <Alert variant="info" className="mb-4">
        <Alert.Heading>💰 Cách nhận Coin</Alert.Heading>
        <ul className="mb-0">
          <li>Hoàn tiền từ yêu cầu đổi trả thành công</li>
          <li>Thưởng từ chương trình khuyến mãi</li>
          <li>Điểm thưởng từ đơn hàng hoàn thành</li>
        </ul>
      </Alert>

      {/* Transaction History */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Lịch Sử Giao Dịch</h5>
        </Card.Header>
        <Card.Body>
          {transactions.length === 0 ? (
            <Alert variant="secondary" className="text-center">
              <p className="mb-0">Chưa có giao dịch nào</p>
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Loại</th>
                  <th>Mô tả</th>
                  <th className="text-end">Số tiền</th>
                  <th className="text-end">Số dư sau</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td className="text-muted" style={{ fontSize: '0.9rem' }}>
                      {new Date(tx.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>{getTransactionTypeBadge(tx.type)}</td>
                    <td>
                      {tx.description}
                      {tx.reference?.returnRequestId && (
                        <div className="text-muted small">
                          RMA: {tx.metadata?.requestNumber || 'N/A'}
                        </div>
                      )}
                      {tx.reference?.orderId && (
                        <div className="text-muted small">
                          Đơn hàng: {tx.metadata?.orderNumber || 'N/A'}
                        </div>
                      )}
                    </td>
                    <td className="text-end">
                      <strong
                        className={tx.amount >= 0 ? 'text-success' : 'text-danger'}
                      >
                        {tx.amount >= 0 ? '+' : ''}
                        {tx.amount.toLocaleString('vi-VN')} coins
                      </strong>
                    </td>
                    <td className="text-end text-muted">
                      {tx.balanceAfter.toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Help Section */}
      <Card className="mt-4 border-primary">
        <Card.Body>
          <h6 className="mb-3">
            <i className="bi bi-question-circle me-2"></i>
            Cần trợ giúp?
          </h6>
          <p className="text-muted mb-3">
            Nếu bạn có thắc mắc về ví coin hoặc giao dịch, vui lòng liên hệ bộ phận hỗ trợ.
          </p>
          <Button variant="outline-primary" size="sm">
            <i className="bi bi-envelope me-2"></i>
            Liên hệ hỗ trợ
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MyWalletPage;
