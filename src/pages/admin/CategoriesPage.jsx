import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import BoardTable from '../../components/common/BoardTable';
import { categoryService } from '../../services/api/categoryService';
import styles from '../../assets/styles/admin/CategoriesPage.module.css';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    slug: '',
    icon: '',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getTree();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      setError('Failed to fetch categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (category = null) => {
    if (category) {
      setEditMode(true);
      setCurrentCategory(category);
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parentId: category.parentId || '',
        slug: category.slug || '',
        icon: category.icon || '',
        displayOrder: category.displayOrder || 0,
        isActive: category.isActive !== undefined ? category.isActive : true,
      });
    } else {
      setEditMode(false);
      setCurrentCategory(null);
      setFormData({
        name: '',
        description: '',
        parentId: '',
        slug: '',
        icon: '',
        displayOrder: 0,
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentCategory(null);
    setFormData({
      name: '',
      description: '',
      parentId: '',
      slug: '',
      icon: '',
      displayOrder: 0,
      isActive: true,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editMode && currentCategory) {
        await categoryService.update(currentCategory._id, formData);
        setSuccess('Category updated successfully!');
      } else {
        await categoryService.create(formData);
        setSuccess('Category created successfully!');
      }
      fetchCategories();
      handleCloseModal();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save category');
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoryService.delete(categoryId);
      setSuccess('Category deleted successfully!');
      fetchCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete category');
    }
  };

  const getFlatCategoriesWithLevel = (categoryList, level = 0, result = []) => {
    categoryList.forEach((cat) => {
      result.push({ ...cat, level });
      if (cat.children && cat.children.length > 0) {
        getFlatCategoriesWithLevel(cat.children, level + 1, result);
      }
    });
    return result;
  };

  const renderCategoryRow = (category) => {
    return (
      <>
        <td style={{ paddingLeft: `${category.level * 30 + 15}px` }}>
          {category.level > 0 && <i className="bi bi-arrow-return-right me-2 text-muted"></i>}
          {category.icon && <i className={`${category.icon} me-2`}></i>}
          <span style={{ fontWeight: 500, color: '#111827' }}>{category.name}</span>
        </td>
        <td>
          <code style={{ fontSize: '13px', color: '#6b7280' }}>{category.slug}</code>
        </td>
        <td style={{ color: '#6b7280' }}>{category.description || '-'}</td>
        <td style={{ textAlign: 'center' }}>
          <Badge bg={category.isActive ? 'success' : 'secondary'}>
            {category.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </td>
        <td style={{ textAlign: 'center', fontWeight: 600 }}>{category.displayOrder || 0}</td>
        <td>
          <Button
            variant="outline-primary"
            size="sm"
            className="me-2"
            onClick={() => handleShowModal(category)}
          >
            <i className="bi bi-pencil"></i>
          </Button>
          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(category._id)}>
            <i className="bi bi-trash"></i>
          </Button>
        </td>
      </>
    );
  };

  const getFlatCategories = (categoryList, result = []) => {
    categoryList.forEach((cat) => {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        getFlatCategories(cat.children, result);
      }
    });
    return result;
  };

  const flatCategories = getFlatCategories(categories);

  return (
    <div className={styles.categoriesPage}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Category Management</h2>
          <p className="text-muted">Manage product categories and hierarchy</p>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-circle me-2"></i>
          Add Category
        </Button>
      </div>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <BoardTable
          title="Categories"
          columns={[
            { key: 'name', label: 'CATEGORY NAME' },
            { key: 'slug', label: 'SLUG' },
            { key: 'description', label: 'DESCRIPTION' },
            { key: 'status', label: 'STATUS', align: 'center' },
            { key: 'order', label: 'DISPLAY ORDER', align: 'center' },
            { key: 'actions', label: 'ACTIONS' },
          ]}
          data={getFlatCategoriesWithLevel(categories)}
          renderRow={(category) => renderCategoryRow(category)}
          emptyMessage="No categories found. Click 'Add Category' to create one."
          showFooter={false}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit Category' : 'Add New Category'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Category Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter category name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Slug</Form.Label>
                  <Form.Control
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="auto-generated if empty"
                  />
                  <Form.Text className="text-muted">URL-friendly identifier</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter category description"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Parent Category</Form.Label>
                  <Form.Select name="parentId" value={formData.parentId} onChange={handleChange}>
                    <option value="">None (Root Category)</option>
                    {flatCategories
                      .filter((cat) => !editMode || cat._id !== currentCategory?._id)
                      .map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Icon (Bootstrap Icons)</Form.Label>
                  <Form.Control
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    placeholder="bi bi-tag"
                  />
                  <Form.Text className="text-muted">e.g., bi bi-tag, bi bi-box</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Display Order</Form.Label>
                  <Form.Control
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Active"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editMode ? 'Update Category' : 'Create Category'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
