const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false, // Optional qildik
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  questions: [{
    questionText: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      enum: ['radio', 'checkbox', 'text'],
      default: 'radio'
    },
    options: [{
      optionText: {
        type: String,
        required: true
      }
      // votes maydoni o'chirildi - Response collection da saqlanadi
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // createdAt va updatedAt avtomatik yaratiladi
  collection: 'surveys'
});

// Indexlar
surveySchema.index({ isActive: 1, createdAt: -1 });
surveySchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Survey', surveySchema);
