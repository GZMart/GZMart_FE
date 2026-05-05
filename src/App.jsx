import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, Fragment } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ToastContainer } from 'react-toastify';
import { Analytics } from '@vercel/analytics/react';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { store, persistor } from '@store/store';
import { USER_ROLES } from '@constants';
import MainLayout from '@layouts/MainLayout';
import ERPLayout from '@layouts/ERPLayout';
import AdminLayout from '@layouts/AdminLayout';
import PrivateRoute from '@routes/PrivateRoute';
import PublicRoute from '@routes/PublicRoute';
import routeConfig, { sellerErpChildRoutes } from '@routes/routeConfig';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ScrollToTop from '@components/common/ScrollToTop';

/**
 * Get layout component based on layout type
 */
const getLayout = (layoutType) => {
  switch (layoutType) {
    case 'main':
      return MainLayout;
    case 'erp':
      return ERPLayout;
    case 'admin':
      return AdminLayout;
    case 'none': {
      /** full-page routes (auth, 404) — cần Suspense vì không có shell bọc trang con */
      return function NoneLayout({ children }) {
        return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;
      };
    }
    default:
      return Fragment;
  }
};

/**
 * Main App Component
 */
function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {routeConfig.map((route, index) => {
                if (route._sellerErp) {
                  return (
                    <Route
                      key="seller-erp"
                      path="/seller/*"
                      element={
                        <PrivateRoute allowedRoles={[USER_ROLES.SELLER]}>
                          <ERPLayout />
                        </PrivateRoute>
                      }
                    >
                      {sellerErpChildRoutes.map((child) => {
                        const Child = child.element;
                        return <Route key={child.path} path={child.path} element={<Child />} />;
                      })}
                    </Route>
                  );
                }

                const Layout = getLayout(route.layout);
                const Element = route.element;

                if (route.protected) {
                  return (
                    <Route
                      key={index}
                      path={route.path}
                      element={
                        <PrivateRoute allowedRoles={route.allowedRoles}>
                          <Layout>
                            <Element />
                          </Layout>
                        </PrivateRoute>
                      }
                    />
                  );
                } else if (route.public) {
                  return (
                    <Route
                      key={index}
                      path={route.path}
                      element={
                        <PublicRoute restricted={route.restricted}>
                          <Layout>
                            <Element />
                          </Layout>
                        </PublicRoute>
                      }
                    />
                  );
                } else {
                  return (
                    <Route
                      key={index}
                      path={route.path}
                      element={
                        <Layout>
                          <Element />
                        </Layout>
                      }
                    />
                  );
                }
              })}
            </Routes>
          </Suspense>

          {/* Vercel Analytics */}
          <Analytics />

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;
