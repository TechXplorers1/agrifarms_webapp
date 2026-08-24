import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ShieldCheck, 
  UserCheck, 
  Truck, 
  Clock, 
  AlertTriangle, 
  Scale, 
  HelpCircle 
} from 'lucide-react';

const TermsAndConditions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="terms-page" style={{ padding: '60px 20px', maxWidth: '960px', margin: '0 auto', color: 'var(--text-main)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', background: '#e8f5e9', padding: '16px', borderRadius: '50%', marginBottom: '20px' }}>
            <FileText size={40} color="#10b981" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '10px' }}>Terms & Conditions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Please read these terms carefully before using the Agri Farms platform.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '40px',
          background: 'rgba(0,0,0,0.03)',
          padding: '6px',
          borderRadius: '16px',
          maxWidth: '450px',
          margin: '0 auto 40px auto'
        }}>
          <button
            onClick={() => setActiveTab('terms')}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'terms' ? '#10b981' : 'transparent',
              color: activeTab === 'terms' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: activeTab === 'terms' ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none'
            }}
          >
            Terms of Service
          </button>
          <Link
            to="/privacy-policy"
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              textAlign: 'center',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: 'transparent',
              color: 'var(--text-muted)'
            }}
          >
            Privacy Policy
          </Link>
        </div>

        {/* Clause 1 */}
        <section className="card" style={{ padding: '36px', marginBottom: '24px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '14px' }}>
              <ShieldCheck size={26} color="#10b981" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>1. Acceptance of Terms</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.02rem', color: 'var(--text-muted)' }}>
            By registering, downloading, browsing, or using the Agri Farms web or mobile application, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to all terms, you must immediately cease using our platform.
          </p>
        </section>

        {/* Clause 2 */}
        <section className="card" style={{ padding: '36px', marginBottom: '24px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '14px' }}>
              <UserCheck size={26} color="#3b82f6" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>2. User Registration & Account Responsibilities</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.02rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Users may register as either a <strong>Farmer</strong> (requesting rentals/services) or an <strong>Owner/Provider</strong> (listing equipment or workforce).
          </p>
          <ul style={{ lineHeight: '1.8', fontSize: '1rem', color: 'var(--text-muted)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>You must provide accurate, current, and verifiable mobile phone number and location details during registration.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</li>
            <li>Agri Farms reserves the right to suspend or terminate accounts that contain false information or violate platform policies.</li>
          </ul>
        </section>

        {/* Clause 3 */}
        <section className="card" style={{ padding: '36px', marginBottom: '24px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '10px', borderRadius: '14px' }}>
              <Truck size={26} color="#a855f7" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>3. Rental Marketplace & Service Listings</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.02rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Agri Farms acts as a digital intermediary platform connecting farmers with agricultural machinery owners and skilled farm workforce groups.
          </p>
          <ul style={{ lineHeight: '1.8', fontSize: '1rem', color: 'var(--text-muted)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Equipment Listings:</strong> Owners listing machinery (tractors, harvesters, tillers, sprayers) guarantee that equipment is in working condition, safe, and legally registered.</li>
            <li><strong>Workforce Services:</strong> Service providers offering field labor (sowing, harvesting, weeding) guarantee fair practices and accurate group sizing.</li>
            <li><strong>Intermediary Role:</strong> Agri Farms facilitates discovery, scheduling, and communication, but is not a direct owner or operator of listed assets.</li>
          </ul>
        </section>

        {/* Clause 4 */}
        <section className="card" style={{ padding: '36px', marginBottom: '24px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '14px' }}>
              <Clock size={26} color="#f59e0b" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>4. Bookings, Payments & Cancellations</h2>
          </div>
          <ul style={{ lineHeight: '1.8', fontSize: '1rem', color: 'var(--text-muted)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><strong>Booking Confirmation:</strong> Bookings are subject to asset availability and provider confirmation.</li>
            <li><strong>Pricing:</strong> Rental rates per hour, day, or acre are specified in listing details. Explicit asset rental terms set by the owner take precedence.</li>
            <li><strong>Cancellations:</strong> Either party may cancel a request prior to dispatch. Excessive last-minute cancellations may incur account penalties or service fees.</li>
          </ul>
        </section>

        {/* Clause 5 */}
        <section className="card" style={{ padding: '36px', marginBottom: '24px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '14px' }}>
              <AlertTriangle size={26} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>5. Limitation of Liability & Disclaimers</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.02rem', color: 'var(--text-muted)' }}>
            The materials and services on the Agri Farms application are provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis. Agri Farms makes no warranties, expressed or implied, regarding field performance, weather interruptions, machine breakdowns, or third-party disputes. In no event shall Agri Farms be liable for indirect, incidental, or consequential damages resulting from platform use.
          </p>
        </section>

        {/* Clause 6 */}
        <section className="card" style={{ padding: '36px', marginBottom: '30px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '14px' }}>
              <Scale size={26} color="#10b981" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>6. Governing Law & Contact Information</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.02rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            These Terms shall be governed by and construed in accordance with the laws of India. Any legal disputes arising out of the use of Agri Farms services shall be subject to jurisdiction in Andhra Pradesh, India.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.02)', padding: '16px 20px', borderRadius: '16px' }}>
            <HelpCircle size={20} color="#10b981" />
            <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600 }}>
              Questions about our Terms? Contact support at <a href="mailto:support@agrifarms.in" style={{ color: '#10b981', textDecoration: 'underline' }}>support@agrifarms.in</a> or visit our <Link to="/help" style={{ color: '#10b981', textDecoration: 'underline' }}>Help Center</Link>.
            </span>
          </div>
        </section>

      </motion.div>
    </div>
  );
};

export default TermsAndConditions;
