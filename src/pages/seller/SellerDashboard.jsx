import React, { useState, useEffect } from 'react';
import { CreditCard, ShoppingCart, Zap, BarChart3, RefreshCw } from 'lucide-react';
import dashboardService from '../../services/api/dashboardService';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../assets/styles/seller/Dashboard.module.css';
import { OverallSalesCard } from '../../components/seller/dashboard/OverallSalesCard';
import { StatCard } from '../../components/seller/dashboard/StatCard';
import { ProductsTable } from '../../components/seller/dashboard/ProductsTable';

const SellerDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);

  // Sample data for Overall Sales chart
  const sampleRevenueTrendData = [
    { _id: '1', revenue: 132450000 },
    { _id: '2', revenue: 128900000 },
    { _id: '3', revenue: 145230000 },
    { _id: '4', revenue: 152680000 },
    { _id: '5', revenue: 138450000 },
    { _id: '6', revenue: 149250000 },
    { _id: '7', revenue: 155890000 },
    { _id: '8', revenue: 142100000 },
    { _id: '9', revenue: 158340000 },
    { _id: '10', revenue: 165120000 },
    { _id: '11', revenue: 172450000 },
    { _id: '12', revenue: 348253650 },
  ];

  // Fetch all dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashResponse, trendResponse] = await Promise.all([
        dashboardService.getComplete(),
        dashboardService.getRevenueTrend({ period: 'daily' }),
      ]);

      setDashboardData(dashResponse.data);
      // Use sample data if API returns empty or null
      setRevenueTrend(
        trendResponse.data && trendResponse.data.length > 0
          ? trendResponse.data
          : sampleRevenueTrendData
      );
    } catch (error) {
      console.error(error);
      // Use sample data on error
      setRevenueTrend(sampleRevenueTrendData);
      // alert('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !dashboardData) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Dashboard</h1>
            <p>You can add your credit and debit card details here for future purchases.</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>No data available</div>
      </div>
    );
  }

  const { revenue, bestSellers, orderStats, customerStats } = dashboardData;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Dashboard</h1>
          <p>You can add your credit and debit card details here for future purchases.</p>
        </div>
        <button onClick={fetchDashboard} disabled={loading} className={styles.refreshBtn}>
          <RefreshCw
            size={18}
            style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
          />
          Refresh
        </button>
      </div>

      {/* Overall Sales & Stat Cards Row */}
      <div className={styles.chartAndStats}>
        {/* Overall Sales Chart - 2/3 */}
        <OverallSalesCard chartData={revenueTrend} loading={loading} />

        {/* Stat Cards - 1/3 */}
        <div className={styles.statCardsGrid}>
          <StatCard
            icon={CreditCard}
            label="Total Sales"
            value={formatCurrency(revenue?.total || 0)}
            trend="13.02%"
            trendUp={true}
            fromLabel="From Jan"
          />
          <StatCard
            icon={ShoppingCart}
            label="Avg. Order Value"
            value={formatCurrency(
              orderStats?.total > 0 ? (revenue?.total || 0) / orderStats?.total : 0
            )}
            trend="3.02%"
            trendUp={false}
            fromLabel="From Jan"
          />
          <StatCard
            icon={Zap}
            label="Online Sessions"
            value={`${(orderStats?.total || 0).toLocaleString('vi-VN')} orders`}
            trend="9.58%"
            trendUp={true}
            fromLabel="From Jan"
          />
          <StatCard
            icon={BarChart3}
            label="Conversion Rate"
            value={`${(customerStats?.repeatedPurchaseRate || 0).toFixed(2)}%`}
            trend="0.35%"
            trendUp={false}
            fromLabel="From Jan"
          />
        </div>
      </div>

      {/* Selling Products Table */}
      <ProductsTable products={bestSellers} loading={loading} />
    </div>
  );
};

export default SellerDashboard;
