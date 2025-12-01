import { useParams } from 'react-router-dom';

const PODetailsPage = () => {
  const { id } = useParams();

  return (
    <div className="po-details-page">
      <h1>Purchase Order Details - {id}</h1>
      <p>PO details will be displayed here...</p>
    </div>
  );
};

export default PODetailsPage;
