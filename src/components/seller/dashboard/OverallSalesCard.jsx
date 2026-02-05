import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import styles from '../../../assets/styles/seller/Dashboard.module.css';

export function OverallSalesCard({ chartData = [], loading = false }) {
  return (
    <div className={styles.chartCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 className={styles.chartCardTitle}>Overall Sales</h3>
        <button className={styles.dateButton}>
          <Calendar size={16} />
          This Month
        </button>
      </div>
      
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
          <div className={styles.salesValue}>
            {chartData.length > 0 ? formatCurrency(chartData[chartData.length - 1].revenue || 0) : formatCurrency(0)}
          </div>
          <span className={styles.trendup}>
            <TrendingUp size={16} style={{ display: 'inline-block', marginRight: '4px' }} />
            +13.02%
          </span>
        </div>
      </div>

      <div className={styles.chartContainer}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" vertical={false} />
              <XAxis 
                dataKey="_id" 
                tick={{ fontSize: 12, fill: '#999' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#999' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid #e8e8e8',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#1890ff"
                strokeWidth={3}
                dot={{ fill: '#1890ff', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#999' }}>
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
