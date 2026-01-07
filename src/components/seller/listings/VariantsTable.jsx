import React, { useState } from 'react';
import { Table, Form, Button, Badge } from 'react-bootstrap';
import { formatCurrency } from '../../../utils/formatters';

const VariantsTable = ({ tiers, models, onChange, disabled }) => {
  const [bulkEdit, setBulkEdit] = useState({ price: '', stock: '' });
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Get option labels for a model - options are now {value, isCustom} objects
  const getVariantLabel = (model) => {
    return model.tierIndex
      .map((idx, tierIdx) => {
        const option = tiers[tierIdx]?.options[idx];
        return option?.value || '?';
      })
      .join(' / ');
  };

  const handleModelChange = (index, field, value) => {
    const updated = [...models];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleSelectRow = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === models.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(models.map((_, i) => i)));
    }
  };

  const handleBulkApply = () => {
    if (selectedRows.size === 0) return;

    const updated = models.map((model, index) => {
      if (!selectedRows.has(index)) return model;

      return {
        ...model,
        ...(bulkEdit.price && { price: parseFloat(bulkEdit.price) }),
        ...(bulkEdit.stock && { stock: parseInt(bulkEdit.stock) }),
      };
    });

    onChange(updated);
    setBulkEdit({ price: '', stock: '' });
    setSelectedRows(new Set());
  };

  if (models.length === 0) {
    return (
      <div className="text-center text-muted py-4">
        <p>No variants generated yet. Add tiers to create variants.</p>
      </div>
    );
  }

  if (models.length > 200) {
    return (
      <div className="alert alert-danger">
        Too many variants ({models.length}). Maximum allowed: 200. Please reduce tier options.
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h6 className="mb-0">
            Variants <Badge bg="primary">{models.length}</Badge>
          </h6>
          <small className="text-muted">
            {selectedRows.size > 0 && `${selectedRows.size} selected`}
          </small>
        </div>

        {selectedRows.size > 0 && (
          <div className="d-flex gap-2">
            <Form.Control
              size="sm"
              type="number"
              placeholder="Bulk price"
              value={bulkEdit.price}
              onChange={(e) => setBulkEdit({ ...bulkEdit, price: e.target.value })}
              style={{ width: '120px' }}
            />
            <Form.Control
              size="sm"
              type="number"
              placeholder="Bulk stock"
              value={bulkEdit.stock}
              onChange={(e) => setBulkEdit({ ...bulkEdit, stock: e.target.value })}
              style={{ width: '100px' }}
            />
            <Button size="sm" variant="primary" onClick={handleBulkApply}>
              Apply to {selectedRows.size}
            </Button>
          </div>
        )}
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <Table bordered hover size="sm">
          <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
            <tr>
              <th style={{ width: '40px' }}>
                <Form.Check
                  type="checkbox"
                  checked={selectedRows.size === models.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Variant</th>
              <th style={{ width: '150px' }}>
                Price (₫) <span className="text-danger">*</span>
              </th>
              <th style={{ width: '120px' }}>Cost Price (₫)</th>
              <th style={{ width: '100px' }}>
                Stock <span className="text-danger">*</span>
              </th>
              <th style={{ width: '150px' }}>SKU (Optional)</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model, index) => (
              <tr key={index}>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedRows.has(index)}
                    onChange={() => handleSelectRow(index)}
                  />
                </td>
                <td>
                  <strong>{getVariantLabel(model)}</strong>
                  <br />
                  <small className="text-muted">tierIndex: [{model.tierIndex.join(', ')}]</small>
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    type="number"
                    value={model.price || ''}
                    onChange={(e) => handleModelChange(index, 'price', parseFloat(e.target.value))}
                    placeholder="15000"
                    min="0"
                    disabled={disabled}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    type="number"
                    value={model.costPrice || ''}
                    onChange={(e) =>
                      handleModelChange(index, 'costPrice', parseFloat(e.target.value))
                    }
                    placeholder="10000"
                    min="0"
                    disabled={disabled}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    type="number"
                    value={model.stock || ''}
                    onChange={(e) => handleModelChange(index, 'stock', parseInt(e.target.value))}
                    placeholder="50"
                    min="0"
                    disabled={disabled}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    type="text"
                    value={model.sku || ''}
                    onChange={(e) => handleModelChange(index, 'sku', e.target.value)}
                    placeholder="Auto-gen"
                    disabled={disabled}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className="text-muted mt-2">
        <small>
          💡 Tip: Select multiple rows and use bulk edit to set the same price/stock. Leave SKU
          blank to auto-generate.
        </small>
      </div>
    </div>
  );
};

export default VariantsTable;
