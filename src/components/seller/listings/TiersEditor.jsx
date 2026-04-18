import { useState, useMemo } from 'react';
import { Form, Button, Row, Col, Badge, Modal } from 'react-bootstrap';
import Select from 'react-select';
import { TIER_TYPES, TIER_TYPE_KEYS, CUSTOM_OPTION } from '../../../constants/tierTypes';
import { getProductDrawerSelectStyles } from '../../../utils/productDrawerSelectStyles';
import drawerStyles from '../../../assets/styles/seller/ProductDrawer.module.css';

function TierPresetSelect({
  tier,
  tierType,
  tierIndex,
  optionIndex,
  optionValue,
  disabled,
  getSelectablePredefinedOptions,
  onSelect,
  styles: selectStyles,
}) {
  const selectable = getSelectablePredefinedOptions(
    tier,
    tierType.options,
    optionIndex,
    optionValue
  );
  const rsOptions = [
    ...selectable.map((opt) => ({ value: opt, label: opt })),
    { value: CUSTOM_OPTION, label: CUSTOM_OPTION },
  ];
  const selected = optionValue
    ? rsOptions.find((o) => o.value === optionValue) || { value: optionValue, label: optionValue }
    : null;

  return (
    <div className={drawerStyles.categorySelectWrap}>
      <Select
        inputId={`tier-${tierIndex}-opt-${optionIndex}-input`}
        instanceId={`tier-${tierIndex}-opt-${optionIndex}`}
        options={rsOptions}
        value={selected}
        onChange={(opt) => onSelect(opt?.value ?? '')}
        placeholder={`Search or select ${tier.name.toLowerCase()}…`}
        isClearable
        isSearchable
        isDisabled={disabled}
        styles={selectStyles}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        menuPosition="fixed"
        menuPlacement="auto"
        noOptionsMessage={() => 'No matches'}
        filterOption={(option, rawInput) => {
          const q = (rawInput || '').trim().toLowerCase();
          if (!q) {
            return true;
          }
          const label = String(option.label || '').toLowerCase();
          return label.includes(q);
        }}
      />
    </div>
  );
}

const TiersEditor = ({ tiers, onChange, disabled }) => {
  const MAX_TIERS = 3;
  const MAX_OPTIONS = 20;
  const [showAddTierModal, setShowAddTierModal] = useState(false);
  const [selectedTierType, setSelectedTierType] = useState('');

  const tierOptionSelectStyles = useMemo(() => getProductDrawerSelectStyles(false), []);

  // Get available tier types (not already used)
  const getAvailableTierTypes = () => {
    const usedTypes = tiers.map((t) => t.type);
    return TIER_TYPE_KEYS.filter((key) => !usedTypes.includes(key));
  };

  const handleAddTier = () => {
    if (tiers.length >= MAX_TIERS) {
      return;
    }
    setShowAddTierModal(true);
  };

  const handleConfirmAddTier = () => {
    if (!selectedTierType) {
      return;
    }
    const tierType = TIER_TYPES[selectedTierType];
    onChange([
      ...tiers,
      {
        type: selectedTierType,
        name: tierType.nameEn,
        options: [{ value: '', isCustom: false }],
      },
    ]);
    setShowAddTierModal(false);
    setSelectedTierType('');
  };

  const handleRemoveTier = (index) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  const handleAddOption = (tierIndex) => {
    const updated = [...tiers];
    if (updated[tierIndex].options.length >= MAX_OPTIONS) {
      return;
    }
    updated[tierIndex].options.push({ value: '', isCustom: false });
    onChange(updated);
  };

  const handleRemoveOption = (tierIndex, optionIndex) => {
    const updated = [...tiers];
    updated[tierIndex].options = updated[tierIndex].options.filter((_, i) => i !== optionIndex);
    onChange(updated);
  };

  const handleOptionChange = (tierIndex, optionIndex, selectedValue) => {
    const updated = [...tiers];
    if (selectedValue === CUSTOM_OPTION) {
      // Switch to custom input mode
      updated[tierIndex].options[optionIndex] = { value: '', isCustom: true };
    } else {
      // Use predefined option
      updated[tierIndex].options[optionIndex] = { value: selectedValue, isCustom: false };
    }
    onChange(updated);
  };

  const handleCustomOptionChange = (tierIndex, optionIndex, customValue) => {
    const updated = [...tiers];
    updated[tierIndex].options[optionIndex] = { value: customValue, isCustom: true };
    onChange(updated);
  };

  /** Predefined options already picked on other rows in this tier (same row keeps its value visible). */
  const getSelectablePredefinedOptions = (tier, predefinedList, optionIndex, currentValue) => {
    const takenElsewhere = new Set(
      tier.options
        .filter((o, i) => i !== optionIndex && o.value && !o.isCustom)
        .map((o) => o.value)
    );
    return predefinedList.filter((opt) => opt === currentValue || !takenElsewhere.has(opt));
  };

  return (
    <div>
      {/* Add Tier Modal */}
      <Modal show={showAddTierModal} onHide={() => setShowAddTierModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Variation Type</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Variation Type</Form.Label>
            <Form.Select
              value={selectedTierType}
              onChange={(e) => setSelectedTierType(e.target.value)}
            >
              <option value="">Select variation type</option>
              {getAvailableTierTypes().map((key) => (
                <option key={key} value={key}>
                  {TIER_TYPES[key].nameEn}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddTierModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmAddTier} disabled={!selectedTierType}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Product Variations</h6>
        {tiers.length < MAX_TIERS && (
          <Button size="sm" variant="outline-primary" onClick={handleAddTier} disabled={disabled}>
            + Add Variation Group
          </Button>
        )}
      </div>

      {tiers.map((tier, tierIndex) => {
        const tierType = TIER_TYPES[tier.type];
        return (
          <div key={tierIndex} className="border rounded p-3 mb-3">
            <Row className="mb-2">
              <Col md={10}>
                <Form.Group>
                  <Form.Label>
                    Variation {tierIndex + 1}: <strong>{tier.name}</strong>
                  </Form.Label>
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleRemoveTier(tierIndex)}
                  disabled={disabled}
                  className="w-100"
                >
                  Remove
                </Button>
              </Col>
            </Row>

            <Form.Label>
              Options{' '}
              <Badge bg="secondary">
                {tier.options.length}/{MAX_OPTIONS}
              </Badge>
            </Form.Label>
            {tier.options.map((option, optionIndex) => (
              <Row key={optionIndex} className="mb-2">
                <Col md={10}>
                  {option.isCustom ? (
                    // Custom input mode
                    <Form.Control
                      type="text"
                      value={option.value}
                      onChange={(e) =>
                        handleCustomOptionChange(tierIndex, optionIndex, e.target.value)
                      }
                      placeholder="Enter custom value"
                      disabled={disabled}
                    />
                  ) : (
                    <TierPresetSelect
                      tier={tier}
                      tierType={tierType}
                      tierIndex={tierIndex}
                      optionIndex={optionIndex}
                      optionValue={option.value}
                      disabled={disabled}
                      getSelectablePredefinedOptions={getSelectablePredefinedOptions}
                      onSelect={(val) => handleOptionChange(tierIndex, optionIndex, val)}
                      styles={tierOptionSelectStyles}
                    />
                  )}
                </Col>
                <Col md={2}>
                  {tier.options.length > 1 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveOption(tierIndex, optionIndex)}
                      disabled={disabled}
                      className="w-100"
                    >
                      ×
                    </Button>
                  )}
                </Col>
              </Row>
            ))}

            {tier.options.length < MAX_OPTIONS && (
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => handleAddOption(tierIndex)}
                disabled={disabled}
              >
                + Add Option
              </Button>
            )}
          </div>
        );
      })}

      {tiers.length === 0 && (
        <div className="text-center text-muted py-4">
          <p>No variations added. Click &quot;Add Variation Group&quot; to create.</p>
          <small>Example: Add Color with options Red, Blue, White</small>
        </div>
      )}
    </div>
  );
};

export default TiersEditor;
