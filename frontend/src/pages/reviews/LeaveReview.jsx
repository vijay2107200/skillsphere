import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function LeaveReview({ gigId, revieweeId, revieweeName, onDone }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setLoading(true);
    try {
      await api.post('/reviews', { gigId, revieweeId, rating, comment });
      toast.success('Review submitted!');
      if (onDone) onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl" style={{ background: '#ffffff', border: '1px solid #fed7aa', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' }}>
      <h3 className="font-semibold mb-4" style={{ color: '#0f172a' }}>Leave a Review for {revieweeName}</h3>
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
            className="text-3xl transition">
            <span style={{ color: (hover || rating) >= star ? '#f59e0b' : '#cbd5e1' }}>*</span>
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} required rows={4}
        placeholder="Share your experience..."
        className="w-full mb-4 text-sm resize-none"
        style={{ background: '#fffbf5', border: '1px solid #fed7aa', color: '#1e293b', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none' }} />
      <button type="submit" disabled={loading} className="text-white px-6 py-2 rounded-lg font-medium"
        style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
