import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
  createContext,
  useRef,
} from 'react';
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Popconfirm,
  message,
  Tooltip,
  Space,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
  AppstoreOutlined,
  CaretRightOutlined,
  CaretDownOutlined,
  MinusSquareOutlined,
  PlusSquareOutlined,
  SearchOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  CloseCircleFilled,
  HolderOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { categoryService } from '../../services/api/categoryService';
import CloudinaryUpload from '../../components/common/CloudinaryUpload';
import axiosClient from '../../services/axiosClient';
import styles from '../../assets/styles/admin/CategoriesPage.module.css';

const { TextArea } = Input;

/* ─── BoolToggle — replaces Switch in form ──────────────── */
const BoolToggle = ({ value, onChange, trueLabel, falseLabel, trueColor }) => {
  const colors = {
    green: { bg: '#16a34a', shadow: 'rgba(22,163,74,.25)' },
    amber: { bg: '#d97706', shadow: 'rgba(217,119,6,.25)' },
  };
  const c = colors[trueColor] || colors.green;
  return (
    <div
      style={{
        display: 'flex',
        background: '#f3f4f6',
        borderRadius: 9,
        padding: 3,
        gap: 2,
        width: '100%',
      }}
    >
      {[
        { val: false, label: falseLabel },
        { val: true, label: trueLabel },
      ].map(({ val, label }) => {
        const active = value === val;
        const isTrue = val === true;
        return (
          <button
            key={String(val)}
            type="button"
            onClick={() => onChange(val)}
            style={{
              flex: 1,
              padding: '7px 0',
              border: 'none',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all .18s',
              background: active ? (isTrue ? c.bg : '#6b7280') : 'rgba(255,255,255,0.7)',
              color: active ? '#fff' : '#374151',
              boxShadow: active
                ? `0 2px 8px ${isTrue ? c.shadow : 'rgba(107,114,128,.3)'}`
                : 'none',
              letterSpacing: '.2px',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

/* ─── helpers ────────────────────────────────────────────── */
const flattenTree = (list, result = []) => {
  list.forEach((cat) => {
    result.push(cat);
    if (cat.children?.length > 0) {
      flattenTree(cat.children, result);
    }
  });
  return result;
};

const prepareTree = (list, depth = 0) =>
  list.map((cat) => ({
    ...cat,
    key: cat._id,
    _depth: depth,
    children: cat.children?.length > 0 ? prepareTree(cat.children, depth + 1) : undefined,
  }));

const sortTree = (list, compareFn) =>
  [...list].sort(compareFn).map((node) => ({
    ...node,
    children: node.children ? sortTree(node.children, compareFn) : undefined,
  }));

// Only name sort remains (no order sort — order is controlled by drag)
const SORT_OPTIONS = [
  { value: 'none', label: 'Default order' },
  { value: 'name-asc', label: 'A → Z' },
  { value: 'name-desc', label: 'Z → A' },
];

/* ─── DnD row context ───────────────────────────────────────── */
const DragHandleContext = createContext({});
const RootIdsContext = createContext(new Set());

/* ─── DnD Sortable Row — only for root-level rows ────────── */
const SortableRootRow = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-row-key'],
  });
  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : undefined,
  };
  return (
    <DragHandleContext.Provider value={{ attributes, listeners }}>
      <tr {...props} ref={setNodeRef} style={style} />
    </DragHandleContext.Provider>
  );
};

/* ─── Smart row — delegates to sortable or plain ─────────── */
const SortableRow = (props) => {
  const rootIds = useContext(RootIdsContext);
  const rowKey = props['data-row-key'];
  if (rootIds.has(rowKey)) {
    return <SortableRootRow {...props} />;
  }
  // Sub-category rows: plain tr, no DnD interference
  return (
    <DragHandleContext.Provider value={{}}>
      <tr {...props} />
    </DragHandleContext.Provider>
  );
};

/* ─── Drag Handle ────────────────────────────────────────── */
const DragHandle = () => {
  const { attributes, listeners } = useContext(DragHandleContext);
  return (
    <button
      {...attributes}
      {...listeners}
      className={styles.dragHandle}
      title="Drag to reorder"
      type="button"
      aria-label="Drag handle"
    >
      <HolderOutlined />
    </button>
  );
};

/* ─── component ──────────────────────────────────────────── */
const CategoriesPage = () => {
  const [rawCategories, setRawCategories] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const isFirstLoad = useRef(true);

  // Search / filter / sort
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('none');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const watchedParentId = Form.useWatch('parentId', form);

  // DnD sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  /* ------ data ------ */
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoryService.getTree(true); // admin: include all statuses
      if (response.success) {
        const data = response.data || [];
        setRawCategories(data);
        setTreeData(prepareTree(data));
        // Only expand all on initial load — don't reset user's expand state on refresh
        if (isFirstLoad.current) {
          setExpandedKeys(data.map((c) => c._id));
          isFirstLoad.current = false;
        }
      }
    } catch {
      message.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /* ------ derived ------ */
  const flat = useMemo(() => flattenTree(rawCategories), [rawCategories]);
  const totalCount = flat.length;
  const activeCount = flat.filter((c) => c.status === 'active').length;
  const inactiveCount = totalCount - activeCount;
  const isFiltering = search.trim() !== '' || statusFilter !== 'all';
  const isDragDisabled = isFiltering || sortKey !== 'none';

  const compareFn = useMemo(() => {
    switch (sortKey) {
      case 'name-asc':
        return (a, b) => a.name.localeCompare(b.name);
      case 'name-desc':
        return (a, b) => b.name.localeCompare(a.name);
      default:
        return null;
    }
  }, [sortKey]);

  const displayData = useMemo(() => {
    if (isFiltering) {
      const q = search.trim().toLowerCase();
      const filtered = flat
        .filter((cat) => {
          const matchSearch =
            !q ||
            cat.name.toLowerCase().includes(q) ||
            (cat.slug || '').toLowerCase().includes(q) ||
            (cat.description || '').toLowerCase().includes(q);
          const matchStatus = statusFilter === 'all' || cat.status === statusFilter;
          return matchSearch && matchStatus;
        })
        .map((cat) => ({ ...cat, key: cat._id, _depth: 0, children: undefined }));
      return compareFn ? [...filtered].sort(compareFn) : filtered;
    }
    return compareFn ? sortTree(treeData, compareFn) : treeData;
  }, [isFiltering, flat, search, statusFilter, compareFn, treeData]);

  // All IDs for DnD — enables drag for both root and sub-categories
  const allSortableIds = useMemo(
    () => (isDragDisabled || isFiltering ? [] : flattenTree(treeData).map((c) => c.key)),
    [isDragDisabled, isFiltering, treeData]
  );

  // Set of root-level keys — used by SortableRow to decide DnD vs plain row
  const rootIdsSet = useMemo(() => new Set(treeData.map((c) => c.key)), [treeData]);

  /* ------ drag helpers ------ */
  const findParentInTree = useCallback(
    (id) => {
      for (const root of treeData) {
        if (root.children?.some((c) => c.key === id)) {
          return root;
        }
      }
      return null;
    },
    [treeData]
  );

  /* ------ drag handlers ------ */
  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) {
      return;
    }

    const activeIsRoot = treeData.some((c) => c.key === active.id);
    const overIsRoot = treeData.some((c) => c.key === over.id);

    if (activeIsRoot && overIsRoot) {
      // ── Root-level reordering ──────────────────────────────────────
      const oldIndex = treeData.findIndex((c) => c.key === active.id);
      const newIndex = treeData.findIndex((c) => c.key === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const newTree = arrayMove(treeData, oldIndex, newIndex);
      setTreeData(newTree);

      const items = newTree.map((cat, i) => ({ id: cat._id, order: i + 1 }));
      try {
        setSaving(true);
        await axiosClient.patch('/api/categories/reorder', { items });
        message.success('Order saved!');
        setRawCategories((prev) => {
          const newRaw = [...prev];
          items.forEach(({ id, order }) => {
            const cat = newRaw.find((c) => c._id === id);
            if (cat) {
              cat.order = order;
            }
          });
          return newRaw;
        });
      } catch {
        message.error('Failed to save order — reverting');
        fetchCategories();
      } finally {
        setSaving(false);
      }
    } else if (!activeIsRoot && !overIsRoot) {
      // ── Sub-category reordering (within same parent) ───────────────
      const activeParent = findParentInTree(active.id);
      const overParent = findParentInTree(over.id);
      if (!activeParent || !overParent || activeParent.key !== overParent.key) {
        return;
      }

      const siblings = activeParent.children;
      const oldIndex = siblings.findIndex((c) => c.key === active.id);
      const newIndex = siblings.findIndex((c) => c.key === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const newSiblings = arrayMove(siblings, oldIndex, newIndex);
      setTreeData((prev) =>
        prev.map((root) =>
          root.key !== activeParent.key ? root : { ...root, children: newSiblings }
        )
      );

      const items = newSiblings.map((cat, i) => ({ id: cat._id, order: i + 1 }));
      try {
        setSaving(true);
        await axiosClient.patch('/api/categories/reorder', { items });
        message.success('Sub-category order saved!');
      } catch {
        message.error('Failed to save order — reverting');
        fetchCategories();
      } finally {
        setSaving(false);
      }
    }
    // Cross-level drag: ignore silently
  };

  const allKeys = flat.map((c) => c._id);
  const allExpanded = expandedKeys.length === allKeys.length;
  const hasFilters = search || statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  /* ------ modal ------ */
  const handleOpenModal = (category = null) => {
    if (category) {
      setEditMode(true);
      setCurrentCategory(category);
      form.setFieldsValue({
        name: category.name || '',
        description: category.description || '',
        parentId: category.parentId
          ? typeof category.parentId === 'object'
            ? category.parentId._id
            : category.parentId
          : null,
        slug: category.slug || '',
        image: category.image || '',
        displayOrder: category.order ?? category.displayOrder ?? 0,
        isActive: category.status ? category.status === 'active' : true,
        isFeatured: category.isFeatured ?? false,
      });
    } else {
      setEditMode(false);
      setCurrentCategory(null);
      form.resetFields();
      form.setFieldsValue({ isActive: true, isFeatured: false, displayOrder: 0 });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        name: values.name,
        description: values.description || '',
        image: values.image || '',
        order: Number(values.displayOrder) || 0,
        status: values.isActive ? 'active' : 'inactive',
        isFeatured: values.isFeatured ?? false,
        parentId: values.parentId || null,
      };
      if (values.slug?.trim()) {
        payload.slug = values.slug.trim();
      }

      if (editMode && currentCategory) {
        await categoryService.update(currentCategory._id, payload);
        message.success('Category updated!');
      } else {
        await categoryService.create(payload);
        message.success('Category created!');
      }
      fetchCategories();
      handleCloseModal();
    } catch (err) {
      if (err?.errorFields) {
        return;
      }
      message.error(err?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat) => {
    try {
      await categoryService.delete(cat._id);
      message.success(`"${cat.name}" deleted`);
      fetchCategories();
    } catch (err) {
      message.error(err?.message || 'Cannot delete category');
    }
  };

  /* ------ add sub-category shortcut ------ */
  const handleAddSubcategory = (parentRecord) => {
    setEditMode(false);
    setCurrentCategory(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      isFeatured: false,
      displayOrder: 0,
      parentId: parentRecord._id,
    });
    setShowModal(true);
  };

  /* ------ columns ------ */
  const columns = [
    {
      key: 'drag',
      width: 36,
      render: (_, record) =>
        !isDragDisabled ? <DragHandle /> : <span className={styles.dragPlaceholder} />,
    },
    {
      title: 'Category',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className={styles.nameCellInner}>
          <span
            className={`${styles.depthDot} ${styles[`depth${Math.min(record._depth ?? 0, 2)}`]}`}
          />
          <TagsOutlined className={styles.catIconDefault} />
          <span className={(record._depth ?? 0) === 0 ? styles.nameRoot : styles.nameChild}>
            {name}
          </span>
          {record.children && !isFiltering && (
            <span className={styles.childCount}>{record.children.length} sub</span>
          )}
        </div>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      width: 200,
      render: (slug) => <code className={styles.slugCode}>{slug}</code>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc) => desc || <span className={styles.empty}>—</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status) =>
        status === 'active' ? (
          <Badge status="success" text="Active" />
        ) : (
          <Badge status="default" text="Inactive" />
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 116,
      align: 'right',
      render: (_, record) => {
        const depth = record._depth ?? 0;
        const canAddSub = depth < 2; // backend caps at level 3
        return (
          <Space size={4}>
            {canAddSub && (
              <Tooltip title={`Add sub-category under "${record.name}"`} placement="top">
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  className={styles.btnAddSub}
                  onClick={() => handleAddSubcategory(record)}
                />
              </Tooltip>
            )}
            <Tooltip title="Edit" placement="top">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                className={styles.btnEdit}
                onClick={() => handleOpenModal(record)}
              />
            </Tooltip>
            <Popconfirm
              title={`Delete "${record.name}"?`}
              description={
                record.children ? 'Remove sub-categories first.' : 'This cannot be undone.'
              }
              onConfirm={() => handleDelete(record)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              disabled={!!record.children}
            >
              <Tooltip
                title={record.children ? 'Remove sub-categories first' : 'Delete'}
                placement="top"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  className={styles.btnDelete}
                  danger
                  disabled={!!record.children}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const excludedIds = useMemo(() => {
    const ids = new Set([currentCategory?._id]);
    const walk = (list) =>
      list?.forEach((c) => {
        ids.add(c._id);
        walk(c.children);
      });
    walk(currentCategory?.children ? [currentCategory] : []);
    return ids;
  }, [currentCategory]);
  const parentOptions = flat.filter((c) => !excludedIds.has(c._id));

  const activeCat = activeId ? flattenTree(treeData).find((c) => c.key === activeId) : null;

  /* ------ render ------ */
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <AppstoreOutlined />
          </div>
          <div>
            <h2 className={styles.h2}>Category Management</h2>
            <p className={styles.subtitle}>Manage product categories &amp; hierarchy</p>
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className={styles.btnAdd}
          onClick={() => handleOpenModal()}
        >
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        {[
          { label: 'Total', value: totalCount, cls: 'statTotal' },
          { label: 'Active', value: activeCount, cls: 'statActive' },
          { label: 'Inactive', value: inactiveCount, cls: 'statInactive' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`${styles.statCard} ${styles[cls]}`}>
            <span className={styles.statNum}>{value}</span>
            <span className={styles.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        {/* Toolbar */}
        <div className={styles.tableToolbar}>
          <div className={styles.filterBar}>
            <Input
              prefix={<SearchOutlined className={styles.searchIcon} />}
              placeholder="Search name, slug, description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              className={styles.searchInput}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className={styles.filterSelect}
              suffixIcon={<FilterOutlined />}
              options={[
                { value: 'all', label: 'All status' },
                { value: 'active', label: 'Active only' },
                { value: 'inactive', label: 'Inactive only' },
              ]}
            />
            <Select
              value={sortKey}
              onChange={setSortKey}
              className={styles.filterSelect}
              suffixIcon={<SortAscendingOutlined />}
              options={SORT_OPTIONS}
            />
            {hasFilters && (
              <Button
                type="text"
                icon={<CloseCircleFilled />}
                onClick={clearFilters}
                className={styles.btnClear}
              >
                Clear
              </Button>
            )}
          </div>

          <div className={styles.toolbarRight}>
            {saving && <span className={styles.savingBadge}>Saving…</span>}
            {isDragDisabled && !saving && (
              <span className={styles.dndHint}>Clear filters to enable drag</span>
            )}
            {!isDragDisabled && !isFiltering && (
              <Button
                size="small"
                type="text"
                icon={allExpanded ? <MinusSquareOutlined /> : <PlusSquareOutlined />}
                onClick={() => setExpandedKeys(allExpanded ? [] : allKeys)}
                className={styles.btnToggleAll}
              >
                {allExpanded ? 'Collapse all' : 'Expand all'}
              </Button>
            )}
            {isFiltering && (
              <span className={styles.resultCount}>
                {displayData.length} result{displayData.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* DnD wrapper — only active when not filtering, sort=none */}
        <RootIdsContext.Provider value={isDragDisabled ? new Set() : rootIdsSet}>
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={allSortableIds} strategy={verticalListSortingStrategy}>
              <Table
                columns={columns}
                dataSource={displayData}
                rowKey="key"
                loading={loading}
                pagination={false}
                components={!isDragDisabled ? { body: { row: SortableRow } } : undefined}
                expandable={
                  isFiltering
                    ? undefined
                    : {
                        expandedRowKeys: expandedKeys,
                        onExpandedRowsChange: setExpandedKeys,
                        expandIcon: ({ expanded, onExpand, record, expandable: isExp }) =>
                          isExp ? (
                            <button
                              className={`${styles.expandBtn} ${expanded ? styles.expandBtnOpen : ''}`}
                              onClick={(e) => onExpand(record, e)}
                              aria-label={expanded ? 'Collapse' : 'Expand'}
                            >
                              {expanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                            </button>
                          ) : (
                            <span className={styles.expandPlaceholder} />
                          ),
                        indentSize: 20,
                      }
                }
                rowClassName={(record) =>
                  (record._depth ?? 0) === 0 ? styles.rowRoot : styles.rowChild
                }
                locale={{
                  emptyText: isFiltering
                    ? `No categories match "${search}"${statusFilter !== 'all' ? ` (${statusFilter})` : ''}`
                    : 'No categories yet.',
                }}
              />
            </SortableContext>

            {/* Drag overlay — show ghost of dragged row */}
            <DragOverlay>
              {activeCat && (
                <div className={styles.dragOverlay}>
                  <HolderOutlined className={styles.dragOverlayIcon} />
                  <span>{activeCat.name}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </RootIdsContext.Provider>
      </div>

      {/* Modal */}
      <Modal
        title={
          <div className={styles.modalHeader}>
            <div
              className={`${styles.modalHeaderIcon} ${editMode ? styles.modalIconEdit : styles.modalIconAdd}`}
            >
              {editMode ? <EditOutlined /> : <PlusOutlined />}
            </div>
            <div>
              <div className={styles.modalHeaderTitle}>
                {editMode ? 'Edit Category' : 'New Category'}
              </div>
              <div className={styles.modalHeaderSub}>
                {editMode
                  ? 'Update category details below'
                  : 'Fill in the details to create a category'}
              </div>
            </div>
          </div>
        }
        open={showModal}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        okText={editMode ? 'Save Changes' : 'Create Category'}
        cancelText="Cancel"
        confirmLoading={submitting}
        width={760}
        destroyOnClose
        className={styles.categoryModal}
      >
        <Form form={form} layout="vertical" className={styles.form}>
          {/* ── Top panel: Image + Basic Info ── */}
          <div className={styles.formTopPanel}>
            {/* Left: Image */}
            <div className={styles.formImageCol}>
              <div className={styles.formSectionLabel}>Cover Image</div>
              <Form.Item name="image" noStyle>
                <CloudinaryUpload hint="JPG, PNG, WEBP · max 5 MB" />
              </Form.Item>
            </div>

            {/* Right: Basic info */}
            <div className={styles.formInfoCol}>
              <Form.Item
                label="Category Name"
                name="name"
                rules={[{ required: true, message: 'Name is required' }]}
              >
                <Input placeholder="e.g. Women's Clothing" size="large" />
              </Form.Item>

              <Form.Item label="Slug" name="slug" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="auto-generated from name"
                  size="large"
                  prefix={<span style={{ color: '#9ca3af', fontSize: 13 }}>/</span>}
                />
              </Form.Item>

              <Form.Item
                label="Description"
                name="description"
                style={{ marginTop: 16, marginBottom: 0 }}
              >
                <TextArea
                  rows={3}
                  placeholder="Brief description of this category…"
                  style={{ resize: 'none' }}
                />
              </Form.Item>
            </div>
          </div>

          {/* ── Divider: Settings ── */}
          <div className={styles.formDivider}>
            <span className={styles.formDividerLabel}>Settings</span>
          </div>

          {/* ── Bottom: Settings ── */}
          {/* Row 1: Parent + Display Order */}
          <div className={styles.formRow}>
            <Form.Item label="Parent Category" name="parentId" style={{ flex: 2 }}>
              <Select
                placeholder="None — root level"
                allowClear
                showSearch
                optionFilterProp="label"
                size="large"
                options={parentOptions.map((c) => ({
                  value: c._id,
                  label: '\u3000'.repeat(c.level ? c.level - 1 : 0) + c.name,
                }))}
              />
            </Form.Item>
            {watchedParentId && (
              <Form.Item
                label="Display Order"
                name="displayOrder"
                style={{ width: 140 }}
                tooltip="Controls order within parent. Drag & drop only works for root categories."
              >
                <InputNumber min={0} style={{ width: '100%' }} size="large" placeholder="0" />
              </Form.Item>
            )}
          </div>

          {/* Row 2: Status + Featured as a visual toggle row */}
          <div className={styles.toggleRow}>
            <Form.Item label="Status" name="isActive" style={{ flex: 1, marginBottom: 0 }}>
              <BoolToggle trueLabel="Active" falseLabel="Inactive" trueColor="green" />
            </Form.Item>
            <div className={styles.toggleDivider} />
            <Form.Item label="Featured" name="isFeatured" style={{ flex: 1, marginBottom: 0 }}>
              <BoolToggle trueLabel="Featured" falseLabel="Standard" trueColor="amber" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
