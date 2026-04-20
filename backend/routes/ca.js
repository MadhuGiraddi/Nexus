const router = require('express').Router();
const auth = require('../middleware/auth');
const pro = require('../middleware/pro');
const CAProfile = require('../models/CAProfile');
const CABooking = require('../models/CABooking');
const CAReview = require('../models/CAReview');

// ── GET /api/ca (List with Filters) ───────────────────────────────────────────
router.get('/', auth, pro, async (req, res) => {
  try {
    const { city, specialization, language, minRating, minFee, maxFee, search } = req.query;
    
    let query = {};
    
    // Exact or regex matching for city
    if (city) query['location.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
    
    // Text search by name
    if (search) query.name = { $regex: new RegExp(search, 'i') };
    
    if (specialization) query.specializations = specialization;
    if (language) query.languages = language;
    if (minRating) query.rating = { $gte: Number(minRating) };
    
    let FeeQuery = {};
    if (minFee) FeeQuery.$gte = Number(minFee);
    if (maxFee) FeeQuery.$lte = Number(maxFee);
    if (Object.keys(FeeQuery).length > 0) query['consultationFee.online'] = FeeQuery;

    const cas = await CAProfile.find(query).sort({ rating: -1, totalReviews: -1 });
    res.json({ cas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch CA profiles' });
  }
});

// ── GET /api/ca/bookings/my ───────────────────────────────────────────────────
router.get('/bookings/my', auth, pro, async (req, res) => {
  try {
    const bookings = await CABooking.find({ user: req.userId })
      .populate('caId', 'name photo location consultationFee rating')
      .sort({ date: 1, timeSlot: 1 });
      
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ── GET /api/ca/:id ───────────────────────────────────────────────────────────
router.get('/:id', auth, pro, async (req, res) => {
  try {
    const ca = await CAProfile.findById(req.params.id);
    if (!ca) return res.status(404).json({ error: 'CA not found' });
    
    const reviews = await CAReview.find({ caId: req.params.id }).populate('user', 'name').sort({ createdAt: -1 });

    res.json({ ca, reviews });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch CA details' });
  }
});

// ── POST /api/ca/bookings ─────────────────────────────────────────────────────
router.post('/bookings', auth, pro, async (req, res) => {
  try {
    const { caId, type, date, timeSlot, topic } = req.body;
    
    // Basic slot conflict check
    const existing = await CABooking.findOne({ caId, date, timeSlot, status: { $in: ['pending', 'confirmed'] } });
    if (existing) {
      return res.status(400).json({ error: 'This time slot is already booked. Please choose another.' });
    }

    const booking = await CABooking.create({
      user: req.userId,
      caId,
      type,
      date,
      timeSlot,
      topic,
      status: 'confirmed',
      meetLink: type === 'online' ? `https://meet.google.com/nx-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}` : null
    });

    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: 'Booking failed', details: err.message });
  }
});

// ── PATCH /api/ca/bookings/:id/cancel ─────────────────────────────────────────
router.patch('/bookings/:id/cancel', auth, pro, async (req, res) => {
  try {
    const booking = await CABooking.findOne({ _id: req.params.id, user: req.userId });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({ error: 'Booking cannot be cancelled at this stage' });
    }

    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: 'Cancellation failed' });
  }
});

// ── POST /api/ca/reviews ──────────────────────────────────────────────────────
router.post('/reviews', auth, pro, async (req, res) => {
  try {
    const { caId, bookingId, rating, comment } = req.body;

    const booking = await CABooking.findOne({ _id: bookingId, user: req.userId });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'completed') return res.status(400).json({ error: 'Can only review completed consultations' });
    if (booking.hasReviewed) return res.status(400).json({ error: 'You have already reviewed this consultation' });

    await CAReview.create({ user: req.userId, caId, bookingId, rating, comment });
    
    booking.hasReviewed = true;
    await booking.save();

    // Recalculate CA Average Rating
    const reviews = await CAReview.find({ caId });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / reviews.length;

    await CAProfile.findByIdAndUpdate(caId, {
      rating: parseFloat(avgRating.toFixed(1)),
      totalReviews: reviews.length
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
