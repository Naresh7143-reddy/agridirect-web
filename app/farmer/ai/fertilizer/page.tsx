'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Leaf } from 'lucide-react';
import { aiApi } from '@/lib/api';

const SOIL_TYPES = ['Loam', 'Clay', 'Sandy', 'Black', 'Red'];

export default function FertilizerPage() {
  const [cropName, setCropName] = useState('Tomato');
  const [soilType, setSoilType] = useState('Loam');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await aiApi.getFertilizerAdvice({cropName, soilType});
      setResult(res.data || res);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to get fertilizer advice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-bg py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-ink-0 mb-2">🌱 Fertilizer Recommender</h1>
          <p className="text-ink-2">Optimize nutrient management for maximum yields</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-card p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-ink-0 mb-3">Crop</label>
                <input
                  type="text"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="Enter crop name..."
                  className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-ink-0 mb-3">Soil Type</label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary outline-none"
                >
                  {SOIL_TYPES.map((soil) => (
                    <option key={soil} value={soil}>{soil}</option>
                  ))}
                </select>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-error/10 border border-error/30 rounded-xl">
                  <p className="text-sm text-error flex gap-2"><AlertCircle className="size-5 flex-shrink-0" />{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-primary text-white rounded-xl font-bold hover:shadow-hover disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="size-5 animate-spin" />Analyzing...</> : <><Leaf className="size-5" />Get Fertilizer Plan</>}
              </button>
            </div>
          </motion.form>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {result && (
              <div className="bg-green-50 rounded-3xl shadow-card p-6 border border-green-200 max-h-96 overflow-y-auto">
                <h3 className="text-xl font-bold text-green-900 mb-4">NPK Recommendation</h3>
                <p className="text-sm text-green-800 whitespace-pre-wrap leading-relaxed">{result.response}</p>
              </div>
            )}

            {!result && !loading && (
              <div className="bg-white rounded-3xl shadow-card p-6">
                <h3 className="font-bold text-ink-0 mb-4">NPK Basics</h3>
                <ul className="space-y-3 text-sm">
                  <li><strong className="text-primary">N - Nitrogen:</strong> Leaf growth</li>
                  <li><strong className="text-primary">P - Phosphorus:</strong> Root development</li>
                  <li><strong className="text-primary">K - Potassium:</strong> Fruit quality</li>
                </ul>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
