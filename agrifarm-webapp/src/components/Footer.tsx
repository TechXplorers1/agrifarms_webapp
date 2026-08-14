import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {

  return (
    <footer className="footer" style={{
      background: 'linear-gradient(to bottom, #064e3b, #022c22)',
      color: 'white',
      padding: '60px 0 30px 0',
      borderTop: '4px solid #10b981'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '40px',
          marginBottom: '40px'
        }}>
          {/* Brand Column */}
          <div>
            <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: '#10b981', padding: '8px', borderRadius: '12px' }}>
                <Sprout size={28} color="white" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.5px', color: 'white' }}>Agri Farms</h2>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Empowering farmers with modern tools, equipment rentals, and a connected agricultural community.
            </p>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', color: '#10b981' }}>Quick Links</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><Link to="/rentals" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', transition: 'color 0.2s' }}>Rent Equipment</Link></li>
              <li><Link to="/services" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', transition: 'color 0.2s' }}>Find Services</Link></li>
              <li><Link to="/upload-item" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', transition: 'color 0.2s' }}>List an Asset</Link></li>
              <li><Link to="/privacy-policy" style={{ color: 'white', textDecoration: 'underline', fontWeight: 600, transition: 'color 0.2s' }}>Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', color: '#10b981' }}>Contact Us</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.8)' }}>
                <Mail size={18} color="#10b981" /> support@agrifarms.in
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.8)' }}>
                <Phone size={18} color="#10b981" /> +91 98765 43210
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.4' }}>
                <MapPin size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                3rd cross, Maruthi Nagar,<br />Andhra Pradesh, India
              </li>
            </ul>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} Agri Farms. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/privacy-policy" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textDecoration: 'none' }}>Privacy</Link>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', cursor: 'pointer' }}>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
