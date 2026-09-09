# Simple WhatsApp Bot

Bot WhatsApp sederhana & ringan yang dibuat menggunakan [Baileys](https://github.com/WhiskeySockets/Baileys). Cocok buat dijadikan bahan pembelajaran, base bot awal, atau langsung dipakai buat kebutuhan sehari-hari.

> **Note:** Proyek ini dikembangkan secara santai. Kalau ada bug atau mau nambahin fitur, feel free buat buka Issue atau Pull Request.

---

## 🚀 Fitur Utama

- 📱 **Multi-Device Support** (via Baileys)
- ⚡ **Ringan & Cepat**
- 🛠️ **Struktur Kode Sederhana**: Mudah dipahami dan diubah sesuai kebutuhan
- 🧩 **Fitur Dasar**:
  - Menu / Command handler
  - Downloader (TikTok, IG, YouTube, dll)
  - Sticker Maker (Gambar to Sticker)
  - Dan fitur seru lainnya

*(Fitur akan terus di-update kalau lagi selang)*

---

## 🛠️ Persyaratan System

Sebelum menjalankan bot ini, pastikan kamu sudah menginstall:
- [Node.js](https://nodejs.org/) (Versi 18+ direkomendasikan)
- [Git](https://git-scm.com/)
- [FFmpeg](https://ffmpeg.org/) (Sangat disarankan agar fitur media/stiker berjalan lancar)

---

## 💻 Cara Install & Menjalankan

1. **Clone repository ini**
   ```bash
   git clone [https://github.com/hanzz1213/Simple-Whatsapp-Bot.git](https://github.com/hanzz1213/Simple-Whatsapp-Bot.git)
   cd Simple-Whatsapp-Bot
2.Install dependensi / module
bash
npm install
3.Konfigurasi
Buka file config.js (atau tempat setting nomor owner/prefix) dan sesuaikan nilainya
4.jalankan bot
bash
npm start
5.Scan QR / Pairing Code
Ikuti petunjuk di terminal untuk menghubungkan akun WhatsApp kamu
⚙️ Menjalankan di Background (PM2)
Biar bot tetap running meski terminal ditutup, pakai PM2:
npm install -g pm2
pm2 start index.js --name "wa-bot"
pm2 save
🤝 Kontribusi
Mau bantu ngembangin bot ini?
Fork repository ini
Buat branch fitur baru (git checkout -b fitur-keren)
Commit perubahan (git commit -m 'Tambah fitur X')
Push ke branch (git push origin fitur-keren)
Buka Pull Request
☕ Support
Kalau repository ini membantu, jangan lupa kasih Star ⭐ ya!
Created with ❤️ by hanzz1213.