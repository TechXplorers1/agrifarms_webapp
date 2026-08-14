import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, CheckCircle } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {

  return (
    <div className="privacy-policy-page" style={{ padding: '60px 20px', maxWidth: '900px', margin: '0 auto', color: 'var(--text-main)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ display: 'inline-flex', background: '#e8f5e9', padding: '16px', borderRadius: '50%', marginBottom: '20px' }}>
            <Shield size={40} color="#10b981" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '10px' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Your data, your trust, our priority.</p>
        </div>

        <section className="card" style={{ padding: '40px', marginBottom: '30px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Eye size={28} color="#10b981" />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Our Agenda</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-muted)' }}>
            Agri Farms operates a two-sided agricultural marketplace designed to empower farmers and agricultural service providers. Our platform facilitates the seamless renting of agricultural equipment, vehicles, and the hiring of skilled worker groups. By bridging the gap between supply and demand, we aim to modernize farming operations, increase efficiency, and foster a collaborative agricultural community.
          </p>
        </section>

        <section className="card" style={{ padding: '40px', marginBottom: '30px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <CheckCircle size={28} color="#3b82f6" />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Data Privacy & What We Maintain</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            We are committed to minimizing data collection to only what is necessary for the platform to function effectively. We maintain the following information privately:
          </p>
          <ul style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-muted)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><strong style={{ color: 'var(--text-main)' }}>Identity Information:</strong> Names, phone numbers, and securely managed authentication details.</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Location Data:</strong> Village and district information (along with coordinates) necessary for matching you with local agricultural assets and services.</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Transactional Data:</strong> Booking histories, asset listings, and platform activity to ensure a reliable marketplace experience.</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Media Assets:</strong> Images of equipment and profile pictures securely stored and linked to your account.</li>
          </ul>
        </section>

        <section className="card" style={{ padding: '40px', marginBottom: '30px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Lock size={28} color="#f59e0b" />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>How We Are Secured</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Your security is our top priority. The Agri Farms ecosystem employs robust, industry-standard security measures:
          </p>
          <ul style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-muted)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><strong style={{ color: 'var(--text-main)' }}>Authentication:</strong> We utilize secure token-based authentication (JWT) backed by our robust OAuth2 Resource Server.</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Secure Communication:</strong> All data transmitted between the web application and our backend servers is encrypted using standard web protocols.</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Data Storage:</strong> Your data is securely stored in an enterprise-grade PostgreSQL database managed by a modern Spring Boot backend, with media assets safely handled via cloud storage.</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Authorization:</strong> Strict role-based access control (FARMER vs. PROVIDER) ensures that users can only access or modify data they are explicitly authorized to view.</li>
          </ul>
        </section>
        
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
