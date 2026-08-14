'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, MapPin, AlertCircle } from 'lucide-react';
import { aiApi } from '@/lib/api';

interface PriceResult {
  response: string;
}

const POPULAR_CROPS = [
  'Rice', 'Wheat', 'Corn', 'Tomato', 'Onion', 'Potato', 'Chili',
  'Cotton', 'Sugarcane', 'Tea', 'Coffee', 'Cardamom', 'Turmeric',
  'Garlic', 'Ginger', 'Cabbage', 'Carrot', 'Peas', 'Groundnut',
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
];

export default function PriceForecastPage() {
  const [cropName, setCropName] = useState('Tomato');
  const [location, setLocation] = useState('Maharashtra');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await aiApi.getPriceForecast({
        cropName: cropName.trim() || 'Tomato',
        location: location.trim() || 'Maharashtra',
      });
      setResult(res.data || res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to get price forecast');
    } finally {
      setLoading(false);
    }
  };

  const parsePrice = (text: string) => {
    const match = text.match(/₹([\d,]+)\s*-\s*₹([\d,]+)/);
    if (match) {
      return { min: match[1], max: match[2] };
    }
    return null;
  };

  const parseTrend = (text: string) => {
    if (text.includes('Rising') || text.includes('Increasing')) return { name: 'Rising', color: 'text-success', bg: 'bg-success/10' };
    if (text.includes('Falling') || text.includes('Decreasing')) return { name: 'Falling', color: 'text-error', bg: 'bg-error/10' };
    return { name: 'Stable', color: 'text-warning', bg: 'bg-warning/10' };
  };

  const price = result?.response ? parsePrice(result.response) : null;
  const trend = result?.response ? parseTrend(result.response) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg to-bg/50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-ink-0 mb-2">📈 Price Forecast</h1>
          <p className="text-ink-2">Get market price predictions to optimize your selling time</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-3xl shadow-card p-8 space-y-6">
              {/* Crop Selection */}
              <div>
                <label className="block text-sm font-bold text-ink-0 mb-3">Select Crop</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {POPULAR_CROPS.slice(0, 9).map((crop) => (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => setCropName(crop)}
                      className={`p-2 rounded-lg text-xs font-semibold border transition ${
                        cropName === crop
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-bg hover:border-primary'
                      }`}
                    >
                      {crop}
                    </button>
                  ))}
                </div>
                <select
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary outline-none"
                >
                  <option value="">-- Select or type crop name --</option>
                  {POPULAR_CROPS.map((crop) => (
                    <option key={crop} value={crop}>
                      {crop}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="Enter crop name..."
                  className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary outline-none mt-2"
                />
              </div>

              {/* Location Selection */}
              <div>
                <label className="block text-sm font-bold text-ink-0 mb-3 flex items-center gap-2">
                  <MapPin className="size-4" />
                  Select Location / State
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary outline-none"
                >
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-info/10 border border-info/30 rounded-xl flex gap-3">
                <AlertCircle className="size-5 text-info flex-shrink-0 mt-0.5" />
                <p className="text-sm text-info-dark">
                  Prices are based on historical market data and current trends. Actual market rates may vary.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-error/10 border border-error/30 rounded-xl flex gap-3"
                >
                  <AlertCircle className="size-5 text-error flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error">{error}</p>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !cropName.trim() || !location.trim()}
                className="w-full px-6 py-4 bg-primary text-white rounded-xl font-bold hover:shadow-hover disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Analyzing Market...
                  </>
                ) : (
                  <>
                    <TrendingUp className="size-5" />
                    Get Price Forecast
                  </>
                )}
              </button>
            </div>
          </motion.form>

          {/* Results Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {result && (
              <div className="bg-white rounded-3xl shadow-card p-6 space-y-4">
                {price && (
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
                    <p className="text-xs text-ink-2 font-bold uppercase mb-1">Current Price Range</p>
                    <p className="text-3xl font-black text-primary">
                      ₹{price.min} — ₹{price.max}
                    </p>
                    <p className="text-xs text-ink-2 mt-1">per quintal</p>
                  </div>
                )}

                {trend && (
                  <div className={`rounded-2xl p-4 border-2 ${trend.bg} border-current/20`}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className={`size-5 ${trend.color}`} />
                      <p className={`font-bold ${trend.color}`}>{trend.name}</p>
                    </div>
                    <p className="text-xs text-ink-2">Price trend in market</p>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-bold text-ink-1 uppercase tracking-wider mb-3">Forecast Details</p>
                  <p className="text-sm text-ink-2 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                    {result.response}
                  </p>
                </div>

                <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                  <p className="text-xs font-bold text-success">💡 Tip: Check weather forecasts for better predictions</p>
                </div>
              </div>
            )}

            {!result && !loading && (
              <div className="bg-white rounded-3xl shadow-card p-6 space-y-4">
                <h3 className="font-bold text-ink-0 text-lg mb-4">Market Insights</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-ink-0 mb-1">🎯 Best Time to Sell</p>
                    <p className="text-ink-2">Analyze trends and sell when prices peak</p>
                  </div>
                  <div>
                    <p className="font-semibold text-ink-0 mb-1">📊 Market Data</p>
                    <p className="text-ink-2">Based on 30-day historical trends</p>
                  </div>
                  <div>
                    <p className="font-semibold text-ink-0 mb-1">📍 Regional Prices</p>
                    <p className="text-ink-2">Prices vary by state and season</p>
                  </div>
                  <div>
                    <p className="font-semibold text-ink-0 mb-1">🌾 Smart Timing</p>
                    <p className="text-ink-2">Maximize profits with forecast insights</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
