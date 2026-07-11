import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Popups from './pages/Popups';
import PopupBuilder from './pages/PopupBuilder';
import PopupLeads from './pages/PopupLeads';
import Leads from './pages/Leads';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import AppLayout from './components/layout/AppLayout';

const PrivateRoute = ({ children }) => {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
        <Route path="/popups" element={<PrivateRoute><AppLayout><Popups /></AppLayout></PrivateRoute>} />
        <Route path="/popups/new" element={<PrivateRoute><PopupBuilder /></PrivateRoute>} />
        <Route path="/popups/:id/edit" element={<PrivateRoute><PopupBuilder /></PrivateRoute>} />
        <Route path="/popups/:id/leads" element={<PrivateRoute><AppLayout><PopupLeads /></AppLayout></PrivateRoute>} />
        <Route path="/leads" element={<PrivateRoute><AppLayout><Leads /></AppLayout></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><AppLayout><Analytics /></AppLayout></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><AppLayout><Settings /></AppLayout></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
