import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { store, persistor } from '@store/store';
import MainLayout from '@layouts/MainLayout';
import ERPLayout from '@layouts/ERPLayout';
import AdminLayout from '@layouts/AdminLayout';
import PrivateRoute from '@routes/PrivateRoute';
import PublicRoute from '@routes/PublicRoute';
import routeConfig from '@routes/routeConfig';
import LoadingSpinner from '@components/common/LoadingSpinner';

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
    default:
      return ({ children }) => <>{children}</>;
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
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {routeConfig.map((route, index) => {
                const Layout = getLayout(route.layout);
                const Element = route.element;

                if (route.protected) {
                  // Protected routes with role-based access
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
                  // Public routes (with optional restriction for authenticated users)
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
                  // Default routes
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
