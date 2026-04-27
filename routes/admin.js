const express = require('express');
const router = express.Router();
const path = require('path');
const Admin = require('../models/Admin');
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const { authenticateAdmin, generateToken } = require('../middleware/auth');
const upload = require('../config/cloudinary');

async function attachVotesToSurvey(surveyDoc) {
  const survey = surveyDoc.toObject ? surveyDoc.toObject() : surveyDoc;

  const counts = await Response.aggregate([
    { $match: { surveyId: surveyDoc._id } },
    {
      $group: {
        _id: {
          questionId: '$questionId',
          optionId: '$optionId'
        },
        votes: { $sum: 1 },
        textAnswers: {
          $push: {
            $cond: [
              { $eq: ['$questionType', 'text'] },
              '$answer',
              null
            ]
          }
        }
      }
    }
  ]);

  const voteMap = new Map();
  counts.forEach(item => {
    const key = `${item._id.questionId}::${item._id.optionId}`;
    voteMap.set(key, { votes: item.votes, textAnswers: item.textAnswers.filter(t => t) });
  });

  survey.questions = (survey.questions || []).map(question => ({
    ...question,
    options: (question.options || []).map(option => {
      const data = voteMap.get(`${question._id}::${option.optionText}`);
      return {
        ...option,
        votes: data ? data.votes : 0,
        textAnswers: data ? data.textAnswers : []
      };
    }),
    textAnswers: question.questionType === 'text' || question.questionType === 'likert'
      ? counts
          .filter(c => c._id.questionId === String(question._id))
          .flatMap(c => c.textAnswers.filter(t => t))
      : []
  }));

  return survey;
}

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Login va parol kerak' });
    }

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ error: 'Noto\'g\'ri login yoki parol' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Noto\'g\'ri login yoki parol' });
    }

    // Token yaratish
    const token = generateToken(admin._id, admin.username);

    res.json({ 
      message: 'Muvaffaqiyatli kirildi',
      token,
      admin: { id: admin._id, username: admin.username }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login xatosi' });
  }
});

// Parolni o'zgartirish
router.post('/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Joriy va yangi parol kerak' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }

    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin topilmadi' });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Joriy parol noto\'g\'ri' });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Parol muvaffaqiyatli o\'zgartirildi' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Parolni o\'zgartirishda xato' });
  }
});

// Autentifikatsiya bilan himoyalangan route'lar
router.post('/surveys', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    
    const { title, description, questions } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Sarlavha kerak' });
    }
    
    // description optional
    const surveyData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      questions: []
    };

    // Questions ni parse qilish
    if (!questions) {
      return res.status(400).json({ error: 'Savollar kerak' });
    }

    try {
      surveyData.questions = typeof questions === 'string' ? JSON.parse(questions) : questions;
    } catch (parseError) {
      return res.status(400).json({ error: 'Savollar noto\'g\'ri formatda' });
    }

    // Savollar validatsiyasi
    if (!Array.isArray(surveyData.questions) || surveyData.questions.length === 0) {
      return res.status(400).json({ error: 'Kamida bitta savol bo\'lishi kerak' });
    }

    // Har bir savolning strukturasini tekshirish
    for (let i = 0; i < surveyData.questions.length; i++) {
      const q = surveyData.questions[i];
      if (!q.questionText || q.questionText.trim() === '') {
        return res.status(400).json({ error: `${i + 1}-savolda matn kerak` });
      }
      if (!q.questionType) {
        return res.status(400).json({ error: `${i + 1}-savolda tur kerak` });
      }
      
      // Radio va checkbox uchun options kerak
      if (q.questionType !== 'text' && q.questionType !== 'matrix') {
        if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
          return res.status(400).json({ error: `${i + 1}-savol uchun variantlar kerak` });
        }
      }
      
      // Matrix uchun rows (qatorlar) kerak
      if (q.questionType === 'matrix') {
        if (!q.rows || !Array.isArray(q.rows) || q.rows.length === 0) {
          return res.status(400).json({ error: `${i + 1}-Matrix savol uchun kamida bitta holat (qator) kerak` });
        }
      }
    }

    if (req.file) {
      surveyData.image = req.file.path; // Cloudinary URL
    }

    const survey = new Survey(surveyData);
    await survey.save();

    console.log(`✅ So'rovnoma yaratildi: ${survey.title} (ID: ${survey._id})`);
    res.json({ message: 'So\'rovnoma yaratildi', survey });
  } catch (error) {
    console.error('Survey create error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'So\'rovnoma yaratishda xato: ' + error.message });
  }
});

// Barcha so'rovnomalarni olish (admin uchun)
router.get('/surveys', authenticateAdmin, async (req, res) => {
  try {
    const surveys = await Survey.find().sort({ createdAt: -1 });
    const enriched = await Promise.all(surveys.map(attachVotesToSurvey));
    res.json(enriched);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'So\'rovnomalarni olishda xato' });
  }
});

// So'rovnoma natijalari
router.get('/surveys/:id/results', authenticateAdmin, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ error: 'So\'rovnoma topilmadi' });
    }

    const enrichedSurvey = await attachVotesToSurvey(survey);
    res.json(enrichedSurvey);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Natijalarni olishda xato' });
  }
});

// So'rovnoma o'chirish
router.delete('/surveys/:id', authenticateAdmin, async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    if (!survey) {
      return res.status(404).json({ error: 'So\'rovnoma topilmadi' });
    }
    res.json({ message: 'So\'rovnoma o\'chirildi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'So\'rovnoma o\'chirishda xato' });
  }
});

// So'rovnoma faolligini o'zgartirish
router.patch('/surveys/:id/toggle', authenticateAdmin, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ error: 'So\'rovnoma topilmadi' });
    }
    survey.isActive = !survey.isActive;
    await survey.save();
    res.json({ message: 'So\'rovnoma holati o\'zgartirildi', survey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Holatni o\'zgartirishda xato' });
  }
});

// Bazani tozalash (barcha ma'lumotlarni o'chirish)
router.post('/database/clear', authenticateAdmin, async (req, res) => {
  try {
    // Barcha so'rovnomalarni o'chirish
    await Survey.deleteMany({});
    
    // Barcha javoblarni o'chirish
    await Response.deleteMany({});
    
    console.log(`${req.adminUsername} baza tozaladi`);
    
    res.json({ 
      message: 'Baza muvaffaqiyatli tozalandi. Barcha so\'rovnomalar va javoblar o\'chirildi.' 
    });
  } catch (error) {
    console.error('Database clear error:', error);
    res.status(500).json({ error: 'Baza tozalashda xato' });
  }
});

// Javoblarni olish (Response collection)
router.get('/responses', authenticateAdmin, async (req, res) => {
  try {
    const { surveyId } = req.query;
    
    let query = {};
    if (surveyId) {
      query.surveyId = surveyId;
    }
    
    const responses = await Response.find(query)
      .populate('surveyId', 'title')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(responses);
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: 'Javoblarni olishda xato' });
  }
});

// So'rovnoma bo'yicha batafsil statistika
router.get('/surveys/:id/stats', authenticateAdmin, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ error: 'So\'rovnoma topilmadi' });
    }

    // Aggregate orqali statistika
    const stats = await Response.aggregate([
      {
        $match: { surveyId: survey._id }
      },
      {
        $group: {
          _id: '$questionId',
          totalVotes: { $sum: 1 },
          answers: { $push: '$answer' }
        }
      }
    ]);

    res.json({ 
      surveyId: survey._id,
      title: survey.title,
      totalResponses: stats.reduce((sum, s) => sum + s.totalVotes, 0),
      questionStats: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Statistika olishda xato' });
  }
});

module.exports = router;
