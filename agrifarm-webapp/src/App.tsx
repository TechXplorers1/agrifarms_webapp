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

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="*" element={
            <>
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/rentals" element={<Rentals />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/manage-assets" element={<ManageAssets />} />
                  <Route path="/upload-item" element={<UploadItem />} />
                  <Route path="/activity" element={<div className="container"><h2>Activity Page (Coming Soon)</h2></div>} />
                  <Route path="/notifications" element={<div className="container"><h2>Notifications Page (Coming Soon)</h2></div>} />
                  <Route path="/profile" element={<Profile />} />
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
