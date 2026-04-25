const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary konfiguratsiyasi
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer storage - Cloudinary orqali
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'survey-uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
