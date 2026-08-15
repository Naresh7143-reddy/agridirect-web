'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Cloud, Droplets, Wind, AlertCircle, Leaf } from 'lucide-react';
import { aiApi } from '@/lib/api';

interface WeatherResult {
  response: string;
}

const SEASONS = ['Monsoon', 'Winter', 'Summer'];

export default function WeatherAdvisorPage() {
  const [location, setLocation] = useState('Maharashtra');
  const [cropName, setCropName] = useState('Tomato');
  const [season, setSeason] = useState('Monsoon');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await aiApi.getWeatherAdvisor({
        location,
        cropName,
        season,
      });
      setResult(res.data || res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to get weather forecast');
    } finally {
      setLoading(false);
    }
  };

  const parseWeather = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim());
    const data: Record<string, string> = {};
    lines.forEach((line) => {
      const [key, ...value] = line.split(':');
      if (key && value.length > 0) {
        data[key.trim()] = value.join(':').trim();
      }
    });
    return data;
  };

  const weatherData = result?.response ? parseWeather(result.response) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg to-bg/50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-ink-0 mb-2">☀️ Weather Advisor</h1>
          <p className="text-ink-2">Get weather forecasts and recommendations for your crops</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-3xl shadow-card p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-ink-0 mb-3">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter your location..."
                  className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary outline-none"
                />
              </div>

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
                <label className="block text-sm font-bold text-ink-0 mb-3">Season</label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary outline-none"
                >
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-primary text-white rounded-xl font-bold hover:shadow-hover disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Cloud className="size-5" />
                    Get Weather Forecast
                  </>
                )}
              </button>
            </div>
          </motion.form>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {result && weatherData && (
              <div className="bg-gradient-to-br from-sky-100 to-sky-50 rounded-3xl shadow-card p-6 border border-sky-200 space-y-4">
                <h3 className="text-2xl font-bold text-sky-900 mb-4 flex items-center gap-2">
                  <Cloud className="size-6 text-sky-600" />
                  Weather Forecast
                </h3>

                {weatherData.CONDITION && (
                  <div className="bg-white rounded-xl p-4 border-l-4 border-sky-600">
                    <p className="text-xs font-bold text-ink-1 uppercase">Condition</p>
                    <p className="text-lg font-bold text-sky-900">{weatherData.CONDITION}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {weatherData.TEMPERATURE && (
                    <div className="bg-white rounded-xl p-3 border-l-4 border-orange-500">
                      <p className="text-xs font-bold text-ink-2">Temperature</p>
                      <p className="text-lg font-bold text-orange-600">{weatherData.TEMPERATURE}</p>
                    </div>
                  )}

                  {weatherData.HUMIDITY && (
                    <div className="bg-white rounded-xl p-3 border-l-4 border-blue-500">
                      <p className="text-xs font-bold text-ink-2">Humidity</p>
                      <p className="text-lg font-bold text-blue-600">{weatherData.HUMIDITY}</p>
                    </div>
                  )}
                </div>

                {weatherData.RAINFALL && (
                  <div className="bg-white rounded-xl p-3 border-l-4 border-purple-500">
                    <p className="text-xs font-bold text-ink-2">Rainfall</p>
                    <p className="text-lg font-bold text-purple-600">{weatherData.RAINFALL}</p>
                  </div>
                )}

                {weatherData.IRRIGATION && (
                  <div className="bg-sky-50 rounded-xl p-3 border border-sky-200">
                    <p className="text-xs font-bold text-ink-1 uppercase mb-1">Irrigation</p>
                    <p className="text-sm text-ink-2">{weatherData.IRRIGATION}</p>
                  </div>
                )}

                {weatherData.ADVISORY && (
                  <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                    <p className="text-xs font-bold text-yellow-800 uppercase mb-1">Advisory</p>
                    <p className="text-sm text-yellow-900">{weatherData.ADVISORY}</p>
                  </div>
                )}
              </div>
            )}

            {!result && !loading && (
              <div className="bg-white rounded-3xl shadow-card p-6">
                <h3 className="font-bold text-ink-0 mb-4">Weather Impact</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <Cloud className="size-5 text-primary flex-shrink-0" />
                    <span className="text-ink-2">Temperature affects germination & growth</span>
                  </li>
                  <li className="flex gap-2">
                    <Droplets className="size-5 text-primary flex-shrink-0" />
                    <span className="text-ink-2">Rainfall impacts irrigation needs</span>
                  </li>
                  <li className="flex gap-2">
                    <Wind className="size-5 text-primary flex-shrink-0" />
                    <span className="text-ink-2">Humidity increases pest risk</span>
                  </li>
                  <li className="flex gap-2">
                    <Leaf className="size-5 text-primary flex-shrink-0" />
                    <span className="text-ink-2">Plan spraying based on conditions</span>
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
