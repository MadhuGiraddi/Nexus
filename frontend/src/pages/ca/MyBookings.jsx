import React, { useState, useEffect } from 'react';
import { caAPI } from '../../services/api';
import { GlassCard, PrimaryButton, Badge } from '../loans/components/UIElements';
import { Calendar, Clock, Video, Star, Loader2 } from 'lucide-react';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming'); // Upcoming, Past, Cancelled
  const [reviewParams, setReviewParams] = useState(null); // { bookingId, caId }

  const fetchBookings = async () => {
    try {
      const { data } = await caAPI.getMyBookings();
      setBookings(data.bookings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await caAPI.cancelBooking(id);
      fetchBookings();
    } catch (e) {
      alert(e.response?.data?.error || 'Cancellation failed');
    }
  };

  const submitReview = async (rating, comment) => {
    try {
      await caAPI.submitReview({ caId: reviewParams.caId, bookingId: reviewParams.bookingId, rating, comment });
      setReviewParams(null);
      fetchBookings();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to submit review');
    }
  };

  const today = new Date();
  today.setHours(0,0,0,0);

  const filtered = bookings.filter(b => {
    if (activeTab === 'Cancelled') return b.status === 'cancelled';
    const isPast = new Date(b.date) < today || b.status === 'completed';
    if (activeTab === 'Past') return isPast && b.status !== 'cancelled';
    return !isPast && b.status !== 'cancelled';
  });

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="type-h1" style={{ marginBottom: '32px' }}>My Consultations</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
        {['Upcoming', 'Past', 'Cancelled'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              padding: '8px 16px', background: 'transparent', border: 'none', 
              color: activeTab === tab ? '#7C3AED' : 'var(--text-secondary)',
              fontWeight: activeTab === tab ? 700 : 500,
              borderBottom: activeTab === tab ? '2px solid #7C3AED' : '2px solid transparent',
              cursor: 'pointer', fontSize: '1rem', transition: '0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
         <div className="full-center"><Loader2 className="spin" /></div>
      ) : filtered.length === 0 ? (
         <GlassCard style={{ padding: '60px', textAlign: 'center' }}>
            <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <p className="type-body" style={{ color: 'var(--text-secondary)' }}>No {activeTab.toLowerCase()} bookings found.</p>
         </GlassCard>
      ) : (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filtered.map(b => {
              const ca = b.caId || {}; // populated
              
              let statusColor = 'gold';
              if (b.status === 'confirmed') statusColor = 'success';
              if (b.status === 'cancelled') statusColor = 'error';
              if (b.status === 'completed') statusColor = 'info';

              return (
                <GlassCard key={b._id} tier={1} style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <img src={ca.photo} alt={ca.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <h3 className="type-h3" style={{ marginBottom: '4px' }}>{ca.name}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Topic: {b.topic}</p>
                      
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(b.date).toLocaleDateString()}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {b.timeSlot}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Video size={14} /> {b.type.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                    <Badge variant={statusColor}>{b.status.toUpperCase()}</Badge>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {b.status === 'confirmed' && activeTab === 'Upcoming' && (
                        <>
                          <PrimaryButton onClick={() => handleCancel(b._id)} style={{ background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)' }}>Cancel</PrimaryButton>
                          {b.type === 'online' && (
                            <a href={b.meetLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                              <PrimaryButton style={{ background: '#7C3AED' }} icon="videocam">Join Meet</PrimaryButton>
                            </a>
                          )}
                        </>
                      )}
                      
                      {(b.status === 'completed' || (b.status === 'confirmed' && activeTab === 'Past')) && !b.hasReviewed && (
                         <PrimaryButton style={{ background: 'var(--gold)' }} onClick={() => setReviewParams({ bookingId: b._id, caId: ca._id })}>Leave Review</PrimaryButton>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
         </div>
      )}

      {/* Review Modal */}
      {reviewParams && (
        <ReviewModal onClose={() => setReviewParams(null)} onSubmit={submitReview} />
      )}
    </div>
  );
}

function ReviewModal({ onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <GlassCard tier={3} style={{ width: '400px', padding: '32px' }}>
        <h3 className="type-h2" style={{ marginBottom: '8px' }}>Rate Your Experience</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Help others by sharing your consultation experience.</p>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <Star 
              key={star}
              size={32}
              style={{ cursor: 'pointer' }}
              fill={star <= (hover || rating) ? 'var(--gold)' : 'transparent'}
              color={star <= (hover || rating) ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
            />
          ))}
        </div>

        <textarea 
          placeholder="Share details about the consultation..." 
          className="loan-input"
          style={{ width: '100%', height: '100px', resize: 'none', marginBottom: '24px', padding: '12px' }}
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '12px' }}>
          <PrimaryButton onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-subtle)' }}>Cancel</PrimaryButton>
          <PrimaryButton 
            onClick={() => onSubmit(rating, comment)} 
            style={{ flex: 1, background: '#7C3AED' }}
            disabled={rating === 0 || !comment.trim()}
          >
            Submit Review
          </PrimaryButton>
        </div>
      </GlassCard>
    </div>
  );
}
