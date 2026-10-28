import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { TopProgress, Spinner } from './components/Loading';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ResourcePage from './pages/ResourcePage';
import ReportPage from './pages/ReportPage';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AuditLog from './pages/AuditLog';
import PrintDocument from './pages/PrintDocument';

function RequireAuth({ children }) {
  const { token, ready } = useAuth();
  if (!ready) return <div className="boot"><Spinner size={28} /></div>;
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const location = useLocation();
  const eb = el => <ErrorBoundary key={location.pathname}>{el}</ErrorBoundary>;

  return (
    <>
      <TopProgress />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/print/:key/:id"
          element={<RequireAuth><ErrorBoundary><PrintDocument /></ErrorBoundary></RequireAuth>}
        />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={eb(<Dashboard />)} />
          <Route path="r/:key" element={eb(<ResourcePage />)} />
          <Route path="r/:key/:id" element={eb(<ResourcePage />)} />
          <Route path="reports" element={eb(<ReportPage />)} />
          <Route path="reports/:slug" element={eb(<ReportPage />)} />
          <Route path="audit" element={eb(<AuditLog />)} />
          <Route path="profile" element={eb(<Profile />)} />
          <Route path="settings" element={eb(<Settings />)} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}