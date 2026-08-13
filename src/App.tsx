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
import SelectLanguage from './pages/SelectLanguage';
import AccountSettings from './pages/Settings';
import Activity from './pages/Activity';
import ProtectedRoute from './components/ProtectedRoute';
import OtpVerificationModal from './components/OtpVerificationModal';
import BookAsset from './pages/BookAsset';
import ToolPlaceholder from './pages/ToolPlaceholder';
import Notifications from './pages/Notifications';
import ServiceRequests from './pages/ServiceRequests';
import Calculators from './pages/Calculators';
import CropAdvisory from './pages/CropAdvisory';
import Community from './pages/Community';
import HelpSupport from './pages/HelpSupport';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <OtpVerificationModal />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="*" element={
            <>
              <Navbar />
              <main className="main-content">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/rentals" element={<Rentals />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/select-language" element={<SelectLanguage />} />
                  <Route path="/calculators" element={<Calculators />} />
                  <Route path="/crop-advisory" element={<CropAdvisory />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/help" element={<HelpSupport />} />
                  <Route path="/weather" element={<ToolPlaceholder />} />
                  <Route path="/mandi-prices" element={<ToolPlaceholder />} />

                  {/* Protected routes */}
                  <Route path="/manage-assets" element={<ProtectedRoute><ManageAssets /></ProtectedRoute>} />
                  <Route path="/upload-item" element={<ProtectedRoute><UploadItem /></ProtectedRoute>} />
                  <Route path="/book" element={<ProtectedRoute><BookAsset /></ProtectedRoute>} />
                  <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
                  <Route path="/service-requests" element={<ProtectedRoute><ServiceRequests /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                </Routes>
              </main>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
