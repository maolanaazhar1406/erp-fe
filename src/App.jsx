import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { TopProgress } from './components/Loading';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ResourcePage from './pages/ResourcePage';
import ReportPage from './pages/ReportPage';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function RequireAuth({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const location = useLocation();
  return (
    <>
      <TopProgress />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<ErrorBoundary key={location.pathname}><Dashboard /></ErrorBoundary>} />
          <Route path="r/:key" element={<ErrorBoundary key={location.pathname}><ResourcePage /></ErrorBoundary>} />
          <Route path="r/:key/:id" element={<ErrorBoundary key={location.pathname}><ResourcePage /></ErrorBoundary>} />
          <Route path="reports" element={<ErrorBoundary key={location.pathname}><ReportPage /></ErrorBoundary>} />
          <Route path="reports/:slug" element={<ErrorBoundary key={location.pathname}><ReportPage /></ErrorBoundary>} />
          <Route path="profile" element={<ErrorBoundary key={location.pathname}><Profile /></ErrorBoundary>} />
          <Route path="settings" element={<ErrorBoundary key={location.pathname}><Settings /></ErrorBoundary>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}