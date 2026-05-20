import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Services from './pages/Services';
import Rentals from './pages/Rentals';
import Profile from './pages/Profile';
import ManageAssets from './pages/ManageAssets';
import UploadItem from './pages/UploadItem';
import Login from './pages/Login';
import VerifyOTP from './pages/VerifyOTP';
import Activity from './pages/Activity';
import ProtectedRoute from './components/ProtectedRoute';
import OtpVerificationModal from './components/OtpVerificationModal';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <OtpVerificationModal />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="*" element={
            <ProtectedRoute>
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/rentals" element={<Rentals />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/manage-assets" element={<ManageAssets />} />
                  <Route path="/upload-item" element={<UploadItem />} />
                  <Route path="/activity" element={<Activity />} />
                  <Route path="/notifications" element={<div className="container"><h2>Notifications Page (Coming Soon)</h2></div>} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </main>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
