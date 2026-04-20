import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caAPI } from '../../services/api';
import { GlassCard, PrimaryButton, Badge, InputField } from '../loans/components/UIElements';
import { MapPin, Briefcase, Star, CheckCircle, Loader2 } from 'lucide-react';

export default function CAProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ca, setCa] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Booking Form State
  const [type, setType] = useState('online');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [topic, setTopic] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    caAPI.getOne(id)
      .then(({ data }) => {
        setCa(data.ca);
        setReviews(data.reviews);
      })
      .catch(() => setError('Failed to load CA profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot || !topic) {
      setError('Please select a date, time slot, and provide a topic.');
      return;
    }
    setBookingLoading(true);
    setError('');
    try {
      await caAPI.bookSlot({
        caId: ca._id,
        type,
        date: selectedDate,
        timeSlot: selectedSlot,
        topic
      });
      navigate('/ca/bookings');
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Try another slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="full-center" style={{ minHeight: '80vh' }}><Loader2 className="spin" /></div>;
  if (!ca) return <div className="full-center" style={{ minHeight: '80vh' }}><h3>Profile Not Found</h3></div>;

  // Compute next 7 days for the date picker
  const upcomingDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1); // Start from tomorrow
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    return { dateObj: d, dateStr: d.toISOString().split('T')[0], dayName };
  });

  const slotsForSelectedDay = ca.availability.find(a => a.day === new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }))?.slots || [];

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
      
      {/* LEFT COLUMN: Profile Info & Reviews */}
      <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Profile Header */}
        <GlassCard tier={2} style={{ padding: '40px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ position: 'relative' }}>
            <img src={ca.photo} alt={ca.name} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-subtle)' }} />
            {ca.verified && (
              <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'var(--success)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #1A1A2E' }}>
                <CheckCircle size={18} color="#000" />
              </div>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
              <h1 className="type-h2">{ca.name}</h1>
              <Badge variant="gold">ICAI: {ca.registrationNumber}</Badge>
            </div>
            
            <p className="type-body" style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{ca.about}</p>
            
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={16} />{ca.location.city}, {ca.location.state}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={16} />{ca.experience} Years Experience</span>
              <span style={{ color: 'var(--gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={16} />{ca.rating} ({ca.totalReviews} Reviews)</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
               {ca.specializations.map(spec => (
                 <span key={spec} style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#A78BFA', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>{spec}</span>
               ))}
               {ca.languages.map(lang => (
                 <span key={lang} style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>🗣️ {lang}</span>
               ))}
            </div>
          </div>
        </GlassCard>

        {/* Reviews Section */}
        <h3 className="type-h3" style={{ marginTop: '16px' }}>Client Reviews ({reviews.length})</h3>
        {reviews.length === 0 ? (
           <p style={{ color: 'var(--text-muted)' }}>No reviews yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.map(r => (
              <GlassCard key={r._id} tier={1} style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                   <div style={{ fontWeight: 600 }}>{r.user?.name || 'Anonymous User'}</div>
                   <div style={{ display: 'flex', gap: '2px' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} fill={i < r.rating ? 'var(--gold)' : 'transparent'} color={i < r.rating ? 'var(--gold)' : 'rgba(255,255,255,0.1)'} />
                      ))}
                    </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>"{r.comment}"</p>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '12px' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
              </GlassCard>
            ))}
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: Booking Form */}
      <div style={{ flex: '1 1 350px' }}>
        <GlassCard tier={3} style={{ padding: '32px', position: 'sticky', top: '24px' }}>
          <h3 className="type-h3" style={{ marginBottom: '24px' }}>Book Consultation</h3>
          
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', marginBottom: '24px' }}>
            <button 
              onClick={() => setType('online')}
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: type === 'online' ? '#7C3AED' : 'transparent', color: type === 'online' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}
            >
              Online (₹{ca.consultationFee.online})
            </button>
            <button 
              onClick={() => setType('offline')}
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: type === 'offline' ? '#7C3AED' : 'transparent', color: type === 'offline' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}
            >
              In-Person (₹{ca.consultationFee.offline})
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
             <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Select Date</label>
             <select className="loan-input" style={{ backgroundColor: '#1A1A2E', color: '#fff' }} value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(''); }}>
               <option value="" style={{ backgroundColor: '#1A1A2E' }}>-- Choose Date --</option>
               {upcomingDays.map(d => (
                 <option key={d.dateStr} value={d.dateStr} style={{ backgroundColor: '#1A1A2E' }}>{d.dateStr} ({d.dayName})</option>
               ))}
             </select>
          </div>

          {selectedDate && (
            <div style={{ marginBottom: '20px' }}>
               <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Available Slots</label>
               {slotsForSelectedDay.length === 0 ? (
                 <p style={{ fontSize: '0.85rem', color: 'var(--error)' }}>No slots available on this day. Please choose another.</p>
               ) : (
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                   {slotsForSelectedDay.map(slot => (
                     <button
                       key={slot}
                       onClick={() => setSelectedSlot(slot)}
                       style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${selectedSlot === slot ? '#7C3AED' : 'rgba(255,255,255,0.1)'}`, background: selectedSlot === slot ? 'rgba(124, 58, 237, 0.1)' : 'transparent', color: selectedSlot === slot ? '#fff' : 'var(--text-secondary)', cursor: 'pointer' }}
                     >
                       {slot}
                     </button>
                   ))}
                 </div>
               )}
            </div>
          )}

          <div style={{ marginBottom: '32px' }}>
             <InputField 
               label="Discussion Topic" 
               placeholder="e.g. GST Registration, ITR Filing..." 
               value={topic}
               onChange={e => setTopic(e.target.value)}
             />
          </div>

          {error && <div style={{ color: 'var(--error)', background: 'rgba(255,76,76,0.1)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</div>}

          <PrimaryButton 
            style={{ width: '100%', background: '#7C3AED' }} 
            onClick={handleBooking}
            loading={bookingLoading}
          >
            Confirm Booking
          </PrimaryButton>
        </GlassCard>
      </div>

    </div>
  );
}
