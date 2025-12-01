import { useParams } from 'react-router-dom';

const ProductDetailsPage = () => {
  const { id } = useParams();

  return (
    <div className="product-details-page">
      <h1>Product Details - {id}</h1>
      <p>Product information will be displayed here...</p>
    </div>
  );
};

export default ProductDetailsPage;
