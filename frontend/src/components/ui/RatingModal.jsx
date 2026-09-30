import { useState } from 'react';
import { Star, X, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import Button from './Button';
import rideService from '../../services/rideService';
import { useToast } from '../../context/ToastContext';

export default function RatingModal({ isOpen, onClose, ride, onRatingSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  if (!isOpen || !ride) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await rideService.submitRating(ride._id, { rating, review });
      toast.success('Thank you for rating your trip!');
      if (onRatingSubmitted) onRatingSubmitted();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
            <Star className="w-8 h-8 fill-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">How was your journey?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your feedback helps keep Sanghini Ride safe and reliable across Udaipur.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Interactive Star Rating */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 text-slate-300 hover:scale-110 transition-all outline-none"
              >
                <Star
                  className={`w-9 h-9 transition-colors ${
                    (hoverRating || rating) >= star
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-200 fill-slate-50'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="text-center font-bold text-xs text-purple-700 bg-purple-50 py-1.5 px-3 rounded-full w-fit mx-auto border border-purple-100">
            {rating === 5 && '🌟 Excellent & Super Safe!'}
            {rating === 4 && '👍 Great Experience'}
            {rating === 3 && '👌 Average Trip'}
            {rating === 2 && '😐 Needs Improvement'}
            {rating === 1 && '👎 Poor Experience'}
          </div>

          {/* Optional Review Text */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Write a Review (Optional)
            </label>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="Share details about safety, driving, punctuality..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 justify-center text-xs"
            >
              Skip
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="flex-1 justify-center text-xs bg-purple-600 hover:bg-purple-700 shadow-md"
            >
              <Send className="w-3.5 h-3.5 mr-1" /> Submit Rating
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
