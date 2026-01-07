import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import BoardTable from '../../components/common/BoardTable';
import { attributeService } from '../../services/api/attributeService';
import { categoryService } from '../../services/api/categoryService';
import styles from '../../assets/styles/admin/AttributesPage.module.css';

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

  useEffect(() => {
    fetchCategories();
    fetchAttributes();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchAttributes(selectedCategory);
    } else {
      fetchAttributes();
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchAttributes = async (categoryId = null) => {
    try {
      setLoading(true);
      const response = categoryId
        ? await attributeService.getByCategory(categoryId)
        : await attributeService.getAll();

      if (response.success) {
        setAttributes(response.data || []);
      }
    } catch (err) {
      setError('Failed to fetch attributes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (attribute = null) => {
    if (attribute) {
      setEditMode(true);
      setCurrentAttribute(attribute);

      setFormData({
        name: attribute.name || '',
        slug: attribute.slug || '',
        description: attribute.description || '',
        categoryId:
          typeof attribute.categoryId === 'object'
            ? attribute.categoryId._id
            : attribute.categoryId || '',
        options: attribute.options || [],
        isRequired: attribute.isRequired || false,
        isFilterable: attribute.isFilterable || false,
        displayOrder: attribute.displayOrder || 0,
      });
    } else {
      setEditMode(false);
      setCurrentAttribute(null);
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
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentAttribute(null);
    setOptionInput('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddOption = () => {
    if (optionInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        options: [...prev.options, optionInput.trim()],
      }));
      setOptionInput('');
    }
  };

  const handleRemoveOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

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
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ Error saving attribute:', err);
      setError(err.message || 'Failed to save attribute');
    }
  };

  const handleDelete = async (attributeId) => {
    if (!window.confirm('Are you sure you want to delete this attribute?')) return;

    try {
      await attributeService.delete(attributeId);
      setSuccess('Attribute deleted successfully!');
      fetchAttributes(selectedCategory || null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete attribute');
    }
  };

  const getCategoryName = (categoryId) => {
    // Handle both object (populated) and string format
    const catId = typeof categoryId === 'object' ? categoryId?._id : categoryId;
    const category = categories.find((cat) => cat._id === catId);
    return category ? category.name : 'All Categories';
  };

  const needsOptions = formData.options.length > 0;

  return (
    <div className={styles.attributesPage}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Attribute Management</h2>
          <p className="text-muted">Manage dynamic product attributes (Material, Collar, etc.)</p>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-circle me-2"></i>
          Add Attribute
        </Button>
      </div>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="card mb-3">
        <div className="card-body">
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Filter by Category</Form.Label>
                <Form.Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <BoardTable
          title="Attributes"
          columns={[
            { key: 'name', label: 'ATTRIBUTE NAME' },
            { key: 'slug', label: 'SLUG' },
            { key: 'category', label: 'CATEGORY' },
            { key: 'required', label: 'REQUIRED', align: 'center' },
            { key: 'filterable', label: 'FILTERABLE', align: 'center' },
            { key: 'options', label: 'OPTIONS' },
            { key: 'actions', label: 'ACTIONS' },
          ]}
          data={attributes}
          renderRow={(attr) => (
            <>
              <td style={{ fontWeight: 500, color: '#111827' }}>{attr.name}</td>
              <td>
                <code style={{ fontSize: '13px', color: '#6b7280' }}>{attr.slug}</code>
              </td>
              <td style={{ color: '#6b7280' }}>{getCategoryName(attr.categoryId)}</td>
              <td style={{ textAlign: 'center' }}>
                {attr.isRequired ? (
                  <i
                    className="bi bi-check-circle-fill text-success"
                    style={{ fontSize: '18px' }}
                  ></i>
                ) : (
                  <i className="bi bi-dash-circle text-muted" style={{ fontSize: '18px' }}></i>
                )}
              </td>
              <td style={{ textAlign: 'center' }}>
                {attr.isFilterable ? (
                  <i
                    className="bi bi-check-circle-fill text-success"
                    style={{ fontSize: '18px' }}
                  ></i>
                ) : (
                  <i className="bi bi-dash-circle text-muted" style={{ fontSize: '18px' }}></i>
                )}
              </td>
              <td style={{ color: '#6b7280' }}>
                {attr.options && attr.options.length > 0 ? (
                  <span>{attr.options.length} options</span>
                ) : (
                  '-'
                )}
              </td>
              <td>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                  onClick={() => handleShowModal(attr)}
                >
                  <i className="bi bi-pencil"></i>
                </Button>
                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(attr._id)}>
                  <i className="bi bi-trash"></i>
                </Button>
              </td>
            </>
          )}
          emptyMessage="No attributes found. Click 'Add Attribute' to create one."
          showFooter={false}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit Attribute' : 'Add New Attribute'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Attribute Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Material, Collar Type"
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
                  <Form.Text className="text-muted">Unique identifier for this attribute</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>
                Category <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
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
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter attribute description"
              />
            </Form.Group>

            {formData.options.length > 0 && (
              <Form.Group className="mb-3">
                <Form.Label>Options</Form.Label>
                <div className="d-flex gap-2 mb-2">
                  <Form.Control
                    type="text"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    placeholder="Enter an option"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                  />
                  <Button variant="outline-primary" onClick={handleAddOption}>
                    Add
                  </Button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {formData.options.map((option, index) => (
                    <Badge key={index} bg="secondary" className="d-flex align-items-center gap-2">
                      {option}
                      <i
                        className="bi bi-x-circle"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRemoveOption(index)}
                      ></i>
                    </Badge>
                  ))}
                </div>
                {formData.options.length === 0 && (
                  <Form.Text className="text-muted">
                    Add options for this attribute (e.g., Cotton, Polyester, Silk)
                  </Form.Text>
                )}
              </Form.Group>
            )}

            <Row>
              <Col md={4}>
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
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Required"
                    name="isRequired"
                    checked={formData.isRequired}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">Must be filled when creating product</Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Filterable"
                    name="isFilterable"
                    checked={formData.isFilterable}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">Can be used as search filter</Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editMode ? 'Update Attribute' : 'Create Attribute'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AttributesPage;
