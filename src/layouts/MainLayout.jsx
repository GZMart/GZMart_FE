import React from 'react';
import { Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

// Import local components (Adjust paths if you saved them in different folders)
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ChatWidget from '../components/common/ChatWidget';
import { DailyCheckinFAB } from '../components/common/DailyCheckinModal';

const MainLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const isBuyer = user && user.role === 'buyer';

  return (
    <div className="main-layout d-flex flex-column min-vh-100 bg-light">
      {/* 1. Header Component */}
      <Header />

      {/* 2. Main Content */}
      <main className="main-content flex-grow-1 py-4">
        {/* Sử dụng class container của Bootstrap để căn giữa */}
        <div className="container">{children || <Outlet />}</div>
      </main>

      {/* 3. Footer Component */}
      <Footer />

      {/* 4. Chat Widget */}
      <ChatWidget />

      {/* 5. Daily Check-in FAB — Only for logged-in buyers */}
      {isBuyer && <DailyCheckinFAB />}
    </div>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node,
};

export default MainLayout;
