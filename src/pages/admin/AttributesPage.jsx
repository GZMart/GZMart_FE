import React, { useState, useEffect, useMemo } from 'react';
import { Form, Row, Col, Spinner } from 'react-bootstrap';
import Drawer from '../../components/common/Drawer';
import { attributeService } from '../../services/api/attributeService';
import { categoryService } from '../../services/api/categoryService';
import styles from '../../assets/styles/admin/AttributesPage.module.css';

/* ── SVG Icons (inline, no emoji) ─────────────────────────── */
const IconSliders = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);
const IconPlus = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconSearch = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconX = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.59L6.41 12l1.42-1.41L11 13.76l5.17-5.17 1.42 1.41L11 16.59z" />
  </svg>
);
const IconDash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const IconPencil = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const IconTag = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
const IconAlert = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconCheckCircle = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

/* ── Utility: slugify ─────────────────────────────────────── */
const toSlug = (str) =>
  str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* ═══════════════════════════════════════════════════════════ */
const AttributesPage = () => {
  const [attributes, setAttributes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAttribute, setCurrentAttribute] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirm modal state
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    options: [],
    isRequired: false,
    isFilterable: false,
    displayOrder: 0,
  });
  const [optionInput, setOptionInput] = useState('');
  const [slugManual, setSlugManual] = useState(false);

  /* ── Fetch ──────────────────────────────────────────────── */
  useEffect(() => {
    fetchCategories();
    fetchAttributes();
  }, []);

  useEffect(() => {
    fetchAttributes(selectedCategory || null);
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      // Use tree endpoint to get hierarchy (parent → children)
      const res = await categoryService.getTree(true);
      if (res.success) {
        // Flatten the tree into a list with depth info for the select options
        const flat = [];
        const flatten = (nodes, depth = 0) => {
          (nodes || []).forEach((node) => {
            flat.push({ _id: node._id, name: node.name, depth });
            if (node.children?.length) {
              flatten(node.children, depth + 1);
            }
          });
        };
        flatten(res.data || []);
        setCategories(flat);
      }
    } catch (err) {
      // Fallback to flat list
      try {
        const res2 = await categoryService.getAll();
        if (res2.success) {
          setCategories((res2.data || []).map((c) => ({ ...c, depth: 0 })));
        }
      } catch {}
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchAttributes = async (categoryId = null) => {
    try {
      setLoading(true);
      const res = categoryId
        ? await attributeService.getByCategory(categoryId)
        : await attributeService.getAll();
      if (res.success) {
        setAttributes(res.data || []);
      }
    } catch (err) {
      setError('Failed to fetch attributes');
    } finally {
      setLoading(false);
    }
  };

  /* ── Filtered list (client-side search) ─────────────────── */
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) {
      return attributes;
    }
    const q = searchQuery.toLowerCase();
    return attributes.filter(
      (a) => a.name?.toLowerCase().includes(q) || a.slug?.toLowerCase().includes(q)
    );
  }, [attributes, searchQuery]);

  /* ── Stats ──────────────────────────────────────────────── */
  const totalCount = attributes.length;
  const requiredCount = attributes.filter((a) => a.isRequired).length;
  const filterCount = attributes.filter((a) => a.isFilterable).length;

  /* ── Category helper ────────────────────────────────────── */
  const getCategoryName = (categoryId) => {
    const catId = typeof categoryId === 'object' ? categoryId?._id : categoryId;
    const cat = categories.find((c) => c._id === catId);
    return cat ? cat.name : '—';
  };

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategory) {
      return null;
    }
    const cat = categories.find((c) => c._id === selectedCategory);
    return cat?.name ?? null;
  }, [selectedCategory, categories]);

  /* ── Modal open/close ───────────────────────────────────── */
  const handleShowModal = (attr = null) => {
    if (attr) {
      setEditMode(true);
      setCurrentAttribute(attr);
      setSlugManual(true);
      setFormData({
        name: attr.name || '',
        slug: attr.slug || '',
        description: attr.description || '',
        categoryId:
          typeof attr.categoryId === 'object' ? attr.categoryId._id : attr.categoryId || '',
        options: attr.options || [],
        isRequired: attr.isRequired || false,
        isFilterable: attr.isFilterable || false,
        displayOrder: attr.displayOrder || 0,
      });
    } else {
      setEditMode(false);
      setCurrentAttribute(null);
      setSlugManual(false);
      setFormData({
        name: '',
        slug: '',
        description: '',
        categoryId: selectedCategory || '',
        options: [],
        isRequired: false,
        isFilterable: false,
        displayOrder: 0,
      });
    }
    setOptionInput('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentAttribute(null);
    setOptionInput('');
    setSlugManual(false);
  };

  /* ── Form changes ───────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'name' && !slugManual) {
      setFormData((prev) => ({ ...prev, name: value, slug: toSlug(value) }));
    } else if (name === 'slug') {
      setSlugManual(true);
      setFormData((prev) => ({ ...prev, slug: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleAddOption = () => {
    const val = optionInput.trim();
    if (val && !formData.options.includes(val)) {
      setFormData((prev) => ({ ...prev, options: [...prev.options, val] }));
      setOptionInput('');
    }
  };

  const handleRemoveOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  /* ── Submit ─────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (editMode && currentAttribute) {
        await attributeService.update(currentAttribute._id, formData);
        setSuccess('Attribute updated successfully!');
      } else {
        await attributeService.create(formData);
        setSuccess('Attribute created successfully!');
      }
      fetchAttributes(selectedCategory || null);
      handleCloseModal();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err) {
      setError(err.message || 'Failed to save attribute');
    }
  };

  /* ── Delete (custom modal) ──────────────────────────────── */
  const handleDeleteClick = (attr) => setDeleteTarget(attr);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await attributeService.delete(deleteTarget._id);
      setSuccess('Attribute deleted successfully!');
      setDeleteTarget(null);
      fetchAttributes(selectedCategory || null);
      setTimeout(() => setSuccess(null), 3500);
    } catch (err) {
      setError(err.message || 'Failed to delete attribute');
      setDeleteTarget(null);
    }
  };

  /* ── Clear filters ──────────────────────────────────────── */
  const hasFilter = searchQuery || selectedCategory;
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
  };

  /* ═══════════════════════════════════ RENDER ═════════════ */
  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <IconSliders />
          </div>
          <div>
            <h2 className={styles.h2}>Attribute Management</h2>
            <p className={styles.subtitle}>
              Manage dynamic product attributes (Material, Collar, etc.)
            </p>
          </div>
        </div>
        <button className={`btn btn-primary ${styles.btnAdd}`} onClick={() => handleShowModal()}>
          <IconPlus /> Add Attribute
        </button>
      </div>

      {/* ── Toasts ── */}
      {success && (
        <div className={`${styles.toast} ${styles.toastSuccess}`}>
          <IconCheckCircle /> {success}
        </div>
      )}
      {error && (
        <div className={`${styles.toast} ${styles.toastError}`}>
          <IconAlert /> {error}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className={styles.stats}>
        <div className={`${styles.statCard} ${styles.statTotal}`}>
          <div className={styles.statNum}>{totalCount}</div>
          <div className={styles.statLabel}>Total</div>
        </div>
        <div className={`${styles.statCard} ${styles.statRequired}`}>
          <div className={styles.statNum}>{requiredCount}</div>
          <div className={styles.statLabel}>Required</div>
        </div>
        <div className={`${styles.statCard} ${styles.statFilter}`}>
          <div className={styles.statNum}>{filterCount}</div>
          <div className={styles.statLabel}>Filterable</div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className={styles.tableWrap}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.filterBar}>
            {/* Search */}
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>
                <IconSearch />
              </span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search attributes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Category filter — hierarchical */}
            <select
              className={styles.filterSelect}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.depth > 0 ? `${'  '.repeat(cat.depth * 2)}› ` : ''}
                  {cat.name}
                </option>
              ))}
            </select>
            {/* Selected category pill */}
            {selectedCategoryName && (
              <span className={styles.activeCatPill}>
                <span className={styles.activeCatPillDot} />
                {selectedCategoryName}
                <button
                  className={styles.activeCatPillX}
                  onClick={() => setSelectedCategory('')}
                  title="Clear category filter"
                >
                  <IconX />
                </button>
              </span>
            )}
            {/* Clear */}
            {hasFilter && (
              <button className={styles.btnClear} onClick={clearFilters}>
                <IconX /> Clear all
              </button>
            )}
          </div>
          <span className={styles.resultCount}>
            {filtered.length} {filtered.length === 1 ? 'attribute' : 'attributes'}
          </span>
        </div>

        {/* Table / Loading / Empty */}
        {loading ? (
          <div className={styles.loadingState}>
            <Spinner animation="border" style={{ color: '#4f46e5' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <IconTag />
            </div>
            <p className={styles.emptyTitle}>
              {selectedCategoryName
                ? `No attributes for “${selectedCategoryName}”`
                : 'No attributes found'}
            </p>
            <p className={styles.emptyText}>
              {hasFilter
                ? 'Try adjusting your search or selecting a different category.'
                : "Click 'Add Attribute' to create your first attribute."}
            </p>
            {!searchQuery && (
              <button
                className={`btn btn-primary ${styles.emptyBtn}`}
                onClick={() => handleShowModal()}
              >
                <IconPlus /> Add Attribute
                {selectedCategoryName ? ` for “${selectedCategoryName}”` : ''}
              </button>
            )}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Attribute Name</th>
                <th>Slug</th>
                <th>Category</th>
                <th className={styles.center}>Required</th>
                <th className={styles.center}>Filterable</th>
                <th>Options</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((attr) => {
                const opts = attr.options || [];
                const displayOpts = opts.slice(0, 3);
                const remaining = opts.length - 3;
                return (
                  <tr key={attr._id}>
                    <td>
                      <span className={styles.attrName}>{attr.name}</span>
                    </td>
                    <td>
                      <code className={styles.slugCode}>{attr.slug}</code>
                    </td>
                    <td>
                      <span className={styles.catPill}>{getCategoryName(attr.categoryId)}</span>
                    </td>
                    <td className={styles.center}>
                      {attr.isRequired ? (
                        <span className={`${styles.pillYes} ${styles.pillYesRequired}`}>
                          <span className={styles.pillDot} /> Yes
                        </span>
                      ) : (
                        <span className={styles.pillNo}>
                          <span className={styles.pillDot} /> No
                        </span>
                      )}
                    </td>
                    <td className={styles.center}>
                      {attr.isFilterable ? (
                        <span className={`${styles.pillYes} ${styles.pillYesFilter}`}>
                          <span className={styles.pillDot} /> Yes
                        </span>
                      ) : (
                        <span className={styles.pillNo}>
                          <span className={styles.pillDot} /> No
                        </span>
                      )}
                    </td>
                    <td>
                      {opts.length > 0 ? (
                        <div className={styles.optionTagsCell}>
                          {displayOpts.map((o, i) => (
                            <span key={i} className={styles.optTag}>
                              {o}
                            </span>
                          ))}
                          {remaining > 0 && <span className={styles.optTagMore}>+{remaining}</span>}
                        </div>
                      ) : (
                        <span className={styles.emptyDash}>—</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          className={styles.btnEdit}
                          title="Edit"
                          onClick={() => handleShowModal(attr)}
                        >
                          <IconPencil />
                        </button>
                        <button
                          className={styles.btnDelete}
                          title="Delete"
                          onClick={() => handleDeleteClick(attr)}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      <Drawer
        open={showModal}
        onClose={handleCloseModal}
        width="520px"
        title={editMode ? 'Edit Attribute' : 'New Attribute'}
        subtitle={
          editMode
            ? `Updating "${currentAttribute?.name}"`
            : 'Define a new product attribute with options'
        }
        headerIcon={
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: editMode ? '#fff7ed' : '#eef2ff',
              color: editMode ? '#d97706' : '#4f46e5',
            }}
          >
            {editMode ? <IconPencil /> : <IconSliders />}
          </div>
        }
        footer={
          <>
            <button
              type="button"
              onClick={handleCloseModal}
              style={{
                padding: '8px 20px',
                borderRadius: 9,
                fontWeight: 600,
                fontSize: '0.875rem',
                border: '1px solid #e5e7eb',
                background: '#fff',
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="attr-form"
              style={{
                padding: '8px 20px',
                borderRadius: 9,
                fontWeight: 600,
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(130deg, #4f46e5, #4338ca)',
                color: '#fff',
                boxShadow: '0 3px 10px rgba(79,70,229,0.3)',
              }}
            >
              {editMode ? 'Update Attribute' : 'Create Attribute'}
            </button>
          </>
        }
      >
        <Form id="attr-form" onSubmit={handleSubmit}>
          {/* Basic info */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
                  Attribute Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Material, Collar Type"
                  style={{ borderRadius: 8, fontSize: '0.875rem' }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
                  Slug
                </Form.Label>
                <Form.Control
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="auto-generated from name"
                  style={{ borderRadius: 8, fontSize: '0.875rem', fontFamily: 'monospace' }}
                />
                <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Auto-generated · you can override
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
              Category <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              style={{ borderRadius: 8, fontSize: '0.875rem' }}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
              Description
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe this attribute..."
              style={{ borderRadius: 8, fontSize: '0.875rem', resize: 'none' }}
            />
          </Form.Group>

          {/* Options section — always visible */}
          <div className={styles.formDivider}>
            <span className={styles.formDividerLabel}>Options</span>
          </div>
          <div className={styles.optionsArea}>
            <div className={styles.optionInputRow}>
              <input
                type="text"
                className={`form-control ${styles.optionField}`}
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                placeholder="Type an option and press Enter or Add…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOption();
                  }
                }}
              />
              <button type="button" className={`btn ${styles.btnAddOpt}`} onClick={handleAddOption}>
                <IconPlus /> Add
              </button>
            </div>
            <div className={styles.optionTags}>
              {formData.options.length === 0 ? (
                <span className={styles.optionsHint}>
                  No options added yet. (e.g., Cotton, Polyester, Silk)
                </span>
              ) : (
                formData.options.map((opt, idx) => (
                  <span key={idx} className={styles.optionTagItem}>
                    {opt}
                    <button
                      type="button"
                      className={styles.btnRemoveOpt}
                      onClick={() => handleRemoveOption(idx)}
                    >
                      <IconX />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Settings */}
          <div className={styles.formDivider}>
            <span className={styles.formDividerLabel}>Settings</span>
          </div>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
                  Display Order
                </Form.Label>
                <Form.Control
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleChange}
                  min="0"
                  style={{ borderRadius: 8, fontSize: '0.875rem' }}
                />
              </Form.Group>
            </Col>
          </Row>
          <div className={styles.toggleRow}>
            {/* Required toggle card */}
            <div
              className={[
                styles.toggleCard,
                styles.toggleCardRequired,
                formData.isRequired ? styles.toggleCardActive : '',
              ].join(' ')}
              onClick={() => setFormData((p) => ({ ...p, isRequired: !p.isRequired }))}
            >
              <div className={styles.switchTrack} />
              <div className={styles.switchInfo}>
                <span className={styles.switchLabel}>Required</span>
                <span className={styles.switchHint}>Must be filled when creating a product</span>
              </div>
            </div>

            {/* Filterable toggle card */}
            <div
              className={[
                styles.toggleCard,
                styles.toggleCardFilter,
                formData.isFilterable ? styles.toggleCardActive : '',
              ].join(' ')}
              onClick={() => setFormData((p) => ({ ...p, isFilterable: !p.isFilterable }))}
            >
              <div className={styles.switchTrack} />
              <div className={styles.switchInfo}>
                <span className={styles.switchLabel}>Filterable</span>
                <span className={styles.switchHint}>Can be used as a search filter</span>
              </div>
            </div>
          </div>
        </Form>
      </Drawer>

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className={styles.deleteModal} onClick={() => setDeleteTarget(null)}>
          <div className={styles.deleteModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteModalIcon}>
              <IconTrash />
            </div>
            <div className={styles.deleteModalTitle}>Delete Attribute?</div>
            <div className={styles.deleteModalText}>
              This will permanently remove{' '}
              <span className={styles.deleteModalName}>"{deleteTarget.name}"</span>
              .<br />
              This action cannot be undone.
            </div>
            <div className={styles.deleteModalActions}>
              <button
                className={`btn ${styles.btnDeleteCancel}`}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button className={`btn ${styles.btnDeleteConfirm}`} onClick={handleDeleteConfirm}>
                <IconTrash /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttributesPage;
