import React from 'react';
import ProductTable from '../../common/ProductTable';

const ReturnsTable = ({ returns, currentPage, itemsPerPage }) => {
  const actions = [
    {
      label: 'Test',
      icon: 'bi bi-clipboard-check',
      onClick: () => {},
    },
    {
      label: 'Draft',
      icon: 'bi bi-file-text',
      onClick: () => {},
    },
    {
      label: 'Hold',
      icon: 'bi bi-pause-circle',
      onClick: () => {},
    },
  ];

  return (
    <ProductTable
      products={returns}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      showActions={true}
      actions={actions}
      emptyMessage="No returns found."
    />
  );
};

export default ReturnsTable;
