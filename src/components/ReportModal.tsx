import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Flag } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../services/AuthContext';

interface ReportModalProps {
  itemId: string;
  itemName: string;
  providerId: string;
  providerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const REASONS = [
  'Inappropriate or offensive photos / content',
  'Fraud, scam, or misleading information',
  'Incorrect phone number or price rate',
  'Abusive or harassment behavior',
  'Other objectionable behavior',
];

const ReportModal: React.FC<ReportModalProps> = ({ itemId, itemName, providerId, providerName, onClose, onSuccess }) => {
  const [selectedReason, setSelectedReason] = useState<string>(REASONS[0]);
  const [notes, setNotes] = useState('');
  const [blockProvider, setBlockProvider] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError('');
    
    try {
      await apiService.submitReport({
        reporterUserId: user.id,
        reportedItemId: itemId,
        reportedItemName: itemName,
        reportedProviderId: providerId,
        reason: selectedReason,
        details: notes,
        blocked: blockProvider,
        timestamp: new Date().toISOString(),
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to submit report:', err);
      setError('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)', // Slightly darker
      backdropFilter: 'blur(8px)', // Stronger blur
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 9999, // Guaranteed to be over everything, including the navbar
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          backgroundColor: '#fff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: 'calc(100vh - 48px)', // Safe maximum height leaving padding
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: '#666',
            zIndex: 10
          }}
        >
          <X size={24} />
        </button>

        {/* Fixed Header */}
        <div style={{ padding: '24px 24px 16px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', backgroundColor: '#fef2f2', borderRadius: '12px' }}>
              <Flag size={22} color="#b91c1c" />
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
              Report Listing
            </h2>
          </div>

          <p style={{ margin: '0', color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
            Help us understand what is wrong with <strong>"{itemName}"</strong> by <strong>{providerName}</strong>:
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ padding: '0 24px 24px 24px', overflowY: 'auto' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {REASONS.map((reason) => (
                <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    style={{ accentColor: '#10b981', transform: 'scale(1.2)' }}
                  />
                  <span style={{ fontSize: '14px', color: selectedReason === reason ? '#064e3b' : '#334155', fontWeight: selectedReason === reason ? 600 : 500 }}>
                    {reason}
                  </span>
                </label>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details (optional)..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  resize: 'vertical',
                  minHeight: '80px',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '12px', marginBottom: '24px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={blockProvider}
                onChange={(e) => setBlockProvider(e.target.checked)}
                style={{ accentColor: '#b91c1c', transform: 'scale(1.2)' }}
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#7f1d1d' }}>
                Block this provider (hide all their listings from you)
              </span>
            </label>

            {error && (
              <p style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '15px',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none'
                }}
              >
                {isSubmitting && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportModal;
