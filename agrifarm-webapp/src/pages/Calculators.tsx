import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Droplets, FlaskConical, Sprout, ChevronRight } from 'lucide-react';
import { 
  calculateFertilizer, 
  calculatePesticide, 
  calculateROI
} from '../utils/calculatorUtils';
import type {
  FertilizerResult,
  PesticideResult,
  ROIResult
} from '../utils/calculatorUtils';

type TabType = 'Fertilizer' | 'Pesticide' | 'ROI';

const Calculators: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Fertilizer');

  // Fertilizer State
  const [crop, setCrop] = useState('Wheat');
  const [fertArea, setFertArea] = useState('');
  const [fertResult, setFertResult] = useState<FertilizerResult | null>(null);

  // Pesticide State
  const [pestDosage, setPestDosage] = useState('');
  const [pestCapacity, setPestCapacity] = useState('15'); // default 15L tank
  const [pestArea, setPestArea] = useState('');
  const [pestResult, setPestResult] = useState<PesticideResult | null>(null);

  // ROI State
  const [roiCost, setRoiCost] = useState('');
  const [roiYield, setRoiYield] = useState('');
  const [roiPrice, setRoiPrice] = useState('');
  const [roiResult, setRoiResult] = useState<ROIResult | null>(null);

  const handleFertilizerCalculate = () => {
    const area = parseFloat(fertArea);
    if (!area || area <= 0) return;
    setFertResult(calculateFertilizer(crop, area));
  };

  const handlePesticideCalculate = () => {
    const dosage = parseFloat(pestDosage);
    const capacity = parseFloat(pestCapacity);
    const area = parseFloat(pestArea);
    if (!dosage || !capacity || !area) return;
    setPestResult(calculatePesticide(dosage, capacity, area));
  };

  const handleROICalculate = () => {
    const cost = parseFloat(roiCost);
    const yieldCount = parseFloat(roiYield);
    const price = parseFloat(roiPrice);
    if (isNaN(cost) || isNaN(yieldCount) || isNaN(price)) return;
    setRoiResult(calculateROI(cost, yieldCount, price));
  };

  return (
    <div className="calculators-page container fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">Farming Calculators</h1>
          <p className="text-slate-500">Calculate fertilizer ratios, pesticide mixtures, and ROI</p>
        </div>
        <div className="header-icon" style={{ padding: '16px', background: '#e0f2fe', color: '#0284c7', borderRadius: '16px' }}>
          <Calculator size={32} />
        </div>
      </div>

      <div className="tab-switcher">
        <button
          className={activeTab === 'Fertilizer' ? 'active' : ''}
          onClick={() => setActiveTab('Fertilizer')}
        >
          <FlaskConical size={18} style={{ marginRight: '8px', display: 'inline-block' }} />
          Fertilizer
        </button>
        <button
          className={activeTab === 'Pesticide' ? 'active' : ''}
          onClick={() => setActiveTab('Pesticide')}
        >
          <Droplets size={18} style={{ marginRight: '8px', display: 'inline-block' }} />
          Pesticide
        </button>
        <button
          className={activeTab === 'ROI' ? 'active' : ''}
          onClick={() => setActiveTab('ROI')}
        >
          <Sprout size={18} style={{ marginRight: '8px', display: 'inline-block' }} />
          Farming ROI
        </button>
      </div>

      <div className="calculator-content">
        <AnimatePresence mode="wait">
          {activeTab === 'Fertilizer' && (
            <motion.div
              key="fert"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="calc-card card"
            >
              <h3>NPK Fertilizer Requirements</h3>
              <div className="input-group">
                <label>Select Crop</label>
                <select value={crop} onChange={(e) => setCrop(e.target.value)}>
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Maize">Maize</option>
                </select>
              </div>
              <div className="input-group">
                <label>Field Area (Acres)</label>
                <input 
                  type="number" 
                  placeholder="E.g., 5"
                  value={fertArea} 
                  onChange={(e) => setFertArea(e.target.value)} 
                />
              </div>
              <button className="btn-primary calculate-btn" onClick={handleFertilizerCalculate}>
                Calculate NPK
              </button>

              {fertResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="result-box">
                  <h4>Recommended Fertilizer (Approx)</h4>
                  <div className="result-row">
                    <span>Urea (Nitrogen)</span>
                    <strong>{fertResult.Urea.toFixed(2)} kg</strong>
                  </div>
                  <div className="result-row">
                    <span>DAP (Phosphorus)</span>
                    <strong>{fertResult.DAP.toFixed(2)} kg</strong>
                  </div>
                  <div className="result-row">
                    <span>MOP (Potassium)</span>
                    <strong>{fertResult.MOP.toFixed(2)} kg</strong>
                  </div>
                  <p className="disclaimer">* Values are standard recommendations. Actual needs may vary based on soil testing.</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'Pesticide' && (
            <motion.div
              key="pest"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="calc-card card"
            >
              <h3>Chemical Spray Ratio</h3>
              <div className="input-group">
                <label>Chemical Dosage (ml per Litre of water)</label>
                <input 
                  type="number" 
                  placeholder="E.g., 2.5"
                  value={pestDosage} 
                  onChange={(e) => setPestDosage(e.target.value)} 
                />
              </div>
              <div className="input-group">
                <label>Sprayer Tank Capacity (Litres)</label>
                <input 
                  type="number" 
                  placeholder="E.g., 15"
                  value={pestCapacity} 
                  onChange={(e) => setPestCapacity(e.target.value)} 
                />
              </div>
              <div className="input-group">
                <label>Total Area to Spray (Acres)</label>
                <input 
                  type="number" 
                  placeholder="E.g., 2"
                  value={pestArea} 
                  onChange={(e) => setPestArea(e.target.value)} 
                />
              </div>
              <button className="btn-primary calculate-btn" onClick={handlePesticideCalculate}>
                Calculate Mixture
              </button>

              {pestResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="result-box">
                  <h4>Required Mixture</h4>
                  <div className="result-row">
                    <span>Total Chemical Required</span>
                    <strong>{pestResult.TotalChemicalMl.toFixed(0)} ml</strong>
                  </div>
                  <div className="result-row">
                    <span>Total Water Required</span>
                    <strong>{pestResult.TotalWaterL.toFixed(0)} Litres</strong>
                  </div>
                  <div className="result-row">
                    <span>Total Tanks Needed</span>
                    <strong>{pestResult.TotalTanks} Tanks</strong>
                  </div>
                  <p className="disclaimer">* Based on an average of 150L water per acre. Adjust spray speed accordingly.</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'ROI' && (
            <motion.div
              key="roi"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="calc-card card"
            >
              <h3>Yield & Profitability</h3>
              <div className="input-group">
                <label>Total Production Cost (₹)</label>
                <input 
                  type="number" 
                  placeholder="Seed, Labor, Tractor, etc."
                  value={roiCost} 
                  onChange={(e) => setRoiCost(e.target.value)} 
                />
              </div>
              <div className="input-group">
                <label>Expected Yield (Quintals/Tons)</label>
                <input 
                  type="number" 
                  placeholder="E.g., 20"
                  value={roiYield} 
                  onChange={(e) => setRoiYield(e.target.value)} 
                />
              </div>
              <div className="input-group">
                <label>Selling Price per Unit (₹)</label>
                <input 
                  type="number" 
                  placeholder="E.g., 2200"
                  value={roiPrice} 
                  onChange={(e) => setRoiPrice(e.target.value)} 
                />
              </div>
              <button className="btn-primary calculate-btn" onClick={handleROICalculate}>
                Calculate ROI
              </button>

              {roiResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="result-box">
                  <h4>Profitability Estimate</h4>
                  <div className="result-row">
                    <span>Estimated Revenue</span>
                    <strong style={{ color: '#10b981' }}>₹{roiResult.Revenue.toFixed(2)}</strong>
                  </div>
                  <div className="result-row">
                    <span>Net Profit/Loss</span>
                    <strong style={{ color: roiResult.NetProfit >= 0 ? '#10b981' : '#ef4444' }}>
                      {roiResult.NetProfit >= 0 ? '+' : ''}₹{roiResult.NetProfit.toFixed(2)}
                    </strong>
                  </div>
                  <div className="result-row">
                    <span>Return on Investment (ROI)</span>
                    <strong style={{ color: roiResult.ROI >= 0 ? '#10b981' : '#ef4444' }}>
                      {roiResult.ROI.toFixed(1)}%
                    </strong>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .calculators-page {
          padding-top: 24px;
          max-width: 800px !important;
          padding-bottom: 60px;
        }

        .tab-switcher {
          display: flex;
          background: #f1f5f9;
          padding: 6px;
          border-radius: 16px;
          margin: 32px 0;
        }

        .tab-switcher button {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .tab-switcher button.active {
          background: white;
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        .calc-card {
          padding: 32px;
          max-width: 600px;
          margin: 0 auto;
        }

        .calc-card h3 {
          margin-bottom: 24px;
          color: var(--text-main);
          font-size: 1.5rem;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          font-weight: 700;
          font-size: 0.85rem;
          margin-bottom: 8px;
          color: var(--text-main);
        }

        .input-group input, .input-group select {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 1rem;
          background: #f8fafc;
          transition: all 0.2s;
          font-weight: 500;
        }

        .input-group input:focus, .input-group select:focus {
          outline: none;
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .calculate-btn {
          width: 100%;
          padding: 16px;
          font-size: 1.05rem;
          border-radius: 12px;
          margin-top: 10px;
          margin-bottom: 24px;
        }

        .result-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 16px;
          padding: 24px;
        }

        .result-box h4 {
          color: #166534;
          margin-bottom: 16px;
          font-size: 1.1rem;
          border-bottom: 1px solid #dcfce7;
          padding-bottom: 12px;
        }

        .result-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 1rem;
        }

        .result-row span {
          color: #166534;
          font-weight: 600;
        }

        .result-row strong {
          color: #14532d;
          font-size: 1.15rem;
        }

        .disclaimer {
          font-size: 0.75rem;
          color: #166534;
          opacity: 0.7;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #dcfce7;
        }
      `}</style>
    </div>
  );
};

export default Calculators;
