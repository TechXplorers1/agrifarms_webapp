import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Eye, 
  CheckCircle, 
  Share2, 
  UserX, 
  Server, 
  Mail, 
  FileText
} from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="privacy-policy-page" style={{ padding: '60px 20px', maxWidth: '960px', margin: '0 auto', color: 'var(--text-main)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', background: '#e8f5e9', padding: '16px', borderRadius: '50%', marginBottom: '20px' }}>
            <Shield size={40} color="#10b981" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '10px' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Google Play Store Compliant Privacy & Transparency Policy
          </p>
          <span style={{ fontSize: '0.85rem', color: '#10b981', background: '#e8f5e9', padding: '4px 12px', borderRadius: '12px', fontWeight: 700, display: 'inline-block', marginTop: '10px' }}>
            Effective Date: August 27, 2026 | Version 2.0
          </span>
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
          <Link
            to="/terms"
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
            Terms of Service
          </Link>
          <button
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: '#10b981',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
          >
            Privacy Policy
          </button>
        </div>

        {/* Section 1: Overview & Scope */}
        <section className="card" style={{ padding: '36px', marginBottom: '30px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Eye size={28} color="#10b981" />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>1. Application Overview & Scope</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-muted)' }}>
            <strong>AgriFarms</strong> ("we", "our", or "us") operates a multi-sided agricultural technology platform across mobile (Android/iOS) and web applications. The platform connects farmers, agricultural equipment owners (tractors, harvesters, sprayers), transport vehicle providers, and farm worker group leaders to facilitate agricultural machinery rentals, field logistics, and workforce hiring. We are committed to complete transparency regarding data collection, processing, third-party disclosures, security, and user data rights.
          </p>
        </section>

        {/* Section 2: Detailed Data Collection Inventory */}
        <section className="card" style={{ padding: '36px', marginBottom: '30px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <CheckCircle size={28} color="#3b82f6" />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>2. Comprehensive Data Collection Inventory</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            To deliver agricultural matching and booking services, AgriFarms collects and processes the following specific data categories:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '18px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>a. Personal Identifiable Information (PII)</h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Full Name, 10-digit Mobile Phone Number, Email Address, Profile Photo, User Account Role (Farmer, Equipment Owner, Worker Group Leader, Admin), and full postal address (House No, Street, Village, Mandal, District, State, Country, Pincode).
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '18px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>b. Precise & Approximate Location Data</h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                GPS Location Coordinates (Latitude & Longitude) captured via device location sensors to calculate proximity distance (in km) between farmers and nearby farm equipment, reverse-geocoded Village & District names, and field pickup/delivery addresses.
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '18px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>c. Equipment, Vehicle & Workforce Asset Details</h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Tractor/Machinery specifications (Brand, Model, Horsepower, Condition, Attached Implements), Vehicle Registration Numbers, Transport Load Capacity (Tons), Hourly/Daily Rental Pricing, Worker Headcount (Male/Female), and Daily Wage Rates.
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '18px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>d. Transactional & Booking Data</h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Scheduled start and end dates, field acreage/size, crop type, specialized field instructions, booking status history (Pending, Confirmed, Completed, Cancelled), cancellation reasons, and star ratings/reviews.
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '18px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>e. Technical, Device & Media Data</h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Firebase Push Notification Tokens (FCM), device locale/language preferences, notification toggle settings, uploaded machinery/vehicle pictures, and crop disease diagnostic photos posted to community discussion forums.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Third-Party Service Providers & SDK Disclosures */}
        <section className="card" style={{ padding: '36px', marginBottom: '30px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Server size={28} color="#8b5cf6" />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>3. Third-Party Service Providers & SDK Disclosures</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            In compliance with Google Play Store policies, we explicitly disclose all third-party services and Software Development Kits (SDKs) integrated into the AgriFarms ecosystem:
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ border: '1px solid rgba(0,0,0,0.08)', padding: '20px', borderRadius: '16px' }}>
              <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>MSG91 Gateway</strong>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                <strong>Purpose:</strong> Mobile phone number verification via 4-digit SMS OTP delivery.<br />
                <strong>Data Shared:</strong> Phone Number & OTP string via secure HTTPS API.
              </p>
            </div>

            <div style={{ border: '1px solid rgba(0,0,0,0.08)', padding: '20px', borderRadius: '16px' }}>
              <strong style={{ color: '#3b82f6', fontSize: '1.1rem' }}>Google Firebase (Auth & FCM)</strong>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                <strong>Purpose:</strong> Push notification delivery and optional phone token verification.<br />
                <strong>Data Shared:</strong> FCM Device Token, Phone Number, Notification Titles.
              </p>
            </div>

            <div style={{ border: '1px solid rgba(0,0,0,0.08)', padding: '20px', borderRadius: '16px' }}>
              <strong style={{ color: '#f59e0b', fontSize: '1.1rem' }}>AWS S3 (Amazon Cloud)</strong>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                <strong>Purpose:</strong> Secure cloud storage for user profile photos and equipment images.<br />
                <strong>Data Shared:</strong> Uploaded media files assigned unique UUID keys.
              </p>
            </div>

            <div style={{ border: '1px solid rgba(0,0,0,0.08)', padding: '20px', borderRadius: '16px' }}>
              <strong style={{ color: '#ec4899', fontSize: '1.1rem' }}>Keycloak OIDC Server</strong>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                <strong>Purpose:</strong> Enterprise single sign-on identity management and user synchronization.<br />
                <strong>Data Shared:</strong> User identity tokens & authentication claims.
              </p>
            </div>

            <div style={{ border: '1px solid rgba(0,0,0,0.08)', padding: '20px', borderRadius: '16px' }}>
              <strong style={{ color: '#14b8a6', fontSize: '1.1rem' }}>OpenStreetMap / Nominatim API</strong>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                <strong>Purpose:</strong> Reverse geocoding GPS coordinates to human-readable Village/District names.<br />
                <strong>Data Shared:</strong> Anonymous Latitude and Longitude coordinates.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Cross-User Data Sharing & Boundaries */}
        <section className="card" style={{ padding: '36px', marginBottom: '30px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Share2 size={28} color="#ec4899" />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>4. Information Sharing Boundaries & User Privacy</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            As an agricultural marketplace, data sharing between Farmers and Equipment/Service Providers is strictly scoped to essential operational information:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #10b981' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>What Farmers Can See About Vendors</h3>
              <p style={{ fontSize: '0.98rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Tractor/Vehicle specifications, Rental rates per hour/day, Operator availability, Overall rating (e.g., 4.8★), Business Name, Proximity distance in km, Village and District. <br />
                <strong style={{ color: '#10b981' }}>Privacy Scoping Boundary:</strong> The vendor's exact house number and personal street address are <strong>NOT</strong> displayed on public search listings; only general Village & District are shown.
              </p>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #3b82f6' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>What Vendors Can See About Farmers</h3>
              <p style={{ fontSize: '0.98rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Upon submitting a booking request: Farmer's Name, Contact Phone Number (for dispatch coordination), Field Location Address, Field GPS Coordinates, Scheduled Date/Time, Crop Type, and Acreage.<br />
                <strong style={{ color: '#3b82f6' }}>Privacy Scoping Boundary:</strong> Vendors can <strong>ONLY</strong> access farmer details for bookings submitted directly for their own listed assets. Vendors cannot search or browse unbooked farmer profiles.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Security Architecture */}
        <section className="card" style={{ padding: '36px', marginBottom: '30px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Lock size={28} color="#f59e0b" />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>5. Security Architecture & Encryption</h2>
          </div>
          <ul style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-muted)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li><strong style={{ color: 'var(--text-main)' }}>Encryption in Transit:</strong> All data transmitted between mobile/web clients and backend servers is encrypted using industry-standard TLS 1.3 / HTTPS.</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Secure Mobile Credential Storage:</strong> JWT access and refresh tokens are stored using device hardware security modules via <code>flutter_secure_storage</code> (iOS Keychain and Android KeyStore with AES-256 encryption).</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Backend Role Isolation:</strong> Spring Security stateless session management with Role-Based Access Control (RBAC) enforces strict separation between Farmer, Owner, and Admin permissions.</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Database & Media Protection:</strong> Stored in an enterprise PostgreSQL database with parameterized SQL queries preventing SQL injection. Uploaded images receive unique UUID keys with path sanitization blocking directory traversal attacks.</li>
          </ul>
        </section>

        {/* Section 6: Inactive User & Deletion Policy */}
        <section className="card" style={{ padding: '36px', marginBottom: '30px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <UserX size={28} color="#ef4444" />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>6. Inactive User Policy & Automatic Listing Disabling</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            AgriFarms enforces automatic status protection and availability toggles for inactive user accounts:
          </p>
          <ul style={{ lineHeight: '1.8', fontSize: '1rem', color: 'var(--text-muted)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><strong>Automatic Availability Disabling:</strong> If a user account is set to <code>Inactive</code>, <code>Deactivated</code>, <code>Suspended</code>, or <code>Banned</code>, all machinery, transport vehicles, services, and worker groups owned by that user are <strong>automatically set to inactive (<code>isAvailable = false</code>)</strong>, immediately removing them from public search results.</li>
            <li><strong>Retention Timeline:</strong> Active user data is retained as long as the account remains in use. Accounts inactive for 180+ days are archived to cold storage. Accounts inactive for 365+ days undergo PII anonymization or data purging unless retention is required for legal/financial transaction compliance.</li>
          </ul>
        </section>

        {/* Section 7: User Data Rights & Play Store Account Deletion Request */}
        <section className="card" style={{ padding: '36px', marginBottom: '30px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <FileText size={28} color="#10b981" />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>7. User Data Rights & Account Deletion Request</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            In compliance with Google Play Store Data Safety & Account Deletion policies, you have the following rights regarding your personal data:
          </p>
          <ul style={{ lineHeight: '1.8', fontSize: '1rem', color: 'var(--text-muted)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <li><strong>Right to Access & Correct:</strong> You may view or update your profile details directly from the Profile section of the app or web portal.</li>
            <li><strong>Right to Request Account & Data Deletion:</strong> You have the right to request full deletion of your account, personal details, asset listings, and associated data.</li>
          </ul>

          <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <strong style={{ fontSize: '1.05rem', color: '#10b981', display: 'block', marginBottom: '8px' }}>
              How to Request Account & Data Deletion:
            </strong>
            <p style={{ fontSize: '0.98rem', color: 'var(--text-main)', lineHeight: '1.6', margin: 0 }}>
              1. **In-App:** Go to <strong>Profile Settings → Security & Account → Delete Account</strong>.<br />
              2. **Via Email:** Send an email from your registered email address to <a href="mailto:privacy@agrifarms.in" style={{ color: '#10b981', fontWeight: 700 }}>privacy@agrifarms.in</a> with the subject line <code>"Account Deletion Request"</code> and include your registered mobile phone number. Account deletion requests are processed within 7 business days.
            </p>
          </div>
        </section>

        {/* Section 8: Contact Us */}
        <section className="card" style={{ padding: '36px', marginBottom: '30px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Mail size={28} color="#3b82f6" />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>8. Contact Us & Data Protection Officer</h2>
          </div>
          <p style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            If you have questions, concerns, or inquiries regarding this Privacy Policy or our data protection practices, please contact our Data Protection Team:
          </p>
          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '20px', borderRadius: '16px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>
              AgriFarms Data Protection Office
            </p>
            <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              Email: <a href="mailto:privacy@agrifarms.in" style={{ color: '#10b981', textDecoration: 'underline' }}>privacy@agrifarms.in</a> / <a href="mailto:support@agrifarms.in" style={{ color: '#10b981', textDecoration: 'underline' }}>support@agrifarms.in</a>
            </p>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              Jurisdiction: Andhra Pradesh, India
            </p>
          </div>
        </section>

      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
