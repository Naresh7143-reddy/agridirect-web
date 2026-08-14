'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lightbulb, Leaf, MapPin, Cloud, Droplets } from 'lucide-react';
import { aiApi } from '@/lib/api';

interface AdviceResult {
  response: string;
}

const SEASONS = [
  { value: 'Monsoon', label: 'Monsoon (Kharif)', emoji: '🌧️' },
  { value: 'Winter', label: 'Winter (Rabi)', emoji: '❄️' },
  { value: 'Summer', label: 'Summer (Zaid)', emoji: '☀️' },
];

const SOIL_TYPES = [
  { value: 'Loam', label: 'Loam (Mixed)' },
  { value: 'Clay', label: 'Clay' },
  { value: 'Sandy', label: 'Sandy' },
  { value: 'Black', label: 'Black Soil' },
  { value: 'Red', label: 'Red Soil' },
];

const WATER_LEVELS = [
  { value: 'High', label: 'High (Well-irrigated area)' },
  { value: 'Medium', label: 'Medium (Semi-arid)' },
  { value: 'Low', label: 'Low (Dry region)' },
];

const POPULAR_LOCATIONS = [
  'Maharashtra',
  'Punjab',
  'Haryana',
  'Andhra Pradesh',
  'Karnataka',
  'Uttar Pradesh',
  'Madhya Pradesh',
  'Gujarat',
];

export default function CropAdvicePage() {
  const [season, setSeason] = useState('Monsoon');
  const [location, setLocation] = useState('Maharashtra');
  const [soilType, setSoilType] = useState('Loam');
  const [waterAvailability, setWaterAvailability] = useState('High');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdviceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await aiApi.getCropAdvice({
        season,
        location: location.trim() || 'Your Region',
        soilType,
        waterAvailability,
      });
      setResult(res.data || res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to get crop advice');
    } finally {
      setLoading(false);
    }
  };

  const extractCrops = (text: string): string[] => {
    const lines = text.split('\n');
    const crops: string[] = [];
    let inList = false;

    for (const line of lines) {
      if (line.includes('recommend') && line.toLowerCase().includes('crop')) {
        inList = true;
        continue;
      }
      if (inList && line.match(/^\d+\./)) {
        const crop = line.replace(/^\d+\.\s*/, '').split(/[—-]/)[0].trim();
        if (crop) crops.push(crop);
      }
    }

    return crops.length > 0 ? crops : ['Check details for recommendations'];
  };

  const crops = result?.response ? extractCrops(result.response) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg to-bg/50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-ink-0 mb-2">🌾 Smart Crop Advisor</h1>
          <p className="text-ink-2">Get personalized crop recommendations based on your conditions</p>
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
              {/* Season */}
              <div>
                <label className="block text-sm font-bold text-ink-0 mb-3">Select Season</label>
                <div className="grid grid-cols-3 gap-3">
                  {SEASONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSeason(s.value)}
                      className={`p-3 rounded-xl border-2 transition text-center font-semibold ${
                        season === s.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-bg text-ink-1 hover:border-primary/50'
                      }`}
                    >
                      <span className="text-lg block mb-1">{s.emoji}</span>
                      <span className="text-xs">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-bold text-ink-0 mb-3 flex items-center gap-2">
                  <MapPin className="size-4" />
                  Your Location / State
                </label>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {POPULAR_LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setLocation(loc)}
                        className={`p-2 rounded-lg text-sm border transition ${
                          location === loc
                            ? 'border-primary bg-primary text-white font-semibold'
                            : 'border-border bg-bg hover:border-primary'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Or enter your location..."
                    className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Soil Type */}
              <div>
                <label className="block text-sm font-bold text-ink-0 mb-3 flex items-center gap-2">
                  <Leaf className="size-4" />
                  Soil Type
                </label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary outline-none"
                >
                  {SOIL_TYPES.map((soil) => (
                    <option key={soil.value} value={soil.value}>
                      {soil.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Water Availability */}
              <div>
                <label className="block text-sm font-bold text-ink-0 mb-3 flex items-center gap-2">
                  <Droplets className="size-4" />
                  Water Availability
                </label>
                <div className="space-y-2">
                  {WATER_LEVELS.map((level) => (
                    <label key={level.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="water"
                        value={level.value}
                        checked={waterAvailability === level.value}
                        onChange={(e) => setWaterAvailability(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-ink-1 font-medium">{level.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-error/10 border border-error/30 rounded-xl flex gap-3"
                >
                  <Cloud className="size-5 text-error flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error">{error}</p>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-primary text-white rounded-xl font-bold hover:shadow-hover disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Getting Recommendations...
                  </>
                ) : (
                  <>
                    <Lightbulb className="size-5" />
                    Get Crop Recommendations
                  </>
                )}
              </button>
            </div>
          </motion.form>

          {/* Results Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {result && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl shadow-card p-6 border border-primary/20">
                <h3 className="text-2xl font-bold text-ink-0 mb-4 flex items-center gap-2">
                  <Leaf className="size-6 text-primary" />
                  Recommended Crops
                </h3>
                <div className="space-y-3 mb-6">
                  {crops.map((crop, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white rounded-xl p-3 border-l-4 border-primary"
                    >
                      <p className="text-sm font-bold text-ink-0">{crop}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-4 border-t border-primary/20">
                  <p className="text-xs text-ink-2 font-semibold uppercase tracking-wider mb-2">Details</p>
                  <p className="text-sm text-ink-1 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                    {result.response}
                  </p>
                </div>
              </div>
            )}

            {!result && !loading && (
              <div className="bg-white rounded-3xl shadow-card p-6">
                <h3 className="font-bold text-ink-0 mb-4">How It Works</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">1</span>
                    <span className="text-ink-2">Select your farming season</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">2</span>
                    <span className="text-ink-2">Specify your location & soil type</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">3</span>
                    <span className="text-ink-2">Indicate water availability</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">4</span>
                    <span className="text-ink-2">Get AI-powered recommendations</span>
                  </li>
                </ul>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
