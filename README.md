# 📊 Survey App

**QDTU So'rovnoma Tizimi** — Onlayn so'rovnomalar yaratish va ovoz yig'ish platformasi.

## ✨ Features

- 🎯 So'rovnoma yaratish (radio, checkbox, matnli javoblar)
- 📊 Real-time statistika
- 🖼️ Rasm yuklash (Cloudinary)
- 🔐 Admin panel (JWT autentifikatsiya)
- 📱 Responsive dizayn (Tailwind CSS)
- 📤 Excel/CSV export
- 🛡️ Xavfsizlik hardening
- ☁️ Render-ready deploy

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (lokaldan yoki MongoDB Atlas)
- Cloudinary account (rasm yuklash uchun)

### 1. Clone va Install
```bash
git clone https://github.com/your-username/survey-app.git
cd survey-app
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env
```

`.env` faylini tahrirlang:
```env
MONGODB_URI=mongodb://localhost:27017/survey_db
JWT_SECRET=your-secret-key
ADMIN_PASSWORD=your-admin-password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Run
```bash
# Development
npm run dev

# Production
npm start
```

Server ishga tushadi:
- Frontend: `http://localhost:7000`
- Admin panel: `http://localhost:7000/admin.html`

---

## 📁 Project Structure

```
survey-app/
├── config/
│   └── cloudinary.js       # Cloudinary rasm yuklash
├── middleware/
│   └── auth.js             # JWT admin autentifikatsiya
├── models/
│   ├── Admin.js            # Admin model
│   ├── Survey.js           # So'rovnoma model
│   └── Response.js         # Javoblar (ovozlar)
├── routes/
│   ├── admin.js            # Admin API (CRUD + stats)
│   └── survey.js           # Public API (submit + view)
├── public/
│   ├── index.html          # Frontend (so'rovnoma ko'rish)
│   └── admin.html          # Admin panel
├── server.js               # Express server
├── .env.example            # Environment template
├── .gitignore
├── package.json
├── README.md
├── DEPLOY.md               # Render deploy qo'llanmasi
└── SECURITY.md             # Xavfsizlik hujjati
```

---

## 🔑 Admin Login

Birinchi ishga tushirganda yoki `.env` da `ADMIN_PASSWORD` berilgan:
- **Username:** `admin`
- **Password:** `.env` dagi `ADMIN_PASSWORD`

Parolni o'zgartirish:
- Admin panel → Settings → **Parolni O'zgartirish**
- Joriy parol talab qilinadi
- O'zgargandan keyin qayta login kerak

---

## 📡 API Endpoints

### Public API
```
GET  /api/surveys              # Barcha aktiv so'rovnomalar
GET  /api/surveys/:id          # So'rovnoma detallari
POST /api/surveys/submit       # Javob yuborish
GET  /api/surveys/:id/results  # Natijalar (aktiv bo'lsa)
```

### Admin API (JWT required)
```
POST   /api/admin/login                    # Login
POST   /api/admin/change-password          # Parol o'zgartirish
GET    /api/admin/surveys                  # Barcha so'rovnomalar
POST   /api/admin/surveys                  # So'rovnoma yaratish (rasm yuklash)
GET    /api/admin/surveys/:id/results      # Natijalar
PATCH  /api/admin/surveys/:id/toggle       # Aktiv/Yopish
DELETE /api/admin/surveys/:id              # O'chirish
GET    /api/admin/responses                # Barcha javoblar
GET    /api/admin/surveys/:id/stats        # Batafsil statistika
POST   /api/admin/database/clear           # Bazani tozalash
```

---

## 🛡️ Security Features

- ✅ JWT autentifikatsiya (24h token)
- ✅ Bcrypt password hashing
- ✅ Rate limiting (100 req/soat admin)
- ✅ CORS origin filtering
- ✅ Helmet security headers
- ✅ File upload limits (5MB)
- ✅ Input validation
- ✅ Audit logging
- ✅ Session management

---

## 📦 Dependencies

**Core:**
- express 5.x - Web framework
- mongoose 9.x - MongoDB ODM
- dotenv 17.x - Environment variables

**Security:**
- bcryptjs 3.x - Password hashing
- jsonwebtoken 9.x - JWT
- helmet 8.x - Security headers
- cors 2.8 - CORS control
- express-rate-limit 8.x - Rate limiting

**File Upload:**
- multer 2.x - Middleware
- cloudinary 1.x - Cloud storage
- multer-storage-cloudinary 4.x - Multer adapter

**Frontend:**
- Tailwind CSS 4.x - UI framework
- FontAwesome 6.x - Icons

---

## ☁️ Deploy to Render

To'liq qo'llanma: [`DEPLOY.md`](./DEPLOY.md)

### Tez deploy:
1. Cloudinary account oching → API kalitlar oling
2. MongoDB Atlas cluster yarating (bepul)
3. Render'da web service yarating
4. Environment variables qo'shing
5. Auto-deploy GitHub'dan

---

## 🧪 Testing

```bash
# Server test
node -e "require('./server')"

# API test (cURL)
curl http://localhost:7000/api/admin/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
```

---

## 📝 Notes

- Render'da **ephemeral filesystem** → Rasm faqat Cloudinary'da saqlanadi
- Free tier auto-sleep qiladi → Always On uchun pro plan kerak
- MongoDB Atlas free tier 512MB storage

---

## 🤝 Contributing

1. Fork qilish
2. Feature branch (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Pull Request

---

## 📄 License

ISC

---

## 👨‍💻 Author

NLP-Core-Team

---

## 📞 Support

- Muammo? [Issues](https://github.com/your-username/survey-app/issues)
- Xavfsizlik muammosi? [SECURITY.md](./SECURITY.md) ga qarang

**Muvaffaqiyatli foydalanish!** 🎉
