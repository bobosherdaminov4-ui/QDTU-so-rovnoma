const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true,
    index: true
  },
  questionId: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['radio', 'checkbox', 'text'],
    required: true
  },
  optionId: {
    type: String,
    default: null // Matnli javoblar uchun null
  },
  answer: {
    type: String,
    required: true
  },
  // Foydalanuvchi ma'lumotlari
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  sessionId: {
    type: String,
    default: null
  }
}, {
  timestamps: true, // createdAt va updatedAt avtomatik
  collection: 'responses'
});

// Indexlar - tez qidiruv va takroriy ovozni oldini olish uchun
responseSchema.index({ surveyId: 1, questionId: 1, sessionId: 1 });
responseSchema.index({ surveyId: 1, ipAddress: 1 });

module.exports = mongoose.model('Response', responseSchema);
