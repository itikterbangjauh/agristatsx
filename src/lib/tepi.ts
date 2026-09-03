// TourismEcoAI (TEPI) — model indeks komposit mengikut piawaian UN SEEA / SF-MST
// Dipindahkan daripada logik Google Apps Script (Code.gs) ke pengiraan sisi klien.

export const TEPI_WEIGHTS = {
  tourism: 0.3,
  water: 0.25,
  wqi_marine: 0.2,
  climate: 0.15,
  forest: 0.1,
} as const;

export type StateRow = {
  state: string;
  tourists: number; // juta pelancong domestik (DTS)
  water: number; // juta m³
  wqi: number; // Marine WQI 0-100
  rain: number; // mm
  forest: number; // ribu hektar
};

// Data asas 13 negeri (sumber: kompendium BPPAS & DTS DOSM — nilai penanda aras)
export const BASE_DATA: StateRow[] = [
  { state: "Selangor", tourists: 42.6, water: 1820.4, wqi: 62.1, rain: 2450, forest: 250.3 },
  { state: "Pulau Pinang", tourists: 18.4, water: 402.7, wqi: 68.4, rain: 2670, forest: 12.6 },
  { state: "Johor", tourists: 26.9, water: 968.2, wqi: 71.5, rain: 2380, forest: 425.8 },
  { state: "Sabah", tourists: 12.7, water: 356.9, wqi: 82.3, rain: 3120, forest: 3600.1 },
  { state: "Sarawak", tourists: 10.9, water: 401.5, wqi: 84.7, rain: 3850, forest: 6100.7 },
  { state: "Melaka", tourists: 15.2, water: 268.3, wqi: 64.8, rain: 2040, forest: 8.9 },
  { state: "Pahang", tourists: 14.6, water: 421.6, wqi: 79.2, rain: 2560, forest: 1520.4 },
  { state: "Terengganu", tourists: 8.3, water: 214.8, wqi: 76.5, rain: 3080, forest: 540.2 },
  { state: "Kelantan", tourists: 7.1, water: 198.4, wqi: 69.9, rain: 2900, forest: 610.5 },
  { state: "Perak", tourists: 13.8, water: 512.7, wqi: 74.6, rain: 2480, forest: 990.6 },
  { state: "Kedah", tourists: 9.6, water: 388.1, wqi: 70.2, rain: 2260, forest: 320.7 },
  { state: "Negeri Sembilan", tourists: 8.9, water: 296.5, wqi: 72.8, rain: 2170, forest: 165.4 },
  { state: "Perlis", tourists: 3.2, water: 96.2, wqi: 73.4, rain: 1980, forest: 38.1 },
];

export type RiskInfo = { category: string; color: string; tone: RiskTone };
export type RiskTone = "critical" | "high" | "moderate" | "low";

export function getRiskInfo(score: number): RiskInfo {
  if (score >= 75) return { category: "Sangat Kritikal", color: "var(--risk-critical)", tone: "critical" };
  if (score >= 60) return { category: "Tinggi", color: "var(--risk-high)", tone: "high" };
  if (score >= 40) return { category: "Sederhana", color: "var(--risk-moderate)", tone: "moderate" };
  return { category: "Rendah (Mampan)", color: "var(--risk-low)", tone: "low" };
}

export function getPolicyRecommendation(tone: RiskTone): string {
  switch (tone) {
    case "critical":
      return "Kuatkuasakan kawalan had muatan (carrying capacity), tingkatkan segera rizab air & alihkan aliran pelancong ke zon alternatif.";
    case "high":
      return "Pantau kualiti air marin dan jadualkan agihan air loji terawat sebelum musim kemuncak pelancongan.";
    case "moderate":
      return "Kapasiti ekologi stabil. Galakkan inisiatif eko-pelancongan dan pensijilan kelestarian premis perhotelan.";
    default:
      return "Zon lestari. Destinasi berdaya tampung tinggi untuk menyerap limpahan pelancong dari negeri berisiko.";
  }
}

function normalize(val: number, min: number, max: number) {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
}

export type TepiRecord = {
  id: number;
  state: string;
  tourists: number;
  water: number;
  wqi: number;
  rain: number;
  forest: number;
  waterIntensity: number;
  subScores: { tourism: number; water: number; wqi: number; climate: number; forest: number };
  tepi: number;
  riskCategory: string;
  riskColor: string;
  riskTone: RiskTone;
  recommendation: string;
};

export type Dashboard = {
  kpi: {
    totalTourists: number;
    totalWater: number;
    avgTEPI: number;
    criticalZones: number;
    totalStates: number;
  };
  records: TepiRecord[];
};

const r1 = (n: number) => Number(n.toFixed(1));

export function computeDashboard(rows: StateRow[] = BASE_DATA): Dashboard {
  const pick = (k: keyof StateRow) => rows.map((r) => Number(r[k]) || 0);
  const t = pick("tourists"),
    wa = pick("water"),
    q = pick("wqi"),
    ra = pick("rain"),
    fo = pick("forest");

  const [minT, maxT] = [Math.min(...t), Math.max(...t)];
  const [minW, maxW] = [Math.min(...wa), Math.max(...wa)];
  const [minQ, maxQ] = [Math.min(...q), Math.max(...q)];
  const [minR, maxR] = [Math.min(...ra), Math.max(...ra)];
  const [minF, maxF] = [Math.min(...fo), Math.max(...fo)];
  const w = TEPI_WEIGHTS;

  const records: TepiRecord[] = rows.map((row, idx) => {
    const waterIntensity = row.tourists > 0 ? Number((row.water / row.tourists).toFixed(2)) : 0;
    const subTour = normalize(row.tourists, minT, maxT) * w.tourism;
    const subWater = normalize(row.water, minW, maxW) * w.water;
    const subWqi = normalize(100 - row.wqi, 100 - maxQ, 100 - minQ) * w.wqi_marine;
    const subRain = normalize(row.rain, minR, maxR) * w.climate;
    const subForest = normalize(row.forest, minF, maxF) * w.forest;

    const tepi = r1(subTour + subWater + subWqi + subRain + subForest);
    const risk = getRiskInfo(tepi);

    return {
      id: idx + 1,
      state: row.state,
      tourists: row.tourists,
      water: row.water,
      wqi: row.wqi,
      rain: row.rain,
      forest: row.forest,
      waterIntensity,
      subScores: {
        tourism: r1(subTour),
        water: r1(subWater),
        wqi: r1(subWqi),
        climate: r1(subRain),
        forest: r1(subForest),
      },
      tepi,
      riskCategory: risk.category,
      riskColor: risk.color,
      riskTone: risk.tone,
      recommendation: getPolicyRecommendation(risk.tone),
    };
  });

  records.sort((a, b) => b.tepi - a.tepi);

  return {
    kpi: {
      totalTourists: r1(records.reduce((a, r) => a + r.tourists, 0)),
      totalWater: r1(records.reduce((a, r) => a + r.water, 0)),
      avgTEPI: r1(records.reduce((a, r) => a + r.tepi, 0) / (records.length || 1)),
      criticalZones: records.filter((r) => r.tepi >= 70).length,
      totalStates: records.length,
    },
    records,
  };
}

export const simulateTepi = (tepi: number, growth: number) => Math.min(100, tepi * (1 + growth * 0.4));
