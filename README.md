## 🚀 Özellikler

- TypeScript ile güçlü tip kontrolü
- JWT tabanlı kimlik doğrulama ve yetkilendirme
- MongoDB veritabanı entegrasyonu
- Redis önbellek desteği
- Cloudinary ile dosya yükleme
- Email gönderimi için Nodemailer entegrasyonu
- CORS yapılandırması
- Cookie yönetimi

## 🛠 Teknoloji Stack

- Node.js
- TypeScript
- Express.js
- MongoDB (Mongoose)
- Redis
- JWT
- Cloudinary
- Nodemailer

## 📋 Gereksinimler

- Node.js (v14 veya üzeri)
- MongoDB
- Redis
- Cloudinary Hesabı

## 🔧 Kurulum

1. Repository'yi klonlayın:
git clone https://github.com/yildirimzia/Commerce.git

2. Gerekli bağımlılıkları yükleyin:
npm install

3. .env dosyasını oluşturun ve gerekli değişkenleri ekleyin:

PORT=8000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
REDIS_URL=your_redis_url
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

4. Server'ı başlatın:
npm run dev


## 📚 API Endpoints

### Kullanıcı İşlemleri
- `POST /api/v1/register` - Yeni kullanıcı kaydı
- `POST /api/v1/login` - Kullanıcı girişi
- `GET /api/v1/logout` - Kullanıcı çıkışı
- `GET /api/v1/me` - Kullanıcı profili
- `PUT /api/v1/update-user` - Kullanıcı bilgilerini güncelleme
- `DELETE /api/v1/delete-user/:id` - Kullanıcı silme
- `GET /api/v1/users` - Tüm kullanıcıları listeleme
- `PUT /api/v1/update-user-role/:id` - Kullanıcı rolünü güncelleme
- `POST /api/v1/social-auth` - Sosyal medya ile giriş
- `POST /api/v1/activate-user` - Kullanıcı aktivasyonu
- `POST /api/v1/forgot-password` - Şifre sıfırlama isteği
- `POST /api/v1/reset-password/:token` - Şifre sıfırlama
- `POST /api/v1/change-password` - Şifre değiştirme
- `POST /api/v1/update-user-info` - Kullanıcı bilgilerini güncelleme
- `POST /api/v1/update-user-avatar` - Kullanıcı avatarını güncelleme


## 🛡️ Güvenlik Önlemleri

- **JWT (JSON Web Token)**
  - Access ve Refresh token implementasyonu
  - Token rotasyonu ve yenileme mekanizması
  - Secure ve HttpOnly cookie kullanımı

- **Şifre Güvenliği**
  - Bcrypt ile şifre hash'leme
  - Güçlü şifre politikası
  - Şifre sıfırlama için güvenli token sistemi

- **API Güvenliği**
  - CORS (Cross-Origin Resource Sharing) koruması
  - Rate limiting - Brute force saldırılarına karşı koruma
  - Request boyut limitleri
  - XSS ve CSRF koruması
  - Input validasyonu

- **Oturum Yönetimi**
  - Güvenli oturum sonlandırma
  - Çoklu cihaz oturum kontrolü
  - Redis ile token blacklist yönetimi

- **Rol Tabanlı Yetkilendirme**
  - Admin/User rol sistemi
  - Endpoint bazlı yetkilendirme
  - Middleware ile rol kontrolü

## 📝 Notlar

- Bu API, kullanıcıların kayıt, giriş, çıkış, profil güncelleme gibi temel işlemleri içerir.
- Daha karmaşık işlevler için ek API endpointleri ekleyebiliriz
- Güvenlik önlemlerini geliştirmek ve uygulamayı daha güvenli hale getirmek için gerektiğinde daha fazla kontrol ekleyebilirsiniz.
