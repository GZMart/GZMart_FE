import { useState, useEffect } from 'react';
import { CreditCard, ShoppingCart, Zap, BarChart3, RefreshCw, TrendingUp, DollarSign } from 'lucide-react';
import dashboardService from '../../services/api/dashboardService';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../assets/styles/seller/Dashboard.module.css';
import { OverallSalesCard } from '../../components/seller/dashboard/OverallSalesCard';
import { StatCard } from '../../components/seller/dashboard/StatCard';
import { ProductsTable } from '../../components/seller/dashboard/ProductsTable';

const SellerDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('monthly');
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [profitLossData, setProfitLossData] = useState([]);
  const [expenseData, setExpenseData] = useState(null);

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

  // Fetch all dashboard data including P&L analytics
  const fetchDashboard = async (selectedPeriod = 'monthly') => {
    try {
      setLoading(true);
      const [dashResponse, trendResponse, profitLossResponse, expenseResponse] = await Promise.all([
        dashboardService.getComplete(),
        dashboardService.getRevenueTrend({ period: selectedPeriod }),
        dashboardService.getProfitLossAnalysis({ period: selectedPeriod }),
        dashboardService.getExpenseAnalysis({ period: selectedPeriod }),
      ]);

      setDashboardData(dashResponse.data);
      setRevenueTrend(trendResponse.data && trendResponse.data.length > 0 ? trendResponse.data : sampleRevenueTrendData);
      setProfitLossData(profitLossResponse.data || []);
      setExpenseData(expenseResponse.data || null);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setRevenueTrend(sampleRevenueTrendData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle period change
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    fetchDashboard(newPeriod);
  };

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

  // Calculate totals from profit-loss data
  const totalProfit = profitLossData.reduce((sum, item) => sum + (item.profit || 0), 0);
  const totalCost = profitLossData.reduce((sum, item) => sum + (item.cost || 0), 0);
  const totalRevenue = profitLossData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0;

  return (
    <div className={styles.container}>
      {/* Header with Period Filter Buttons */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Dashboard</h1>
          <p>You can add your credit and debit card details here for future purchases.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Period Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f5f5f5', padding: '4px', borderRadius: '6px' }}>
            {['weekly', 'monthly', 'quarterly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: period === p ? '2px solid #1890ff' : '1px solid #ddd',
                  backgroundColor: period === p ? '#e6f7ff' : '#fff',
                  color: period === p ? '#1890ff' : '#666',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: period === p ? '600' : '500',
                  transition: 'all 0.2s ease',
                }}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => fetchDashboard(period)}
            disabled={loading}
            className={styles.refreshBtn}
          >
            <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
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

      {/* Profit & Loss Analytics Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '16px',
        marginTop: '24px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <DollarSign size={20} style={{ color: '#10b981', marginRight: '8px' }} />
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Gross Profit</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: totalProfit >= 0 ? '#10b981' : '#ef4444' }}>
            {formatCurrency(totalProfit)}
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            Period: {period}
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <ShoppingCart size={20} style={{ color: '#3b82f6', marginRight: '8px' }} />
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Total Cost</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
            {formatCurrency(totalCost)}
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            (COGS + Shipping)
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <TrendingUp size={20} style={{ color: '#f59e0b', marginRight: '8px' }} />
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Profit Margin</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {profitMargin}%
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            of revenue
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <DollarSign size={20} style={{ color: '#8b5cf6', marginRight: '8px' }} />
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Total Revenue</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {formatCurrency(totalRevenue)}
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            from sales
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      {expenseData && (
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Expense Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '14px', color: '#666' }}>Product Cost (COGS)</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6', marginTop: '4px' }}>
                {formatCurrency(expenseData.totalProductCost || 0)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: '#666' }}>Shipping Cost</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>
                {formatCurrency(expenseData.totalShippingCost || 0)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: '#666' }}>Total Expense</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444', marginTop: '4px' }}>
                {formatCurrency(expenseData.totalExpense || 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selling Products Table */}
      <ProductsTable products={bestSellers} loading={loading} />
    </div>
  );
};

export default SellerDashboard;
