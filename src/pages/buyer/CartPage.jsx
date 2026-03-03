import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { selectCartItems, fetchCart } from '@store/slices/cartSlice';

import { PUBLIC_ROUTES } from '@constants/routes';
import CartSection from '@components/common/cart/CartSection';
import OrderSummary from '@components/common/cart/OrderSummary';
import RecommendSection from '@components/common/cart/RecommendSection';
import PromoBanner from '@components/common/cart/PromoBanner';





/**
 * Cart Page Component
 * Displays shopping cart with items, order summary, and recommendations
 */
const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Fetch cart data on mount
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Auto-select all items when cart items change
  useEffect(() => {
    if (cartItems.length > 0 && selectedItems.size === 0) {
      setSelectedItems(new Set(cartItems.map((item) => item.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.length, selectedItems.size]);

  const handleBack = () => navigate(PUBLIC_ROUTES.HOME);

  // Handle item selection
  const handleItemSelect = (itemId) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(new Set(cartItems.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const isAllSelected = cartItems.length > 0 && selectedItems.size === cartItems.length;

  // Get selected items data
  const getSelectedItemsData = () => cartItems.filter((item) => selectedItems.has(item.id));



  const selectedItemsData = getSelectedItemsData();

  return (
    <div className="cart-page bg-white" style={{ minHeight: '100vh' }}>
      <Container className="py-4">
        {/* Breadcrumbs */}
        {/* <div className="mb-4">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0" style={{ backgroundColor: 'transparent', padding: 0 }}>
              <li className="breadcrumb-item">
                <Link
                  to={PUBLIC_ROUTES.HOME}
                  className="text-decoration-none"
                  style={{ color: '#0066CC' }}
                >
                  <i className="bi bi-house me-1"></i>
                  Home
                </Link>
              </li>
              <li
                className="breadcrumb-item active"
                aria-current="page"
                style={{ color: '#0066CC' }}
              >
                Cart
              </li>
              <li className="breadcrumb-item">
                <Link to="#" className="text-decoration-none" style={{ color: '#6c757d' }}>
                  Customer Info
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#" className="text-decoration-none" style={{ color: '#6c757d' }}>
                  Shipping & Payments
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#" className="text-decoration-none" style={{ color: '#6c757d' }}>
                  Product Confirmation
                </Link>
              </li>
            </ol>
          </nav>
        </div> */}

        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div className="d-flex align-items-start">
            <Button
              variant="link"
              className="p-0 text-decoration-none d-flex align-items-center"
              onClick={handleBack}
              style={{ color: '#000' }}
            >
              <div
                className="rounded-circle border d-flex align-items-center justify-content-center me-3"
                style={{
                  width: '60px',
                  height: '60px',
                  borderColor: '#dee2e6',
                }}
              >
                <i className="bi bi-chevron-left" style={{ fontSize: '20px' }}></i>
              </div>
            </Button>
            <div>
              <h1 className="mb-1 fw-bold" style={{ fontSize: '2rem', color: '#212529' }}>
                My Cart
              </h1>
              <p className="text-muted mb-0">
                Items in your bag not reserved — check out now to make them yours.
              </p>
            </div>
          </div>
          <Button variant="link" className="p-0">
            <i className="bi bi-share fs-5"></i>
          </Button>
        </div>

        {/* Promo Banner (Optional) */}
        {cartItems.length > 0 && (
          <PromoBanner message="Free shipping on orders over $100!" variant="success" dismissible />
        )}

        {/* Main Content */}
        <Row style={{ marginTop: '35px' }}>
          {/* Cart Items Section */}
          <Col lg={8} className="mb-4">
            <CartSection
              selectedItems={selectedItems}
              onItemSelect={handleItemSelect}
              onSelectAll={handleSelectAll}
              isAllSelected={isAllSelected}
            />
          </Col>

          {/* Order Summary Section */}
          <Col lg={4}>
            <OrderSummary
              shipping={0}
              tax={0}
              discount={0}
              giftBoxPrice={10.9}
              selectedItems={selectedItemsData}
            />
          </Col>
        </Row>

        {/* Recommended Products Section */}
        {cartItems.length > 0 && <RecommendSection limit={4} />}
      </Container>
    </div>
  );
};

export default CartPage;
