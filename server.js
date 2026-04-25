require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const surveyRoutes = require('./routes/survey');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 7000;

// CORS - Faqat ruxsat berilgan domenlar
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:7000')
  .split(',')
  .map(url => url.trim())
  .filter(url => url.length > 0);

const corsOptions = {
  origin: function (origin, callback) {
    // Request'da origin yo'q bo'lsa (masalan, curl), ruxsat berish
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS ruxsat bermadi'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Body parsers (JSON va form-urlencoded uchun)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health test route
app.post('/api/admin/test', (req, res) => {
  res.json({ message: 'OK', received: req.body });
});

// API Routes (static files'dan OLDIN bo'lishi kerak!)
app.use('/api/surveys', surveyRoutes);
app.use('/api/admin', adminRoutes);

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Main routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Server ishlayapti!' });
});

// 404 handler (API uchun JSON, boshqa uchun HTML)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Route topilmadi' });
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (req.path.startsWith('/api/')) {
    res.status(500).json({ error: err.message || 'Server xatosi' });
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Static files uchun fallback (HTML)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`✅ Server ${PORT} portda ishga tushdi`);
  console.log(`📱 http://localhost:${PORT}`);
  console.log(`🔐 http://localhost:${PORT}/admin.html`);

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/survey_db'
    );
    console.log('✅ MongoDB ulandi');

    const Admin = require('./models/Admin');
    const admin = await Admin.findOne({ username: 'admin' });

    // Faqat birinchi ishga tushishda admin yaratiladi
    const bootstrapPassword = (process.env.ADMIN_PASSWORD || '').trim() || 'admin123';

    if (!admin) {
      const newAdmin = new Admin({ username: 'admin', password: bootstrapPassword });
      await newAdmin.save();
      console.log(`⚠️ Admin yaratildi: admin / ${bootstrapPassword}`);
    }
  } catch (err) {
    console.error('❌ MongoDB xatosi:', err.message);
  }
});
