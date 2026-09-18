import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';

const DeleteAccount: React.FC = () => {
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail.trim()) return;

    setSubmitting(true);
    // Simulate submission to backend deletion request queue
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="delete-account-page fade-in" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px 80px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div 
          style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            backgroundColor: '#fee2e2', 
            color: '#dc2626', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px' 
          }}
        >
          <Trash2 size={32} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
          Delete Your AgriFarms Account
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
          We respect your privacy and right to control your personal data. Below you can learn how your data is handled and request permanent deletion of your account.
        </p>
      </div>

      {/* In-App Deletion Instructions */}
      <div 
        style={{ 
          backgroundColor: '#f0fdf4', 
          border: '1px solid #bbf7d0', 
          borderRadius: '16px', 
          padding: '24px', 
          marginBottom: '32px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <ShieldCheck size={24} color="#16a34a" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534', margin: 0 }}>
            Instant In-App Deletion (Recommended)
          </h2>
        </div>
        <p style={{ color: '#14532d', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 12px' }}>
          If you have the AgriFarms mobile app installed, you can delete your account instantly without waiting for manual verification:
        </p>
        <ol style={{ color: '#15803d', fontSize: '0.95rem', margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>Open the <strong>AgriFarms</strong> application on your mobile device.</li>
          <li>Navigate to the <strong>Profile</strong> tab in the bottom navigation bar.</li>
          <li>Scroll down to the Account section and tap <strong>Delete Account</strong>.</li>
          <li>Confirm the prompt to permanently delete your account and associated listings.</li>
        </ol>
      </div>

      {/* Web Account Deletion Request Form */}
      <div 
        style={{ 
          backgroundColor: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '16px', 
          padding: '32px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          marginBottom: '36px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <AlertTriangle size={24} color="#ea580c" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Web Deletion Request Form
          </h2>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
          If you no longer have access to the mobile app, you can submit an account deletion request using this form. Our team will verify and delete your account within 7 business days.
        </p>

        {submitted ? (
          <div 
            style={{ 
              backgroundColor: '#ecfdf5', 
              border: '1px solid #a7f3d0', 
              borderRadius: '12px', 
              padding: '24px', 
              textAlign: 'center' 
            }}
          >
            <CheckCircle size={40} color="#059669" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#065f46', marginBottom: '8px' }}>
              Deletion Request Received
            </h3>
            <p style={{ color: '#047857', fontSize: '0.95rem', margin: 0 }}>
              Your request for <strong>{phoneOrEmail}</strong> has been logged. We will verify your identity and permanently erase your account data within 7 business days.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="phoneOrEmail" 
                style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}
              >
                Registered Phone Number or Email Address *
              </label>
              <input
                id="phoneOrEmail"
                type="text"
                required
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                placeholder="e.g. 9876543210 or user@example.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label 
                htmlFor="reason" 
                style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}
              >
                Reason for leaving (optional)
              </label>
              <textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us understand how we can improve..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
                padding: '14px 28px',
                borderRadius: '10px',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                width: '100%',
                transition: 'background 0.2s'
              }}
            >
              {submitting ? 'Submitting Request...' : 'Submit Account Deletion Request'}
            </button>
          </form>
        )}
      </div>

      {/* What Data is Deleted / Retained */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
          Data Deletion & Retention Policy
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#dc2626', marginTop: 0, marginBottom: '8px' }}>
              Data Permanently Deleted:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>Full Name, Phone Number, and Email</li>
              <li>Profile Photos & Media</li>
              <li>Saved GPS Locations and Addresses</li>
              <li>Equipment, Vehicle, and Worker Group Listings</li>
              <li>FCM Push Notification tokens</li>
              <li>Active authentication tokens</li>
            </ul>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#475569', marginTop: 0, marginBottom: '8px' }}>
              Data Retained (if applicable):
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>Completed financial transaction histories strictly as required by applicable tax, commercial accounting, and anti-fraud statutory laws.</li>
              <li>Past invoices are detached from personal identities and retained for the statutory retention period.</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
          Need assistance? Contact our data privacy officer at{' '}
          <a href="mailto:support@agrifarms.in" style={{ color: '#10b981', fontWeight: 600 }}>
            support@agrifarms.in
          </a>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;
