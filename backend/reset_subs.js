const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/nexus', { useNewUrlParser: true, useUnifiedTopology: true })
.then(async () => {
    console.log("Connected to DB");
    const res = await User.updateMany({}, { $set: { isSubscribed: false } });
    console.log(`Reset isSubscribed for ${res.modifiedCount} users.`);
    process.exit();
}).catch(console.log);
