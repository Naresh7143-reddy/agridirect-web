'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { aiApi } from '@/lib/api';

export default function YieldPage() {
  const [cropName, setCropName] = useState('Rice');
  const [area, setArea] = useState(1);
  const [soilFertility, setSoilFertility] = useState('Medium');
  const [waterAvailability, setWaterAvailability] = useState('High');
  const [season, setSeason] = useState('Monsoon');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await aiApi.getYieldPrediction({
        cropName,
        area_hectares: parseFloat(area as any),
        soil_fertility: soilFertility,
        water_availability: waterAvailability,
        season,
      });
      setResult(res.data || res);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to get yield prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-bg py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-ink-0 mb-2">📊 Yield Predictor</h1>
          <p className="text-ink-2">Estimate crop yield based on your farm conditions</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-card p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-ink-0 mb-2">Crop</label>
                  <input type="text" value={cropName} onChange={(e) => setCropName(e.target.value)} className="w-full px-3 py-2 border-2 border-border rounded-lg focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink-0 mb-2">Area (hectares)</label>
                  <input type="number" value={area} onChange={(e) => setArea(e.target.value)} step="0.1" min="0.1" className="w-full px-3 py-2 border-2 border-border rounded-lg focus:border-primary outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-ink-0 mb-2">Soil Fertility</label>
                <select value={soilFertility} onChange={(e) => setSoilFertility(e.target.value)} className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary outline-none">
                  {['Low', 'Medium', 'High'].map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-ink-0 mb-2">Water Availability</label>
                <select value={waterAvailability} onChange={(e) => setWaterAvailability(e.target.value)} className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary outline-none">
                  {['Low', 'Medium', 'High'].map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-ink-0 mb-2">Season</label>
                <select value={season} onChange={(e) => setSeason(e.target.value)} className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary outline-none">
                  {['Monsoon', 'Winter', 'Summer'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-error/10 border border-error/30 rounded-xl">
                  <p className="text-sm text-error flex gap-2"><AlertCircle className="size-5 flex-shrink-0" />{error}</p>
                </motion.div>
              )}

              <button type="submit" disabled={loading} className="w-full px-6 py-4 bg-primary text-white rounded-xl font-bold hover:shadow-hover disabled:opacity-50 transition flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="size-5 animate-spin" />Calculating...</> : <><TrendingUp className="size-5" />Predict Yield</>}
              </button>
            </div>
          </motion.form>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {result && (
              <div className="bg-amber-50 rounded-3xl shadow-card p-6 border border-amber-200 max-h-96 overflow-y-auto">
                <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2"><TrendingUp className="size-5" />Yield Estimate</h3>
                <p className="text-sm text-amber-800 whitespace-pre-wrap leading-relaxed">{result.response}</p>
              </div>
            )}

            {!result && !loading && (
              <div className="bg-white rounded-3xl shadow-card p-6">
                <h3 className="font-bold text-ink-0 mb-4">Factors Affecting Yield</h3>
                <ul className="space-y-2 text-sm text-ink-2">
                  <li>🌱 Soil fertility level</li>
                  <li>💧 Water availability</li>
                  <li>🌤️ Weather conditions</li>
                  <li>🐛 Pest pressure</li>
                  <li>📍 Farm location</li>
                </ul>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
