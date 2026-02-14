import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin } from './api/client';

/**
 * Protected route component for admin-only pages
 * Redirects to home page if user is not authenticated or not an admin
 */
function ProtectedAdminRoute({ children }) {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin
  if (!isAdmin()) {
    return (
      <section className="card">
        <h2>Access Denied</h2>
        <p style={{ color: '#dc2626', marginBottom: '20px' }}>
          You do not have permission to access this page. Admin privileges are required.
        </p>
        <a href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Return to Home
        </a>
      </section>
    );
  }

  // User is authenticated and is admin - render the protected content
  return children;
}

export default ProtectedAdminRoute;
