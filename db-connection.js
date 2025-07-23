const mongoose = require('mongoose');
const db = mongoose.connect(process.env.MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
});

module.exports = db;