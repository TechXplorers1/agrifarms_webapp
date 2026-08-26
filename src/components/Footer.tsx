import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {

  return (
    <footer className="footer" style={{
      background: 'linear-gradient(to bottom, #064e3b, #022c22)',
      color: 'white',
      padding: '60px 0 30px 0',
      borderTop: '4px solid #10b981',
      marginTop: '24px'
    }}>
      <style>{`
        .footer-nav-link {
          color: rgba(255, 255, 255, 0.75);
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-block;
        }
        .footer-nav-link:hover {
          color: #34d399 !important;
          transform: translateX(4px);
        }
        .footer-contact-link {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          transition: color 0.2s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .footer-contact-link:hover {
          color: #34d399 !important;
        }
        .footer-sub-link {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .footer-sub-link:hover {
          color: #34d399 !important;
        }
      `}</style>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '40px',
          marginBottom: '40px'
        }}>
          {/* Brand Column */}
          <div>
            <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', textDecoration: 'none' }}>
              <div style={{ background: '#10b981', padding: '8px', borderRadius: '12px' }}>
                <Sprout size={28} color="white" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.5px', color: 'white' }}>Agri Farms</h2>
            </Link>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Empowering farmers with modern tools, equipment rentals, and a connected agricultural community.
            </p>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', color: '#10b981' }}>Quick Links</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><Link to="/rentals" className="footer-nav-link">Rent Equipment</Link></li>
              <li><Link to="/services" className="footer-nav-link">Find Services</Link></li>
              <li><Link to="/upload-item" className="footer-nav-link">List an Asset</Link></li>
              <li><Link to="/terms" className="footer-nav-link">Terms & Conditions</Link></li>
              <li><Link to="/privacy-policy" className="footer-nav-link">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', color: '#10b981' }}>Contact Us</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li>
                <a href="mailto:support@agrifarms.in" className="footer-contact-link">
                  <Mail size={18} color="#10b981" /> support@agrifarms.in
                </a>
              </li>
              <li>
                <a href="tel:+919493280533" className="footer-contact-link">
                  <Phone size={18} color="#10b981" /> +91 9493280533
                </a>
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
            <Link to="/privacy-policy" className="footer-sub-link">Privacy Policy</Link>
            <Link to="/terms" className="footer-sub-link">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
