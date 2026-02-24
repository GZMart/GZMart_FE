import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Spin, Empty } from 'antd';
import { LeftOutlined, ShareAltOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import DealCard from '@/pages/buyer/DealCard';
import dealService from '@/services/api/dealService';
import styles from '@assets/styles/buyer/MyDealsPage.module.css';

const { Title, Text } = Typography;

const MyDealsPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingDeals, setPendingDeals] = useState([]);
  const [approvedDeals, setApprovedDeals] = useState([]);

  // ── Fetch my deals ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchMyDeals = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await dealService.getMyDeals();
        // Response shape: { success, pendingDeals: [], approvedDeals: [] }
        const resData = response?.data ?? response ?? {};

        setPendingDeals(Array.isArray(resData.pendingDeals) ? resData.pendingDeals : []);
        setApprovedDeals(Array.isArray(resData.approvedDeals) ? resData.approvedDeals : []);
      } catch (err) {
        console.error('❌ MyDealsPage: failed to fetch my deals', err);

        // 401 → not authenticated, redirect gracefully
        if (err?.response?.status === 401) {
          setError('You need to be logged in to view your deals.');
        } else {
          setError(err?.response?.data?.message || err.message || 'Không tải được deals của bạn');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyDeals();
  }, []);

  // ── format countdown (reuse in DealCard if needed) ──────────────────────────
  const formatTimeLeft = (time) => {
    if (!time) return '—';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(time.hours)}h : ${pad(time.minutes)}m : ${pad(time.seconds)}s`;
  };

  // ── loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.myDealsPage}>
        <div className={styles.myDealsContainer}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Spin size="large" tip="Loading your deals..." />
          </div>
        </div>
      </div>
    );
  }

  // ── error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={styles.myDealsPage}>
        <div className={styles.myDealsContainer}>
          <div className={styles.myDealsHeader}>
            <div className={styles.headerLeft}>
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={() => navigate(-1)}
                className={styles.backButton}
              />
              <div className={styles.headerTitleSection}>
                <Title level={1} className={styles.pageTitle}>My Deals</Title>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            <p style={{ fontSize: 16 }}>{error}</p>
            <Button type="primary" onClick={() => navigate('/login')} style={{ marginTop: 16 }}>
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.myDealsPage}>
      <div className={styles.myDealsContainer}>
        {/* Header */}
        <div className={styles.myDealsHeader}>
          <div className={styles.headerLeft}>
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={() => navigate(-1)}
              className={styles.backButton}
            />
            <div className={styles.headerTitleSection}>
              <Title level={1} className={styles.pageTitle}>My Deals</Title>
              <Text className={styles.pageSubtitle}>Track your pending and approved deals</Text>
            </div>
          </div>

          <div className={styles.headerRight}>
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              className={styles.pastDealsBtn}
            >
              Past Deals
            </Button>
            <Button type="primary" className={styles.walletBtn}>
              💳 Add Money to UD wallet
            </Button>
            <Button type="text" icon={<ShareAltOutlined />} className={styles.shareBtn} />
          </div>
        </div>

        {/* Deals Section */}
        <div className={styles.dealsSection}>
          {/* Pending Deals */}
          <div className={styles.dealsColumn}>
            <div className={styles.sectionHeader}>
              <div className={styles.headerIconText}>
                <span className={styles.bellIcon}>🔔</span>
                <div>
                  <h2>Pending Deals</h2>
                  <p className={styles.sectionDescription}>
                    Please choose a payment method
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.dealsGrid}>
              {pendingDeals.length > 0 ? (
                pendingDeals.map((deal) => (
                  <DealCard key={deal._id ?? deal.id} deal={deal} type="pending" />
                ))
              ) : (
                <Empty
                  description="No pending deals"
                  style={{ padding: '32px 0' }}
                />
              )}
            </div>
          </div>

          {/* Approved Deals */}
          <div className={styles.dealsColumn}>
            <div className={styles.sectionHeader}>
              <div className={styles.headerIconText}>
                <span className={styles.checkIcon}>✓</span>
                <div>
                  <h2>Approved Deals</h2>
                  <p className={styles.sectionDescription}>
                    Please choose a shipping company based on your region
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.dealsGrid}>
              {approvedDeals.length > 0 ? (
                approvedDeals.map((deal) => (
                  <DealCard key={deal._id ?? deal.id} deal={deal} type="approved" />
                ))
              ) : (
                <Empty
                  description="No approved deals"
                  style={{ padding: '32px 0' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDealsPage;
