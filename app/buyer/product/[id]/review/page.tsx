'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';
import { toast } from 'sonner';
import { productsApi, reviewsApi } from '@/lib/api';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [product, setProduct] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    productsApi.get(id).then(r => setProduct(r.data));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await reviewsApi.create({
        productId: id,
        farmerId: product?.farmerId,
        rating,
        comment
      });
      
      toast.success('Review submitted successfully!');
      router.push(`/buyer/product/${id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not submit review');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <button onClick={() => router.back()} className="flex items-center text-ink-2 hover:text-primary transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Product
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
        <h1 className="text-2xl font-bold mb-2">Write a Review</h1>
        <p className="text-ink-2 mb-6">For {product.name}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star 
                    className={`w-8 h-8 transition-colors ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-2 mb-2">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input-field min-h-[120px] resize-y"
              placeholder="What did you like about this product?"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
