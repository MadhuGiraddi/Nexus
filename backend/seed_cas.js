require('dotenv').config();
const mongoose = require('mongoose');
const CAProfile = require('./models/CAProfile');

const cas = [
  {
    name: "CA Ramesh Iyer",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    registrationNumber: "142356",
    specializations: ["ITR", "GST", "Audit"],
    experience: 12,
    location: { city: "Mumbai", state: "Maharashtra", pincode: "400001" },
    languages: ["English", "Hindi", "Marathi"],
    consultationFee: { online: 800, offline: 1500 },
    rating: 4.8,
    totalReviews: 45,
    verified: true,
    contact: { email: "ramesh.iyer@ca.nexus.in", phone: "9876543210" },
    about: "Specialized in direct and indirect taxes. Extensive background in corporate audit."
  },
  {
    name: "CA Sneha Reddy",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    registrationNumber: "234567",
    specializations: ["Startup", "Tax Planning", "NRI"],
    experience: 8,
    location: { city: "Bangalore", state: "Karnataka", pincode: "560001" },
    languages: ["English", "Telugu", "Kannada"],
    consultationFee: { online: 1200, offline: 2500 },
    rating: 4.9,
    totalReviews: 82,
    verified: true,
    contact: { email: "sneha.reddy@ca.nexus.in", phone: "9876543211", website: "snehacorp.in" },
    about: "Helping startups navigate FDI drops and NRI taxation flawlessly."
  },
  {
    name: "CA Amit Sharma",
    photo: "https://randomuser.me/api/portraits/men/82.jpg",
    registrationNumber: "345678",
    specializations: ["Audit", "GST"],
    experience: 15,
    location: { city: "Delhi", state: "Delhi", pincode: "110001" },
    languages: ["English", "Hindi", "Punjabi"],
    consultationFee: { online: 600, offline: 1200 },
    rating: 4.5,
    totalReviews: 30,
    verified: true,
    contact: { email: "amit.sharma@ca.nexus.in", phone: "9876543212" },
    about: "15 years of solid practice dealing with GST tribunals."
  },
  {
    name: "CA Karthik Kumar",
    photo: "https://randomuser.me/api/portraits/men/71.jpg",
    registrationNumber: "456789",
    specializations: ["NRI", "Tax Planning", "ITR"],
    experience: 20,
    location: { city: "Chennai", state: "Tamil Nadu", pincode: "600001" },
    languages: ["English", "Tamil"],
    consultationFee: { online: 1500, offline: 3000 },
    rating: 5.0,
    totalReviews: 120,
    verified: true,
    contact: { email: "karthik.kumar@ca.nexus.in", phone: "9876543213" },
    about: "Expert in complex international tax cases and double-taxation avoidance."
  },
  {
    name: "CA Priya Desai",
    photo: "https://randomuser.me/api/portraits/women/65.jpg",
    registrationNumber: "567890",
    specializations: ["ITR", "Audit", "Startup"],
    experience: 5,
    location: { city: "Pune", state: "Maharashtra", pincode: "411001" },
    languages: ["English", "Hindi", "Marathi"],
    consultationFee: { online: 500, offline: 1000 },
    rating: 4.2,
    totalReviews: 14,
    verified: true,
    contact: { email: "priya.desai@ca.nexus.in", phone: "9876543214" },
    about: "Young, dynamic CA bridging the gap for newly established businesses."
  },
  {
    name: "CA Rajesh Gupta",
    photo: "https://randomuser.me/api/portraits/men/60.jpg",
    registrationNumber: "678901",
    specializations: ["GST", "Tax Planning"],
    experience: 25,
    location: { city: "Hyderabad", state: "Telangana", pincode: "500001" },
    languages: ["English", "Hindi", "Telugu"],
    consultationFee: { online: 2000, offline: 5000 },
    rating: 4.7,
    totalReviews: 210,
    verified: true,
    contact: { email: "rajesh.gupta@ca.nexus.in", phone: "9876543215" },
    about: "Veteran chartered accountant. If I can't solve your tax problem, nobody can."
  },
  {
    name: "CA Ananya Varma",
    photo: "https://randomuser.me/api/portraits/women/68.jpg",
    registrationNumber: "789012",
    specializations: ["Startup", "NRI"],
    experience: 7,
    location: { city: "Mumbai", state: "Maharashtra", pincode: "400050" },
    languages: ["English", "Hindi"],
    consultationFee: { online: 1000, offline: 2000 },
    rating: 4.6,
    totalReviews: 54,
    verified: true,
    contact: { email: "ananya.varma@ca.nexus.in", phone: "9876543216" },
    about: "Focuses on tech startups and venture capital taxation setup."
  },
  {
    name: "CA Vikram Singh",
    photo: "https://randomuser.me/api/portraits/men/44.jpg",
    registrationNumber: "890123",
    specializations: ["Audit", "ITR"],
    experience: 11,
    location: { city: "Delhi", state: "Delhi", pincode: "110020" },
    languages: ["English", "Hindi"],
    consultationFee: { online: 700, offline: 1500 },
    rating: 4.4,
    totalReviews: 38,
    verified: true,
    contact: { email: "vikram.singh@ca.nexus.in", phone: "9876543217" },
    about: "Meticulous auditor for SMEs and large corporations looking to file cleanly."
  },
  {
    name: "CA Neha Patel",
    photo: "https://randomuser.me/api/portraits/women/8.jpg",
    registrationNumber: "901234",
    specializations: ["GST", "Startup"],
    experience: 9,
    location: { city: "Ahmedabad", state: "Gujarat", pincode: "380001" },
    languages: ["English", "Gujarati", "Hindi"],
    consultationFee: { online: 900, offline: 1800 },
    rating: 4.8,
    totalReviews: 76,
    verified: true,
    contact: { email: "neha.patel@ca.nexus.in", phone: "9876543218" },
    about: "Helping Gujarat's fastest growing businesses scale without GST hurdles."
  },
  {
    name: "CA Manish Tiwari",
    photo: "https://randomuser.me/api/portraits/men/50.jpg",
    registrationNumber: "012345",
    specializations: ["ITR", "Tax Planning"],
    experience: 14,
    location: { city: "Kolkata", state: "West Bengal", pincode: "700001" },
    languages: ["English", "Bengali", "Hindi"],
    consultationFee: { online: 800, offline: 1600 },
    rating: 4.5,
    totalReviews: 44,
    verified: true,
    contact: { email: "manish.tiwari@ca.nexus.in", phone: "9876543219" },
    about: "Ensuring personal and HUF tax structures are maximally optimized."
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB');
    await CAProfile.deleteMany({});
    
    // Default availability slots
    const defaultAvailability = [
      { day: "Monday", slots: ["10:00 AM", "11:30 AM", "2:00 PM", "4:00 PM"] },
      { day: "Tuesday", slots: ["10:00 AM", "11:00 AM", "3:00 PM"] },
      { day: "Wednesday", slots: ["12:00 PM", "2:00 PM", "4:00 PM"] },
      { day: "Thursday", slots: ["9:00 AM", "1:00 PM", "3:30 PM", "5:00 PM"] },
      { day: "Friday", slots: ["10:00 AM", "2:00 PM", "5:00 PM"] },
      { day: "Saturday", slots: ["10:00 AM", "12:00 PM"] }
    ];

    const data = cas.map(ca => ({
      ...ca,
      availability: defaultAvailability
    }));

    await CAProfile.insertMany(data);
    console.log('Successfully seeded 10 CA profiles for Nexus!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
