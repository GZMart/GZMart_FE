import { Table, Tag, Tooltip, Dropdown, Button } from 'antd';
import { EditOutlined, DeleteOutlined, EllipsisOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from '@assets/styles/seller/FlashSales.module.css';

const statusConfig = {
  pending: { color: 'blue', label: 'Upcoming' },
  upcoming: { color: 'blue', label: 'Upcoming' },
  active: { color: 'green', label: 'Active' },
  ended: { color: 'default', label: 'Ended' },
  expired: { color: 'default', label: 'Ended' },
  cancelled: { color: 'red', label: 'Cancelled' },
};

// Campaign-level (parent) columns
const campaignColumns = (handleViewCampaign, handleEditCampaign, handleDeleteCampaign) => [
  {
    title: 'Campaign',
    key: 'campaign',
    width: 240,
    sorter: (a, b) => {
      const aName = a.campaignTitle || a.productId?.name || '';
      const bName = b.campaignTitle || b.productId?.name || '';
      return aName.localeCompare(bName);
    },
    showSorterTooltip: false,
    render: (_, group) => (
      <div className={styles.campaignRow}>
        <div className={styles.campaignImage}>
          {group.productId?.images?.[0] ? (
            <img src={group.productId.images[0]} alt={group.productId?.name || 'product'} loading="lazy" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          )}
        </div>
        <div className={styles.campaignInfo}>
          <span className={styles.campaignName}>{group.campaignTitle || group.productId?.name}</span>
          {group.campaignTitle && <span className={styles.campaignProduct}>{group.productId?.name}</span>}
          <span className={styles.skuTag}>{group.skuCount} SKU{group.skuCount > 1 ? 's' : ''}</span>
        </div>
      </div>
    ),
  },
  {
    title: 'Price',
    key: 'price',
    width: 150,
    sorter: (a, b) => (a.salePrice ?? 0) - (b.salePrice ?? 0),
    showSorterTooltip: false,
    render: (_, group) => (
      <div className={styles.priceColumn}>
        <div className={styles.salePrice}>
          {group.salePrice === group.salePriceMax
            ? `${group.salePrice?.toLocaleString('vi-VN')} ₫`
            : `${group.salePrice?.toLocaleString('vi-VN')} – ${group.salePriceMax?.toLocaleString('vi-VN')} ₫`}
        </div>
        <div className={styles.originalPrice}>{group.productId?.originalPrice?.toLocaleString('vi-VN')} ₫</div>
      </div>
    ),
  },
  {
    title: 'Qty / Sold',
    key: 'quantity',
    width: 160,
    sorter: (a, b) => (a.soldQuantity ?? 0) - (b.soldQuantity ?? 0),
    showSorterTooltip: false,
    render: (_, group) => {
      const pct = group.totalQuantity ? Math.round((group.soldQuantity / group.totalQuantity) * 100) : 0;
      return (
        <div className={styles.quantityColumn}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className={styles.sold}>
              Sold: <span style={{ color: '#e84949', fontWeight: 700 }}>{group.soldQuantity}</span>
            </span>
            <span style={{ fontSize: 11, color: pct > 70 ? '#059669' : pct > 30 ? '#d97706' : '#94a3b8', fontWeight: 700 }}>
              {pct}%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 3 }}>
            <span>Total: {group.totalQuantity?.toLocaleString('vi-VN')}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progress} ${group.status === 'ended' || group.status === 'cancelled' ? styles.progressEnded : ''}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    title: 'Time',
    key: 'time',
    width: 180,
    sorter: (a, b) => new Date(a.startAt) - new Date(b.startAt),
    showSorterTooltip: false,
    render: (_, group) => {
      const now = dayjs();
      const endTime = dayjs(group.endAt);
      const startTime = dayjs(group.startAt);
      const isActive = group.status === 'active';
      const isUpcoming = group.status === 'upcoming' || group.status === 'pending';

      let countdownLabel = '';
      let countdownClass = '';

      if (isActive) {
        const diff = endTime.diff(now);
        if (diff > 0) {
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          countdownLabel = d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
          countdownClass = styles.countdownActive;
        } else {
          countdownLabel = 'Ending…';
          countdownClass = styles.countdownActive;
        }
      } else if (isUpcoming) {
        const diff = startTime.diff(now);
        if (diff > 0) {
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          countdownLabel = d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
          countdownClass = styles.countdownUpcoming;
        }
      }

      return (
        <div className={styles.timeColumn}>
          <div>
            <span className={styles.timeLabel}>End</span>{' '}
            {isActive && countdownLabel ? (
              <span className={`${styles.countdownTimer} ${countdownClass}`}>{countdownLabel}</span>
            ) : (
              <span style={{ fontWeight: 600, color: '#475569' }}>{endTime.format('DD/MM HH:mm')}</span>
            )}
          </div>
          <div>
            <span className={styles.timeLabel}>Start</span>{' '}
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{startTime.format('DD/MM HH:mm')}</span>
          </div>
        </div>
      );
    },
  },
  {
    title: 'Status',
    key: 'status',
    width: 120,
    sorter: (a, b) => {
      const order = { active: 0, upcoming: 1, pending: 2, ended: 3, cancelled: 4, expired: 5 };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    },
    showSorterTooltip: false,
    render: (_, group) => {
      const s = group.status;
      const label = statusConfig[s]?.label || s;
      if (s === 'active') {
return <span className={styles.statusActive}><span className={styles.statusDot} />Active</span>;
}
      if (s === 'pending' || s === 'upcoming') {
return <span className={styles.statusUpcoming}>{label}</span>;
}
      if (s === 'cancelled') {
return <span className={styles.statusCancelled}>{label}</span>;
}
      return <span className={styles.statusEnded}>{label}</span>;
    },
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 120,
    fixed: 'right',
    align: 'center',
    render: (_, group) => (
      <div className={styles.rowActions}>
        <Tooltip title="View">
          <button className={styles.actionBtn} onClick={(e) => {
 e?.stopPropagation(); handleViewCampaign(group); 
}}>
            <EyeOutlined />
          </button>
        </Tooltip>
        <Tooltip title="Edit">
          <button className={styles.actionBtn} onClick={(e) => {
 e?.stopPropagation(); handleEditCampaign(group); 
}}>
            <EditOutlined />
          </button>
        </Tooltip>
        <Tooltip title="Delete">
          <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={(e) => {
 e?.stopPropagation(); handleDeleteCampaign(group); 
}}>
            <DeleteOutlined />
          </button>
        </Tooltip>
      </div>
    ),
  },
];

// Variant-level (child) columns shown when expanding a campaign row
const variantColumns = (handleEdit, handleDelete) => [
  {
    title: 'SKU',
    dataIndex: 'variantSku',
    key: 'sku',
    width: 160,
    render: (sku) => (sku ? <Tag>{sku}</Tag> : <span style={{ color: '#aaa' }}>—</span>),
  },
  {
    title: 'Sale Price',
    key: 'price',
    width: 140,
    render: (_, r) => (
      <div className={styles.priceColumn}>
        <div className={styles.salePrice}>{r.salePrice?.toLocaleString('vi-VN')} ₫</div>
        <div className={styles.originalPrice}>{r.originalPrice?.toLocaleString('vi-VN')}</div>
      </div>
    ),
  },
  {
    title: 'Quantity',
    key: 'quantity',
    width: 140,
    render: (_, r) => (
      <div className={styles.quantityColumn}>
        <span className={styles.sold}>{r.soldQuantity} / {r.totalQuantity}</span>
        <div className={styles.progressBar}>
          <div className={styles.progress} style={{ width: `${r.totalQuantity ? (r.soldQuantity / r.totalQuantity) * 100 : 0}%` }} />
        </div>
      </div>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 110,
    render: (status) => {
      const cfg = statusConfig[status] || { color: 'default', label: status };
      return <Tag color={cfg.color}>{cfg.label}</Tag>;
    },
  },
  {
    title: '',
    key: 'actions',
    width: 60,
    align: 'center',
    render: (_, r) => (
      <Dropdown
        menu={{
          items: [
            { key: 'edit', icon: <EditOutlined />, label: 'Edit', onClick: () => handleEdit(r) },
            { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true, onClick: () => handleDelete(r._id) },
          ],
        }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Button type="text" icon={<EllipsisOutlined />} onClick={(e) => e.stopPropagation()} />
      </Dropdown>
    ),
  },
];

const CampaignTable = ({ groupedFlashSales, pagination, loading, campaignColumns, variantColumns, handleTableChange, handleViewCampaign, handleViewDetail }) => (
    <div className={styles.tableSection}>
      <Table
        columns={campaignColumns}
        dataSource={groupedFlashSales}
        rowKey="key"
        className={styles.fsTable}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: groupedFlashSales.length,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} campaigns`,
          style: { padding: '12px 16px', margin: 0 },
        }}
        onChange={handleTableChange}
        size="middle"
        onRow={(group) => ({ onClick: () => handleViewCampaign(group), style: { cursor: 'pointer' } })}
        expandable={{
          expandedRowRender: (group) => (
            <div className={styles.expandedContent}>
              <Table
                columns={variantColumns}
                dataSource={group.records}
                rowKey="_id"
                pagination={false}
                size="small"
                onRow={(record) => ({ onClick: () => handleViewDetail(record), style: { cursor: 'pointer' } })}
              />
            </div>
          ),
          rowExpandable: (group) => group.skuCount > 1,
        }}
      />
    </div>
  );

export { campaignColumns, variantColumns, CampaignTable, statusConfig };
