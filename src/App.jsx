import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { TopProgress } from './components/Loading';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ResourcePage from './pages/ResourcePage';
import ReportPage from './pages/ReportPage';

function RequireAuth({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <TopProgress />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="r/:key" element={<ResourcePage />} />
          <Route path="r/:key/:id" element={<ResourcePage />} />
          <Route path="reports" element={<ReportPage />} />
          <Route path="reports/:slug" element={<ReportPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}