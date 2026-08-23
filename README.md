🤖 FWHZZ WhatsApp Bot

Bot WhatsApp berbasis Node.js + Baileys dengan berbagai fitur untuk administrasi grup, utility, keamanan, dan pengelolaan WhatsApp.

Repository ini bersifat public, sehingga siapa saja dapat mencoba dan mengembangkan bot ini.

---

✨ Fitur

👑 Owner System

- 🔐 Command hanya dapat digunakan oleh nomor owner.
- 🤫 Nomor lain yang mencoba command tidak mendapatkan balasan.
- 📱 Owner ditentukan secara lokal pada perangkat yang menjalankan bot.
- 🔒 Nomor owner tidak perlu ditulis di source code.
- 👥 Setiap orang yang menjalankan bot dapat menentukan owner mereka sendiri.

👥 Group Management

Command| Fungsi
"!add nomor"| Menambahkan anggota
"!kick @user"| Mengeluarkan anggota
"!promote @user"| Menjadikan admin
"!demote @user"| Menurunkan admin
"!tagall"| Mention semua anggota
"!hidetag"| Mention semua anggota tanpa menampilkan daftar mention
"!groupinfo"| Melihat informasi grup
"!link"| Mendapatkan link grup
"!revoke"| Mengganti link grup
"!setname teks"| Mengubah nama grup
"!setdesc teks"| Mengubah deskripsi grup
"!mute"| Membatasi pengguna sesuai sistem bot
"!unmute"| Membuka kembali pembatasan

🛠️ Utility

Command| Fungsi
"!help"| Menampilkan bantuan
"!status"| Melihat status bot
"!id"| Melihat ID chat
"!owner"| Informasi owner
"!sticker"| Membuat sticker
"!tag"| Mention pengguna
"!del"| Menghapus pesan tertentu

🛡️ Security

Command| Fungsi
"!scan"| Memindai file menggunakan sistem scanner

«Ketersediaan command dapat berbeda tergantung versi source dan konfigurasi bot.»

---

📱 Persyaratan

Sebelum menjalankan bot, siapkan:

- Android / Linux / VPS
- Node.js
- Git
- Internet
- Akun WhatsApp untuk bot

Untuk Android, Termux dapat digunakan.

---

📥 Instalasi

1. Clone repository

git clone https://github.com/hanzz1213/Simple-Whatsapp-Bot.git

Masuk ke folder:

cd Simple-Whatsapp-Bot

---

2. Cek Node.js

node -v

Disarankan menggunakan versi Node.js modern yang kompatibel dengan dependency project.

Jika Node.js belum tersedia di Termux:

pkg update
pkg upgrade
pkg install nodejs git

Cek kembali:

node -v
npm -v

---

📦 Install Dependency

Jalankan:

npm install

Tunggu sampai proses selesai.

---

👑 Konfigurasi Owner

Owner tidak disimpan di "index.cjs".

Owner disimpan secara lokal melalui:

config.json

File tersebut tidak boleh di-upload ke repository public.

Jika "config.json" belum ada, buat:

nano config.json

Isi:

{
  "owner": "628xxxxxxxxxx"
}

Ganti:

628xxxxxxxxxx

dengan nomor WhatsApp kamu.

Contoh format:

6285817xxxxxx

⚠️ Jangan gunakan:

+6285817xxxxxx

atau:

085817xxxxxx

Gunakan format internasional:

628xxxxxxxxxx

---

🔐 Sistem Owner Only

FWHZZ menggunakan sistem owner-only.

Contohnya:

Owner
628xxxxxxxxxx
     ↓
   !help
     ↓
   BOT RESPON

Sedangkan:

User lain
628yyyyyyyyyy
     ↓
   !help
     ↓
   BOT DIAM

Tidak ada pesan:

❌ Kamu bukan owner

Bot hanya mengabaikan command.

---

▶️ Menjalankan Bot

Setelah konfigurasi selesai:

node index.cjs

Jika repository kamu menggunakan file utama berbeda, sesuaikan dengan file yang tersedia.

---

📱 Menghubungkan WhatsApp

Saat bot meminta autentikasi, ikuti metode login yang tersedia pada versi Baileys yang digunakan oleh project.

Jika menggunakan pairing code:

1. Jalankan bot.
2. Masukkan nomor WhatsApp yang akan digunakan sebagai akun bot.
3. Bot akan memberikan pairing code.
4. Buka WhatsApp.
5. Masuk ke Perangkat tertaut.
6. Pilih Tautkan perangkat.
7. Pilih opsi menggunakan nomor telepon jika tersedia.
8. Masukkan pairing code.

Setelah berhasil:

WhatsApp Connected

Bot siap digunakan.

---

💬 Cara Menggunakan Command

Semua command menggunakan prefix:

!

Contoh:

!help

Melihat status:

!status

Melihat ID:

!id

---

👥 Contoh Command Grup

Menambahkan anggota

!add 628123456789

Mengeluarkan anggota

Mention pengguna:

!kick @user

Promote

!promote @user

Demote

!demote @user

Tag semua

!tagall

Hide tag

!hidetag

Informasi grup

!groupinfo

---

🎨 Sticker

Kirim gambar kemudian gunakan:

!sticker

Bot akan memproses gambar menjadi sticker jika fitur tersebut tersedia pada versi project.

---

🛡️ File Scanner

Untuk fitur scanner:

1. Kirim file ke chat.
2. Reply file tersebut.
3. Gunakan:

!scan

Bot akan menjalankan proses scanning sesuai scanner yang dikonfigurasi.

---

🔧 Menjalankan di Background — Termux

Jika ingin bot tetap berjalan setelah terminal ditutup:

nohup node index.cjs > bot.log 2>&1 &

Melihat log:

tail -f bot.log

Melihat proses:

ps -ef | grep node

---

🔄 Update Bot

Jika repository sudah pernah di-clone:

cd Simple-Whatsapp-Bot

Kemudian:

git pull

Install dependency jika ada perubahan:

npm install

Jalankan kembali:

node index.cjs

---

🔐 Keamanan

Jangan pernah upload:

config.json
session/
creds.json
auth_info/
*.session
token
password
API key

Pastikan file rahasia dimasukkan ke:

.gitignore

Contoh:

config.json
session/
auth_info/
*.session
.env

---

🌐 Repository

Source code:

"FWHZZ WhatsApp Bot — GitHub" (https://reference-url-citation.invalid/0)

---

🧪 Untuk Pengguna Baru

Urutan paling mudah:

1. Install Node.js
        ↓
2. Clone repository
        ↓
3. cd Simple-Whatsapp-Bot
        ↓
4. npm install
        ↓
5. Buat config.json
        ↓
6. Masukkan nomor owner
        ↓
7. node index.cjs
        ↓
8. Hubungkan WhatsApp
        ↓
9. Gunakan !help

---

⚠️ Catatan

Bot ini menggunakan WhatsApp melalui library pihak ketiga. Gunakan secara bertanggung jawab dan jangan melakukan spam atau aktivitas yang melanggar aturan WhatsApp.

Pastikan juga kamu memahami source code sebelum menjalankannya.

---

❤️ Credits

FWHZZ WhatsApp Bot

Developed by:

hanzz1213

Jika project ini membantu kamu, kamu dapat melakukan ⭐ pada repository GitHub.

---

📄 License

Lihat file "LICENSE" pada repository untuk informasi lisensi project.