import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Droplets, Cloud, Wheat, TreeDeciduous, Circle, ChevronDown, ChevronUp } from 'lucide-react';

const crops = [
  {
    name: 'Wheat',
    icon: <Wheat size={32} color="#d97706" />,
    color: '#fef3c7',
    details: {
      Overview: 'Wheat is a major Rabi crop, best grown in cool winters.',
      Sowing: 'Nov 1 - Nov 30\nSeed Rate: 40-50 kg/acre\nSpacing: 20-22.5 cm rows',
      Fertilizer: 'Nitrogen: 50kg/acre (Split 3 times)\nPhosphorus: 25kg/acre (Basal)\nPotash: 20kg/acre (Basal)',
      Protection: 'Termites: Chlorpyriphos 20 EC @ 1L/acre\nRust: Propiconazole @ 200ml/acre',
      Harvest: 'When grain is hard and moisture is < 20%.\nTypical months: April-May',
    }
  },
  {
    name: 'Rice (Paddy)',
    icon: <Droplets size={32} color="#059669" />,
    color: '#d1fae5',
    details: {
      Overview: 'Primary Kharif crop, requires high water availability.',
      Sowing: 'Nursery: May-June\nTransplanting: June-July\nSeed Rate: 10-12 kg/acre',
      Fertilizer: 'Nitrogen: 40kg/acre\nPhosphorus: 20kg/acre\nZinc Sulphate: 10kg/acre',
      Protection: 'Stem Borer: Cartap Hydrochloride\nBlast: Tricyclazole',
      Harvest: 'When 80% panicles turn golden yellow.\nTypical months: Oct-Nov',
    }
  },
  {
    name: 'Cotton',
    icon: <Cloud size={32} color="#475569" />,
    color: '#f1f5f9',
    details: {
      Overview: 'Cash crop, requires warm climate and deep black soil.',
      Sowing: 'Warning: Prevent Pink Bollworm\nMay 15 - June 15\nSeed Rate: 2 packets/acre (Bt)',
      Fertilizer: 'High N requirement.\nN: 60kg, P: 30kg, K: 20kg per acre.',
      Protection: 'Sucking pests: Imidacloprid\nBollworms: Integrated Pest Management',
      Harvest: 'Pick clean, dry bolls in morning hours.\nUsually 3-4 pickings.',
    }
  },
  {
    name: 'Sugarcane',
    icon: <TreeDeciduous size={32} color="#15803d" />,
    color: '#dcfce7',
    details: {
      Overview: 'Long duration crop (10-12 months). Heavy feeder.',
      Sowing: 'Spring: Feb-March\nAutumn: Sept-Oct\nSeed: 3 bud setts @ 15,000/acre',
      Fertilizer: 'Nitrogen: 100kg/acre\nPhosphorus: 40kg/acre\nApply N in 4 splits.',
      Protection: 'Borer: Chlorantraniliprole\nRed Rot: Treat setts with Carbendazim',
      Harvest: 'When brix reading is > 18%.\nCut close to ground level.',
    }
  },
  {
    name: 'Maize',
    icon: <Sprout size={32} color="#ea580c" />,
    color: '#ffedd5',
    details: {
      Overview: 'Versatile crop, grown in Kharif, Rabi and Spring.',
      Sowing: 'Kharif: June-July\nSeed Rate: 8-10 kg/acre\nSpacing: 60x20 cm',
      Fertilizer: 'N: 50kg, P: 25kg, K: 20kg per acre.\nApply Zinc if needed.',
      Protection: 'Fall Armyworm: Emamectin Benzoate',
      Harvest: 'Cobs turn dry and pale brown.',
    }
  },
  {
    name: 'Tomato',
    icon: <Circle size={32} color="#dc2626" />,
    color: '#fee2e2',
    details: {
      Overview: 'Popular vegetable crop.',
      Sowing: 'Nursery raising required.\nTransplant after 25 days.\nSpacing: 60x45 cm',
      Fertilizer: 'FYM: 10 tons/acre\nN:P:K 40:24:24 kg/acre',
      Protection: 'Leaf Curl: Control Whitefly with Acetamiprid\nBlight: Mancozeb',
      Harvest: 'Pick at breaker stage for distant market.',
    }
  }
];

const CropAdvisory: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="crop-advisory-page container fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">Crop Advisory</h1>
          <p className="text-slate-500">Expert guidance and schedules for maximum yield</p>
        </div>
        <div className="header-icon" style={{ padding: '16px', background: '#dcfce7', color: '#16a34a', borderRadius: '16px' }}>
          <Sprout size={32} />
        </div>
      </div>

      <div className="crops-grid">
        {crops.map((crop, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <motion.div 
              key={index}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="crop-card card"
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
            >
              <div className="crop-header">
                <div className="crop-icon-wrap" style={{ backgroundColor: crop.color }}>
                  {crop.icon}
                </div>
                <h3>{crop.name}</h3>
                <button className="expand-btn">
                  {isExpanded ? <ChevronUp size={24} color="var(--text-muted)" /> : <ChevronDown size={24} color="var(--text-muted)" />}
                </button>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="crop-details">
                      {Object.entries(crop.details).map(([key, value]) => (
                        <div key={key} className="detail-section">
                          <h4>{key}</h4>
                          <p>{value.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                              {line}<br/>
                            </React.Fragment>
                          ))}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <style>{`
        .crop-advisory-page {
          padding-top: 24px;
          max-width: 900px !important;
          padding-bottom: 60px;
        }

        .crops-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 24px;
        }

        .crop-card {
          padding: 24px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .crop-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .crop-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .crop-header h3 {
          flex: 1;
          font-size: 1.35rem;
          margin: 0;
          color: var(--text-main);
        }

        .crop-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .expand-btn {
          background: transparent;
          padding: 8px;
          border-radius: 50%;
        }

        .expand-btn:hover {
          background: #f1f5f9;
        }

        .crop-details {
          padding-top: 24px;
          margin-top: 16px;
          border-top: 1px solid #f1f5f9;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .detail-section h4 {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--primary);
          margin-bottom: 8px;
          font-weight: 800;
        }

        .detail-section p {
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default CropAdvisory;
