require('dotenv').config();
const mongoose = require('mongoose');

const Survey = require('./models/Survey');
const Response = require('./models/Response');

async function migrateVotesToResponses() {
  try {
    console.log('🔄 MongoDB ga ulanmoqda...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/survey_db');
    console.log('✅ Ulandi');

    console.log('📊 So\'rovnomalar soni:', await Survey.countDocuments());

    let totalResponses = 0;
    const surveys = await Survey.find({});

    for (const survey of surveys) {
      console.log(`\n🔄 So\'rovnoma: ${survey.title}`);
      
      for (const question of survey.questions) {
        console.log(`  ❓ Savol: ${question.questionText}`);
        
        // Har bir variant uchun ovozlar soni
        for (const option of question.options) {
          const votes = option.votes || 0;
          
          if (votes > 0) {
            // Votes maydonini olish (hozirgi schemada yo'q, fallback)
            const mockResponses = [];
            for (let i = 0; i < votes; i++) {
              mockResponses.push({
                surveyId: survey._id,
                questionId: String(question._id),
                questionType: question.questionType,
                optionId: option.optionText,
                answer: option.optionText,
                ipAddress: 'migrated',
                userAgent: 'migration-script',
                sessionId: 'migration_' + Date.now() + '_' + i
              });
            }
            
            await Response.insertMany(mockResponses);
            totalResponses += votes;
            console.log(`    ✅ ${option.optionText}: ${votes} ovoz ko'chirildi`);
          }
        }
      }
    }

    console.log('\n✅ Migration yakunlandi!');
    console.log(`📊 Jami ko'chirilgan javoblar: ${totalResponses}`);
    console.log(`📊 Jami javoblar: ${await Response.countDocuments()}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration xatosi:', error);
    process.exit(1);
  }
}

migrateVotesToResponses();
