import axios from 'axios';

const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api' });

http.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('nx_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

http.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/auth';
    }
    return Promise.reject(e);
  }
);

export const authAPI = {
  register:  (d) => http.post('/auth/register', d),
  login:     (d) => http.post('/auth/login', d),
  me:        ()  => http.get('/auth/me'),
  subscribe: ()  => http.post('/auth/subscribe')
};

export const bankingAPI = {
  linkToken:     ()          => http.post('/banking/link-token'),
  exchangeToken: (d)         => http.post('/banking/exchange-token', d),
  accounts:      ()          => http.get('/banking/accounts'),
  transactions:  (p)         => http.get('/banking/transactions', { params: p }),
  sync:          ()          => http.post('/banking/sync'),
  spending:      (days = 30) => http.get('/banking/spending', { params: { days } }),
  cashflow:      (days = 30) => http.get('/banking/cashflow', { params: { days } }),
  unlink:        (itemId)    => http.delete(`/banking/unlink/${itemId}`),
  simulateSpend: (d)         => http.post('/banking/simulate-spend', d),
};

export const marketAPI = {
  crypto:    () => http.get('/market/crypto'),
  global:    () => http.get('/market/global'),
  forex:     () => http.get('/market/forex'),
  feargreed: () => http.get('/market/feargreed'),
};

export const investAPI = {
  getSips:      () => http.get('/invest/sips'),
  createSip:    (d) => http.post('/invest/sips', d),
  updateSip:    (id, d) => http.put(`/invest/sips/${id}`, d),
  deleteSip:    (id) => http.delete(`/invest/sips/${id}`),

  getTriggers:  () => http.get('/invest/triggers'),
  toggleTrigger:(type, d) => http.post(`/invest/triggers/${type}/toggle`, d),
  getAnalytics: () => http.get('/invest/analytics'),

  // Brokerage
  getPortfolio: () => http.get('/invest/portfolio'),
  buy:          (d) => http.post('/invest/buy', d),
  sell:         (d) => http.post('/invest/sell', d),
  refill:       () => http.post('/invest/refill'),
};

export const loansAPI = {
  eligibility:  ()      => http.get('/loans/eligibility'),
  advisor:      ()      => http.get('/loans/advisor'),
  apply:        (d)     => http.post('/loans/apply', d),
  getAll:       ()      => http.get('/loans'),
  getOne:       (id)    => http.get(`/loans/${id}`),
  repay:        (id, d) => http.post(`/loans/${id}/repay`, d),
  upload:       (formData) => http.post('/loans/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const caAPI = {
  getAll:       (params) => http.get('/ca', { params }),
  getOne:       (id)     => http.get(`/ca/${id}`),
  getMyBookings:()       => http.get('/ca/bookings/my'),
  bookSlot:     (d)      => http.post('/ca/bookings', d),
  cancelBooking:(id)     => http.patch(`/ca/bookings/${id}/cancel`),
  submitReview: (d)      => http.post('/ca/reviews', d)
};

export default http;
