import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { caAPI } from '../../services/api';
import { GlassCard, PrimaryButton, Badge, InputField, RangeSlider } from '../loans/components/UIElements';
import { Star, MapPin, Briefcase, CheckCircle, SearchX, Loader2 } from 'lucide-react';

export default function CADirectory() {
  const [cas, setCas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    specialization: '',
    language: '',
    minRating: 0,
    minFee: 500,
    maxFee: 5000
  });

  const fetchCAs = async () => {
    setLoading(true);
    try {
      const activeFilters = {};
      if (filters.search) activeFilters.search = filters.search;
      if (filters.city) activeFilters.city = filters.city;
      if (filters.specialization) activeFilters.specialization = filters.specialization;
      if (filters.language) activeFilters.language = filters.language;
      if (filters.minRating > 0) activeFilters.minRating = filters.minRating;
      if (filters.minFee > 0) activeFilters.minFee = filters.minFee;
      if (filters.maxFee < 6000) activeFilters.maxFee = filters.maxFee;

      const res = await caAPI.getAll(activeFilters);
      setCas(res.data.cas || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchCAs, 500); // Debounce
    return () => clearTimeout(timer);
  }, [filters]);

  const handleFilter = (key, val) => setFilters(p => ({ ...p, [key]: val }));

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="type-h1">CA Directory</h1>
          <p className="type-body" style={{ color: 'var(--text-secondary)' }}>Find and book verified Chartered Accountants.</p>
        </div>
        <Link to="/ca/bookings">
          <PrimaryButton icon="calendar_month">My Bookings</PrimaryButton>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        {/* SIDEBAR FILTERS */}
        <GlassCard tier={2} style={{ width: '320px', padding: '24px', flexShrink: 0 }}>
          <h3 className="type-h3" style={{ marginBottom: '20px' }}>Filters</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <InputField 
              placeholder="Search by name..." 
              value={filters.search} 
              onChange={e => handleFilter('search', e.target.value)} 
            />

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>City</label>
              <select className="loan-input" style={{ backgroundColor: '#1A1A2E', color: '#fff' }} value={filters.city} onChange={e => handleFilter('city', e.target.value)}>
                <option value="" style={{ backgroundColor: '#1A1A2E' }}>All Cities</option>
                <option value="Mumbai" style={{ backgroundColor: '#1A1A2E' }}>Mumbai</option>
                <option value="Delhi" style={{ backgroundColor: '#1A1A2E' }}>Delhi</option>
                <option value="Bangalore" style={{ backgroundColor: '#1A1A2E' }}>Bangalore</option>
                <option value="Pune" style={{ backgroundColor: '#1A1A2E' }}>Pune</option>
                <option value="Chennai" style={{ backgroundColor: '#1A1A2E' }}>Chennai</option>
                <option value="Hyderabad" style={{ backgroundColor: '#1A1A2E' }}>Hyderabad</option>
                <option value="Ahmedabad" style={{ backgroundColor: '#1A1A2E' }}>Ahmedabad</option>
                <option value="Kolkata" style={{ backgroundColor: '#1A1A2E' }}>Kolkata</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Specialization</label>
              <select className="loan-input" style={{ backgroundColor: '#1A1A2E', color: '#fff' }} value={filters.specialization} onChange={e => handleFilter('specialization', e.target.value)}>
                <option value="" style={{ backgroundColor: '#1A1A2E' }}>All</option>
                <option value="ITR" style={{ backgroundColor: '#1A1A2E' }}>ITR</option>
                <option value="GST" style={{ backgroundColor: '#1A1A2E' }}>GST</option>
                <option value="Audit" style={{ backgroundColor: '#1A1A2E' }}>Audit</option>
                <option value="Startup" style={{ backgroundColor: '#1A1A2E' }}>Startup</option>
                <option value="NRI" style={{ backgroundColor: '#1A1A2E' }}>NRI</option>
                <option value="Tax Planning" style={{ backgroundColor: '#1A1A2E' }}>Tax Planning</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Min Online Fee</label>
              <select className="loan-input" style={{ backgroundColor: '#1A1A2E', color: '#fff' }} value={filters.minFee} onChange={e => handleFilter('minFee', parseInt(e.target.value))}>
                <option value="0" style={{ backgroundColor: '#1A1A2E' }}>₹0</option>
                <option value="500" style={{ backgroundColor: '#1A1A2E' }}>₹500</option>
                <option value="1000" style={{ backgroundColor: '#1A1A2E' }}>₹1,000</option>
                <option value="2000" style={{ backgroundColor: '#1A1A2E' }}>₹2,000</option>
                <option value="3000" style={{ backgroundColor: '#1A1A2E' }}>₹3,000</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Max Online Fee</label>
              <select className="loan-input" style={{ backgroundColor: '#1A1A2E', color: '#fff' }} value={filters.maxFee} onChange={e => handleFilter('maxFee', parseInt(e.target.value))}>
                <option value="1000" style={{ backgroundColor: '#1A1A2E' }}>₹1,000</option>
                <option value="2000" style={{ backgroundColor: '#1A1A2E' }}>₹2,000</option>
                <option value="3000" style={{ backgroundColor: '#1A1A2E' }}>₹3,000</option>
                <option value="5000" style={{ backgroundColor: '#1A1A2E' }}>₹5,000</option>
                <option value="10000" style={{ backgroundColor: '#1A1A2E' }}>₹10,000+</option>
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Minimum Rating</label>
              <select className="loan-input" style={{ backgroundColor: '#1A1A2E', color: '#fff' }} value={filters.minRating} onChange={e => handleFilter('minRating', parseInt(e.target.value))}>
                <option value="0" style={{ backgroundColor: '#1A1A2E' }}>All Ratings</option>
                <option value="3" style={{ backgroundColor: '#1A1A2E' }}>3+ Stars</option>
                <option value="4" style={{ backgroundColor: '#1A1A2E' }}>4+ Stars</option>
                <option value="5" style={{ backgroundColor: '#1A1A2E' }}>5 Stars</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* RESULTS GRID */}
        <div style={{ flex: 1 }}>
          {loading ? (
             <div className="full-center" style={{ height: '300px' }}><Loader2 className="spin" /></div>
          ) : cas.length === 0 ? (
            <GlassCard style={{ padding: '60px', textAlign: 'center' }}>
              <SearchX size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3 className="type-h3" style={{ marginTop: '16px' }}>No CFAs found</h3>
              <p className="type-body" style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters.</p>
            </GlassCard>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {cas.map((ca, i) => (
                <motion.div 
                  key={ca._id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.05 }}
                >
                  <GlassCard tier={1} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={ca.photo} alt={ca.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                        {ca.verified && (
                          <div style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--success)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                            <CheckCircle size={14} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{ca.name}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ICAI: {ca.registrationNumber}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                           <Star size={16} fill="var(--gold)" color="var(--gold)" />
                           <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ca.rating}</span>
                           <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({ca.totalReviews})</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {ca.specializations.slice(0, 3).map(spec => (
                        <span key={spec} style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--border-subtle)' }}>{spec}</span>
                      ))}
                      {ca.specializations.length > 3 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>+{ca.specializations.length - 3}</span>}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} />{ca.location.city}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={14} />{ca.experience} Yrs</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: 'auto' }}>
                       <div>
                         <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Online Consult</p>
                         <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--gold)' }}>₹{ca.consultationFee.online}</p>
                       </div>
                       <Link to={`/ca/${ca._id}`} style={{ textDecoration: 'none' }}>
                         <PrimaryButton style={{ padding: '8px 16px', fontSize: '0.9rem' }}>View Profile</PrimaryButton>
                       </Link>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
