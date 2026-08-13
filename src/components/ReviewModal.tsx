import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star, Loader2 } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../services/AuthContext';

interface ReviewModalProps {
  bookingId: string;
  assetId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ bookingId, assetId, onClose, onSuccess }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    setError('');
    
    try {
      await apiService.submitReview({
        bookingId,
        assetId,
        reviewerId: user.id,
        rating,
        comment,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('Failed to submit review. Please try again.');
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
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '450px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
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
            color: '#666'
          }}
        >
          <X size={24} />
        </button>

        <div style={{ padding: '24px' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600, color: '#333' }}>
            Leave a Review
          </h2>
          <p style={{ margin: '0 0 24px 0', color: '#666' }}>
            How was your experience with this service?
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    transition: 'transform 0.2s',
                    transform: (hoveredRating === star || rating === star) ? 'scale(1.2)' : 'scale(1)'
                  }}
                >
                  <Star
                    size={32}
                    style={{
                      fill: (hoveredRating >= star || rating >= star) ? '#FFD700' : 'transparent',
                      color: (hoveredRating >= star || rating >= star) ? '#FFD700' : '#ccc'
                    }}
                  />
                </button>
              ))}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>
                Additional Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  resize: 'vertical',
                  minHeight: '100px',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {error && (
              <p style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: (isSubmitting || rating === 0) ? 0.7 : 1,
                cursor: (isSubmitting || rating === 0) ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '16px',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none'
              }}
            >
              {isSubmitting && <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />}
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ReviewModal;
