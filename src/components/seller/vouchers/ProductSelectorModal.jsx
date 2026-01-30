import React, { useState, useEffect } from 'react';
import { Modal, Table, Input, Avatar, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import productService from '@services/api/productService'; // Import real service

const ProductSelectorModal = ({ visible, onCancel, onConfirm, initialSelectedIds = [] }) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState(initialSelectedIds);
    const [searchText, setSearchText] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch products from API
    const fetchProducts = async (query = '') => {
        try {
            setLoading(true);
            const params = {
                page: 1,
                limit: 50, // Get enough products for selection
                q: query
            };
            const response = await productService.getMyProducts(params); // Use getMyProducts

            // Handle different response structures (pagination vs array)
            const list = response.data?.products || response.data || response.products || [];
            setProducts(list);
        } catch (error) {
            console.error('Fetch products failed:', error);
            // message.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    // Sync initial selection & Fetch on Open
    useEffect(() => {
        if (visible) {
            setSelectedRowKeys(initialSelectedIds);
            setSearchText('');
            fetchProducts();
        }
    }, [visible, initialSelectedIds]);

    // Handle Search with Debounce (simplified)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (visible) {
fetchProducts(searchText);
}
        }, 500);
        return () => clearTimeout(timer);
    }, [searchText, visible]);

    const handleSearch = (e) => {
        setSearchText(e.target.value);
    };

    // Table Columns
    const columns = [
        {
            title: 'Product Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar shape="square" size={48} src={record.images?.[0] || 'https://via.placeholder.com/48'} />
                    <div>
                        <div style={{ fontWeight: 500, lineHeight: '1.2' }}>{text}</div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                            SKU: {record.models?.[0]?.sku || 'N/A'}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: 150,
            render: (text, record) => {
                const price = record.models?.[0]?.price || record.originalPrice || 0;
                return `₫${Number(price).toLocaleString()}`;
            },
        },
        {
            title: 'Stock',
            key: 'stock',
            width: 100,
            render: (text, record) => {
                // Calculate total stock from models if not present
                if (record.totalStock !== undefined) {
return record.totalStock;
}
                return record.models?.reduce((sum, m) => sum + (m.stock || 0), 0) || 0;
            },
        },
    ];

    // Row Selection Config
    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys) => {
            setSelectedRowKeys(newSelectedRowKeys);
        },
        preserveSelectedRowKeys: true,
    };

    const handleOk = () => {
        const selectedItems = products.filter(p => selectedRowKeys.includes(p._id));
        onConfirm(selectedItems); // Pass full product objects
    };

    return (
        <Modal
            title="Select Products"
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            width={800}
            okText="Confirm"
            cancelText="Cancel"
            styles={{ body: { padding: '24px' } }}
            destroyOnHidden
        >
            <div style={{ marginBottom: '16px' }}>
                <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search Product Name, SKU"
                    value={searchText}
                    onChange={handleSearch}
                    allowClear
                    style={{ maxWidth: 300 }}
                />
                <span style={{ marginLeft: '12px', color: '#8c8c8c' }}>
                    {selectedRowKeys.length} product(s) selected
                </span>
            </div>

            <Table
                rowSelection={{
                    type: 'checkbox',
                    ...rowSelection,
                }}
                columns={columns}
                dataSource={products}
                rowKey="_id" // IMPORTANT: Use _id from MongoDB
                loading={loading}
                pagination={{ pageSize: 5, showSizeChanger: false }}
                size="small"
                scroll={{ y: 400 }}
            />
        </Modal>
    );
};

export default ProductSelectorModal;
