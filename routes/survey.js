const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const Response = require('../models/Response');

// Barcha aktiv so'rovnomalarni olish
router.get('/', async (req, res) => {
  try {
    const surveys = await Survey.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(surveys);
  } catch (error) {
    console.error('Surveys fetch error:', error);
    res.status(500).json({ error: 'So\'rovnomalarni olishda xato' });
  }
});

// Bitta so'rovnoma olish
router.get('/:id', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ error: 'So\'rovnoma topilmadi' });
    }
    res.json(survey);
  } catch (error) {
    console.error('Survey fetch error:', error);
    res.status(500).json({ error: 'So\'rovnoma olishda xato' });
  }
});

// Ovoz berish uchun IP manzilni olish
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         'unknown';
}

// So'rovnoma javobini yuborish
router.post('/:id/submit', async (req, res) => {
  try {
    const { answers, sessionId } = req.body;
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({ error: 'So\'rovnoma topilmadi' });
    }

    if (!survey.isActive) {
      return res.status(400).json({ error: 'Bu so\'rovnoma yopiq' });
    }

    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Takroriy ovozni tekshirish (IP va sessionId orqali)
    if (sessionId) {
      const existingResponse = await Response.findOne({
        surveyId: survey._id,
        sessionId: sessionId
      });
      
      if (existingResponse) {
        return res.status(400).json({ 
          error: 'Siz bu so\'rovnomaga allaqachon javob bergansiz' 
        });
      }
    }

    // Har bir javobni Response collection da saqlash
    const responses = [];
    
    for (const answer of answers) {
      const question = survey.questions.id(answer.questionId);
      if (!question) continue;

      // Ovoz variantini tekshirish (faqat radio/checkbox uchun)
      if (question.questionType !== 'text') {
        const option = question.options.find(o => o.optionText === answer.selectedOption);
        if (!option) {
          return res.status(400).json({ 
            error: `Noto'g'ri variant: ${answer.selectedOption}` 
          });
        }
      }

      // Response yaratish
      const response = new Response({
        surveyId: survey._id,
        questionId: String(answer.questionId),
        questionType: question.questionType,
        optionId: answer.selectedOption || null,
        answer: answer.selectedOption || answer.textAnswer || '',
        ipAddress: ipAddress,
        userAgent: userAgent,
        sessionId: sessionId || null
      });

      await response.save();
      responses.push(response);
    }

    res.json({ 
      message: 'Javob qabul qilindi',
      responseCount: responses.length
    });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ error: 'Javob yuborishda xato' });
  }
});

// So'rovnoma statistikasi (aggregate orqali)
router.get('/:id/stats', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ error: 'So\'rovnoma topilmadi' });
    }

    // Har bir savol uchun ovozlar sonini hisoblash
    const stats = [];
    
    for (const question of survey.questions) {
      // Jami ovozlar
      const totalVotes = await Response.countDocuments({
        surveyId: survey._id,
        questionId: String(question._id)
      });

      // Variantlar bo'yicha ovozlar (faqat radio/checkbox)
      const optionStats = [];
      
      if (question.questionType !== 'text') {
        for (const option of question.options) {
          const votes = await Response.countDocuments({
            surveyId: survey._id,
            questionId: String(question._id),
            optionId: option.optionText
          });

          optionStats.push({
            optionText: option.optionText,
            votes: votes,
            percentage: totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0
          });
        }
      }

      stats.push({
        questionId: String(question._id),
        questionText: question.questionText,
        questionType: question.questionType,
        totalVotes: totalVotes,
        options: optionStats
      });
    }

    res.json({
      surveyId: survey._id,
      title: survey.title,
      totalResponses: await Response.countDocuments({ surveyId: survey._id }),
      questions: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Statistika olishda xato' });
  }
});

module.exports = router;
