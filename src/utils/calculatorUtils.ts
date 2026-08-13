export const cropRequirements: Record<string, { N: number; P: number; K: number }> = {
  'Wheat': { N: 50, P: 25, K: 20 }, // kg/acre
  'Rice': { N: 40, P: 20, K: 15 },
  'Cotton': { N: 60, P: 30, K: 20 },
  'Sugarcane': { N: 100, P: 40, K: 30 },
  'Maize': { N: 50, P: 25, K: 20 },
};

// Content percentage in fertilizers
export const ureaN = 0.46; // 46% Nitrogen
export const dapN = 0.18;  // 18% Nitrogen
export const dapP = 0.46;  // 46% Phosphorus
export const mopK = 0.60;  // 60% Potassium

export interface FertilizerResult {
  Urea: number;
  DAP: number;
  MOP: number;
}

export function calculateFertilizer(crop: string, areaInAcres: number): FertilizerResult | null {
  if (!cropRequirements[crop]) return null;

  const req = cropRequirements[crop];
  const totalN = req.N * areaInAcres;
  const totalP = req.P * areaInAcres;
  const totalK = req.K * areaInAcres;

  // 1. Calculate DAP for Phosphorus (and some Nitrogen)
  // DAP contains 46% P and 18% N
  const dapNeededKg = totalP / dapP; 
  const nitrogenSuppliedByDAP = dapNeededKg * dapN;

  // 2. Calculate Remaining Nitrogen for Urea
  const remainingN = totalN - nitrogenSuppliedByDAP;
  const ureaNeededKg = remainingN > 0 ? remainingN / ureaN : 0.0;

  // 3. Calculate MOP for Potassium
  const mopNeededKg = totalK / mopK;

  return {
    Urea: dapNeededKg > 0 || ureaNeededKg > 0 ? ureaNeededKg : 0, // Ensure no negative edge cases
    DAP: dapNeededKg,
    MOP: mopNeededKg,
  };
}

export interface PesticideResult {
  TotalChemicalMl: number;
  TotalWaterL: number;
  TotalTanks: number;
}

export function calculatePesticide(dosagePerLitre: number, tankCapacityL: number, areaAcres: number): PesticideResult {
  // Assumption: Approx 150-200 Litres of water needed per acre for spraying
  const waterPerAcre = 150.0; 
  
  const totalWaterNeeded = areaAcres * waterPerAcre;
  const totalChemicalNeededMl = totalWaterNeeded * dosagePerLitre;
  const totalTanks = Math.ceil(totalWaterNeeded / tankCapacityL);

  return {
    TotalChemicalMl: totalChemicalNeededMl,
    TotalWaterL: totalWaterNeeded,
    TotalTanks: totalTanks,
  };
}

export interface ROIResult {
  Revenue: number;
  NetProfit: number;
  ROI: number;
}

export function calculateROI(totalCost: number, yieldCount: number, pricePerUnit: number): ROIResult {
  const totalRevenue = yieldCount * pricePerUnit;
  const netProfit = totalRevenue - totalCost;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0.0;

  return {
    Revenue: totalRevenue,
    NetProfit: netProfit,
    ROI: roi,
  };
}
