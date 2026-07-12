import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { fetchMe } from './store/slices/authSlice';

import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/common/PrivateRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import BrowseGigs from './pages/gigs/BrowseGigs';
import PostGig from './pages/gigs/PostGig';
import GigDetail from './pages/gigs/GigDetail';
import MyGigs from './pages/gigs/MyGigs';
import MyProposals from './pages/proposals/MyProposals';
import Messages from './pages/messages/Messages';
import Profile from './pages/profile/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import Payments from './pages/payments/Payments';
import Analytics from './pages/analytics/Analytics';
import Disputes from './pages/disputes/Disputes';
import VerifyEmail from './pages/auth/VerifyEmail';
import OAuthSuccess from './pages/auth/OAuthSuccess';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-transition">
      <Routes location={location}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/gigs" element={<BrowseGigs />} />
        <Route path="/gigs/:id" element={<GigDetail />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/post-gig" element={<PrivateRoute><PostGig /></PrivateRoute>} />
        <Route path="/my-gigs" element={<PrivateRoute><MyGigs /></PrivateRoute>} />
        <Route path="/my-proposals" element={<PrivateRoute><MyProposals /></PrivateRoute>} />
        <Route path="/find-work" element={<PrivateRoute><BrowseGigs /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/disputes" element={<PrivateRoute><Disputes /></PrivateRoute>} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
      </Routes>
    </div>
  );
}

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (localStorage.getItem('token')) dispatch(fetchMe());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Navbar />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
