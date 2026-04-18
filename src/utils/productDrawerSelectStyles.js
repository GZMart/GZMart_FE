/**
 * Shared react-select styles for ProductDrawer + TiersEditor (match category picker look).
 * @param {boolean} hasError - red border when validation error (e.g. category required)
 */
export function getProductDrawerSelectStyles(hasError = false) {
  return {
    control: (base, state) => ({
      ...base,
      minHeight: '2.75rem',
      borderRadius: '8px',
      borderColor: hasError ? '#dc2626' : state.isFocused ? '#1a56db' : '#d1d5db',
      boxShadow: state.isFocused
        ? hasError
          ? '0 0 0 3px rgba(220, 38, 38, 0.08)'
          : '0 0 0 3px rgba(26, 86, 219, 0.08)'
        : 'none',
      fontSize: '0.9375rem',
      cursor: 'pointer',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 1100 }),
    menu: (base) => ({ ...base, zIndex: 1100 }),
    option: (base, state) => ({
      ...base,
      fontSize: '0.875rem',
      fontFamily: 'inherit',
      backgroundColor: state.isSelected ? '#1a56db' : state.isFocused ? '#eff6ff' : '#ffffff',
      color: state.isSelected ? '#fff' : '#0f172a',
    }),
    placeholder: (base) => ({ ...base, color: '#94a3b8', fontSize: '0.9375rem' }),
    singleValue: (base) => ({ ...base, color: '#0f172a' }),
    input: (base) => ({ ...base, fontSize: '0.9375rem' }),
  };
}
