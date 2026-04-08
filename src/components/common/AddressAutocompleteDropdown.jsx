import PropTypes from 'prop-types';
import { buildAddressDisplayString } from '@utils/addressAutocomplete';

const containerStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 30,
  marginTop: '0.5rem',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
  maxHeight: '240px',
  overflowY: 'auto',
};

const itemStyle = {
  width: '100%',
  textAlign: 'left',
  border: 0,
  borderBottom: '1px solid #f3f4f6',
  background: 'transparent',
  padding: '0.85rem 1rem',
  cursor: 'pointer',
};

const titleStyle = {
  fontSize: '0.9rem',
  fontWeight: 700,
  color: '#111827',
  lineHeight: 1.4,
};

const subtitleStyle = {
  fontSize: '0.78rem',
  color: '#6b7280',
  lineHeight: 1.5,
  marginTop: '0.15rem',
};

const AddressAutocompleteDropdown = ({ show, suggestions, onSelect }) => {
  if (!show || suggestions.length === 0) {
    return null;
  }

  return (
    <div style={containerStyle}>
      {suggestions.map((suggestion) => {
        const isGoongSuggestion = suggestion.source === 'goong';
        const displayAddress = isGoongSuggestion
          ? suggestion.formattedAddress || suggestion.subtitle || ''
          : buildAddressDisplayString(suggestion);
        const title = isGoongSuggestion
          ? suggestion.title || displayAddress
          : suggestion.receiverName || 'Saved address';
        const subtitle = isGoongSuggestion
          ? suggestion.subtitle || displayAddress
          : [suggestion.receiverName, displayAddress].filter(Boolean).join(' · ');

        return (
          <button
            key={suggestion.id || suggestion._id || displayAddress}
            type="button"
            style={itemStyle}
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(suggestion);
            }}
          >
            <div style={titleStyle}>{title}</div>
            <div style={subtitleStyle}>{subtitle}</div>
          </button>
        );
      })}
    </div>
  );
};

AddressAutocompleteDropdown.propTypes = {
  show: PropTypes.bool.isRequired,
  suggestions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default AddressAutocompleteDropdown;
