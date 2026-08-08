import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pens from './pages/Pens';
import Profile from './pages/Profile';
import PenDetail from './pages/PenDetail';

function PrivateRoute({ children }) {
  const { currentUser, userData, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center text-primary-500">載入中...</div>;
  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser && !userData) return <Navigate to="/setup" />;
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Profile setupMode={true} />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="pens" element={<Pens />} />
            <Route path="pens/:id" element={<PenDetail />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
