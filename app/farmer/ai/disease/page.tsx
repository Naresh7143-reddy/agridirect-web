'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader2, X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { aiApi } from '@/lib/api';

interface DiseaseResult {
  response: string;
}

const CROP_OPTIONS = [
  'Tomato',
  'Potato',
  'Rice',
  'Wheat',
  'Corn',
  'Chili',
  'Onion',
  'Cabbage',
  'Carrot',
  'Other'
];

export default function DiseaseDetectionPage() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cropName, setCropName] = useState('Tomato');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
    setResult(null);
  };

  const analyzeDisease = async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await aiApi.detectDisease(image, cropName);
      setResult(res.data || res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to analyze disease');
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseResponse = (text: string) => {
    const sections = text.split('\n').filter((line) => line.trim());
    const parsed: Record<string, string> = {};

    sections.forEach((section) => {
      const [key, ...valueParts] = section.split(':');
      if (key && valueParts.length > 0) {
        parsed[key.trim()] = valueParts.join(':').trim();
      }
    });

    return parsed;
  };

  const resultData = result?.response ? parseResponse(result.response) : null;
  const isHealthy = resultData?.ISSUE?.toLowerCase().includes('healthy');

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg to-bg/50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-ink-0 mb-2">🔍 Disease Detection</h1>
          <p className="text-ink-2">Upload a photo of your crop leaf to detect diseases and get treatment recommendations</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-3xl shadow-card p-8">
              {/* Crop selector */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-ink-0 mb-3">Select Crop Type</label>
                <select
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:border-primary outline-none text-ink-1"
                >
                  {CROP_OPTIONS.map((crop) => (
                    <option key={crop} value={crop}>
                      {crop}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative border-3 border-dashed border-primary/20 rounded-2xl p-8 cursor-pointer hover:border-primary hover:bg-primary/5 transition"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative w-full max-h-80 rounded-xl overflow-hidden">
                      <img src={imagePreview} alt="Selected" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearImage();
                        }}
                        className="absolute top-2 right-2 bg-error text-white rounded-full p-2 hover:bg-error/80 transition"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <p className="text-sm text-ink-2 text-center">{image?.name}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="size-16 text-primary/30 mx-auto mb-4" />
                    <p className="text-lg font-bold text-ink-0 mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-ink-2">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </div>

              {/* Analyze button */}
              <button
                onClick={analyzeDisease}
                disabled={!image || loading}
                className="w-full mt-6 px-6 py-4 bg-primary text-white rounded-xl font-bold hover:shadow-hover disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="size-5" />
                    Analyze Disease
                  </>
                )}
              </button>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-error/10 border border-error/30 rounded-xl flex gap-3"
                >
                  <AlertCircle className="size-5 text-error flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error">{error}</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {result && resultData && (
              <div className={`rounded-3xl shadow-card p-6 ${isHealthy ? 'bg-success/5 border border-success/20' : 'bg-warning/5 border border-warning/20'}`}>
                <div className="flex items-start gap-3 mb-6">
                  {isHealthy ? (
                    <CheckCircle className="size-8 text-success flex-shrink-0 mt-1" />
                  ) : (
                    <AlertCircle className="size-8 text-warning flex-shrink-0 mt-1" />
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-ink-0">
                      {resultData.ISSUE || 'Analysis Complete'}
                    </h3>
                    <p className={`text-sm font-semibold ${isHealthy ? 'text-success' : 'text-warning'}`}>
                      {isHealthy ? 'Healthy Plant' : resultData.SEVERITY}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {resultData.CAUSE && (
                    <div>
                      <p className="text-xs font-bold text-ink-1 uppercase tracking-wide mb-1">Cause</p>
                      <p className="text-sm text-ink-2">{resultData.CAUSE}</p>
                    </div>
                  )}

                  {resultData.SYMPTOMS && (
                    <div>
                      <p className="text-xs font-bold text-ink-1 uppercase tracking-wide mb-1">Symptoms</p>
                      <p className="text-sm text-ink-2">{resultData.SYMPTOMS}</p>
                    </div>
                  )}

                  {resultData.TREATMENT && (
                    <div>
                      <p className="text-xs font-bold text-ink-1 uppercase tracking-wide mb-1">Treatment</p>
                      <p className="text-sm text-ink-2 whitespace-pre-wrap">{resultData.TREATMENT}</p>
                    </div>
                  )}

                  {resultData.PREVENTION && (
                    <div>
                      <p className="text-xs font-bold text-ink-1 uppercase tracking-wide mb-1">Prevention</p>
                      <p className="text-sm text-ink-2">{resultData.PREVENTION}</p>
                    </div>
                  )}

                  {resultData.URGENCY && (
                    <div className="pt-2 mt-4 border-t border-current/10">
                      <div className="flex items-center gap-2">
                        <Info className="size-4 text-primary" />
                        <p className="text-xs font-semibold text-primary">Act: {resultData.URGENCY}</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={clearImage}
                  className="w-full mt-6 px-4 py-2 border-2 border-current/20 rounded-lg font-semibold hover:bg-current/5 transition"
                >
                  Analyze Another
                </button>
              </div>
            )}

            {!result && !loading && (
              <div className="bg-white rounded-3xl shadow-card p-6 border-2 border-primary/10">
                <h3 className="font-bold text-ink-0 mb-3">Tips for Best Results</h3>
                <ul className="space-y-2 text-sm text-ink-2">
                  <li>✓ Clear, close-up photo of affected leaf</li>
                  <li>✓ Good lighting (natural daylight)</li>
                  <li>✓ Zoom in on problem area</li>
                  <li>✓ Select correct crop type</li>
                  <li>✓ Avoid blurry images</li>
                </ul>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
