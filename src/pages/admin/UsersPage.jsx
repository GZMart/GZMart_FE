import { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, message, Popconfirm } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import * as userService from '@services/api/userService';
import styles from '@assets/styles/admin/UsersPage.module.css';

const { Option } = Select;

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    role: undefined,
    isActive: undefined,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
      setPagination((prev) => ({ ...prev, current: 1 }));
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers({
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      });

      const data = response.data || response;
      setUsers(data.users || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.totalUsers || 0,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, current: 1 });
  };

  const handleBanToggle = async (userId, currentIsActive) => {
    try {
      await userService.toggleUserBan(userId);
      const action = currentIsActive ? 'banned' : 'unbanned';
      message.success(`User ${action} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling ban status:', error);
      message.error('Failed to update user ban status');
    }
  };

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      responsive: ['md'],
      render: (avatar, record) => (
        <img
          src={avatar || record.profileImage || 'https://via.placeholder.com/40'}
          alt={record.fullName}
          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
        />
      ),
    },
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['sm'],
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : role === 'seller' ? 'blue' : 'green'}>
          {role?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['lg'],
      render: (phone) => phone || 'N/A',
    },
    {
      title: 'Ban Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      responsive: ['sm'],
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Banned'}</Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      responsive: ['lg'],
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => {
        // Cannot ban/unban admin users
        if (record.role === 'admin') {
          return null;
        }

        const isBanned = !record.isActive;
        return (
          <Popconfirm
            title={isBanned ? 'Unban this user?' : 'Ban this user?'}
            description={
              isBanned
                ? 'Are you sure you want to unban this user?'
                : 'Are you sure you want to ban this user?'
            }
            onConfirm={() => handleBanToggle(record._id, record.isActive)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: !isBanned }}
          >
            <Button
              type={isBanned ? 'primary' : 'default'}
              danger={!isBanned}
              icon={isBanned ? <CheckCircleOutlined /> : <StopOutlined />}
              size="small"
            >
              {isBanned ? 'Unban' : 'Ban'}
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div className={styles.usersPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <i className="bi bi-people" />
          </div>
          <div>
            <h1>User Management</h1>
            <p className={styles.subtitle}>Manage buyers, sellers and admins</p>
          </div>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={fetchUsers}
          style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
        >
          Refresh
        </Button>
      </div>

      {/* Table card */}
      <div className={styles.tableWrap}>
        {/* Filter bar */}
        <div className={styles.filterBar}>
          <Input
            placeholder="Search by name or email"
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            allowClear
            value={searchInput}
            onChange={handleSearchChange}
            style={{ width: 280 }}
          />
          <Select
            placeholder="Filter by role"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => handleFilterChange('role', value)}
          >
            <Option value="buyer">Buyer</Option>
            <Option value="seller">Seller</Option>
            <Option value="admin">Admin</Option>
          </Select>
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => handleFilterChange('isActive', value)}
          >
            <Option value="true">Active</Option>
            <Option value="false">Banned</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey="_id"
          scroll={{ x: 1200 }}
        />
      </div>
    </div>
  );
};

export default UsersPage;
