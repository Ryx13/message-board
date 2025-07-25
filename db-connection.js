const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,        // safe to remove (deprecated in v6+)
  useUnifiedTopology: true      // safe to remove (deprecated in v6+)
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));
