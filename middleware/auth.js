const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Admin autentifikatsiya middleware
const authenticateAdmin = (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Avtomatizatsiya kerak',
        message: 'Token topilmadi' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.adminId;
    req.adminUsername = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Noto\'g\'ri token',
      message: 'Token yaroqsiz yoki muddati tugagan' 
    });
  }
};

// Token yaratish funksiyasi
const generateToken = (adminId, username) => {
  return jwt.sign(
    { adminId, username },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

module.exports = {
  authenticateAdmin,
  generateToken,
  JWT_SECRET
};
