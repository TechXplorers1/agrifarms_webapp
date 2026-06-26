import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, ChevronDown, ChevronUp, LifeBuoy, MessageCircle, MapPin } from 'lucide-react';

const faqs = [
  {
    question: "How do I book a tractor?",
    answer: "To book a tractor, navigate to the 'Rentals' section, search for the type of tractor you need, select it, and choose 'Book Now'. The provider will confirm your request."
  },
  {
    question: "What happens if a provider rejects my request?",
    answer: "If a provider rejects your request, you will receive a notification with the reason. You can easily search for another provider offering the same service and send a new request."
  },
  {
    question: "How do I upload my machinery for rent?",
    answer: "Go to 'Manage Assets' from your profile menu and click the '+ Add New' button. Fill out the details, upload photos, set your price, and submit it for approval."
  },
  {
    question: "How do payments work?",
    answer: "Currently, Agrifarms facilitates the connection. Payments are made directly to the provider in cash or via UPI at the time of service completion, as agreed upon during booking."
  }
];

const HelpSupport: React.FC = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="support-page fade-in">
      {/* Hero Section */}
      <div className="support-hero">
        <div className="container" style={{ textAlign: 'center', paddingTop: '40px', paddingBottom: '40px' }}>
          <div className="hero-icon-wrap">
            <LifeBuoy size={56} color="#10b981" />
          </div>
          <h1 className="text-4xl font-extrabold" style={{ color: '#1b5e20', marginBottom: '16px' }}>How can we help you?</h1>
          <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Search for answers, browse our FAQs, or contact our support team directly. We are here to ensure your farming journey is smooth.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '80px', paddingTop: '40px' }}>
        <div className="support-grid">
          
          {/* FAQ Section */}
          <div className="faq-section">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1b5e20', marginBottom: '24px' }}>Frequently Asked Questions</h2>
            <div className="faq-list">
              {faqs.map((faq, index) => {
                const isExpanded = expandedFaq === index;
                return (
                  <motion.div 
                    key={index}
                    className="faq-card card"
                    onClick={() => setExpandedFaq(isExpanded ? null : index)}
                    layout
                  >
                    <div className="faq-header">
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, flex: 1 }}>{faq.question}</h3>
                      {isExpanded ? <ChevronUp size={20} color="var(--primary)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <p style={{ paddingTop: '16px', color: '#475569', lineHeight: 1.6 }}>
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Contact Methods Section */}
          <div className="contact-section">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1b5e20', marginBottom: '24px' }}>Contact Us</h2>
            
            <div className="contact-card card">
              <div className="contact-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                <Phone size={24} />
              </div>
              <div className="contact-info">
                <h3>Call Support</h3>
                <p>Available Mon-Sat, 9AM to 6PM</p>
                <a href="tel:18001234567" className="contact-link">1800-123-4567</a>
              </div>
            </div>

            <div className="contact-card card">
              <div className="contact-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
                <Mail size={24} />
              </div>
              <div className="contact-info">
                <h3>Email Us</h3>
                <p>We'll reply within 24 hours</p>
                <a href="mailto:support@agrifarms.com" className="contact-link">support@agrifarms.com</a>
              </div>
            </div>

            <div className="contact-card card">
              <div className="contact-icon" style={{ background: '#f0fdf4', color: '#10b981' }}>
                <MessageCircle size={24} />
              </div>
              <div className="contact-info">
                <h3>WhatsApp Chat</h3>
                <p>Instant messaging support</p>
                <a href="#" className="contact-link" style={{ color: '#10b981' }}>Start Chat</a>
              </div>
            </div>

            <div className="contact-card card" style={{ marginTop: '32px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div className="contact-icon" style={{ background: 'white', color: '#64748b' }}>
                <MapPin size={24} />
              </div>
              <div className="contact-info">
                <h3>Office Address</h3>
                <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                  Agrifarms Technology Ltd.<br/>
                  Innovation Park, Cyber City<br/>
                  Hyderabad, Telangana 500081
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .support-page {
          width: 100%;
        }

        .support-hero {
          background: white;
          border-bottom: 1px solid #f1f5f9;
          border-radius: 0 0 40px 40px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          margin-bottom: 40px;
        }

        .hero-icon-wrap {
          width: 96px;
          height: 96px;
          background: #dcfce7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px auto;
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.2);
        }

        .support-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
        }

        @media (min-width: 900px) {
          .support-grid {
            grid-template-columns: 3fr 2fr;
          }
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-card {
          padding: 20px 24px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .faq-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .faq-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .contact-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .contact-card {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: transform 0.2s;
        }

        .contact-card:hover {
          transform: translateX(4px);
        }

        .contact-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .contact-info h3 {
          font-size: 1.1rem;
          margin: 0 0 4px 0;
          color: var(--text-main);
        }

        .contact-info p {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin: 0 0 8px 0;
        }

        .contact-link {
          font-weight: 800;
          color: var(--primary);
          font-size: 0.95rem;
        }

        .contact-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default HelpSupport;
