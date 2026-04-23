import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import LoadingSpinner from '@components/common/LoadingSpinner';

// Import local components (Adjust paths if you saved them in different folders)
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ChatWidget from '../components/common/ChatWidget';

const MainLayout = ({ children }) => (
  <div className="main-layout d-flex flex-column min-vh-100 bg-light">
    {/* 1. Header Component */}
    <Header />

    {/* 2. Main Content */}
    <main className="main-content flex-grow-1 py-4">
      {/* Sử dụng class container của Bootstrap để căn giữa */}
      <div className="container">
        <Suspense fallback={<LoadingSpinner variant="content" />}>{children || <Outlet />}</Suspense>
      </div>
    </main>

    {/* 3. Footer Component */}
    <Footer />

    {/* 4. Chat Widget */}
    <ChatWidget />
  </div>
);

MainLayout.propTypes = {
  children: PropTypes.node,
};

export default MainLayout;
