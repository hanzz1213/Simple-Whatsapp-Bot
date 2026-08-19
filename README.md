# 🤖 FWHZZ WhatsApp Bot

FWHZZ adalah bot WhatsApp berbasis **Node.js + Baileys** yang dapat digunakan untuk membantu mengelola grup WhatsApp.

Repository:

https://github.com/hanzz1213/Simple-Whatsapp-Bot

---

# ✨ Fitur

- `!help` — Menampilkan daftar command
- `!status` — Mengecek status bot
- `!id` — Menampilkan ID grup
- `!add` — Menambahkan anggota
- `!kick` — Mengeluarkan anggota
- `!promote` — Menjadikan anggota admin
- `!demote` — Menghapus status admin
- `!del` — Menghapus pesan
- `!tagall` — Mention semua anggota
- `!hidetag` — Mention semua anggota
- `!groupinfo` — Melihat informasi grup
- `!link` — Mendapatkan link grup
- `!revoke` — Mengganti link grup
- `!mute` — Membatasi anggota
- `!unmute` — Membuka pembatasan anggota
- `!setname` — Mengubah nama grup
- `!setdesc` — Mengubah deskripsi grup
- `!scan` — Memindai file

> Daftar dan format command mengikuti versi source FWHZZ yang digunakan.

---

# 📱 Persyaratan

Sebelum menjalankan bot, siapkan:

- Android dengan Termux atau Linux
- Node.js
- Git
- Akun WhatsApp
- Koneksi internet

---

# 🚀 Instalasi di Termux

## 1. Update Termux

Jalankan:

```bash
pkg update && pkg upgrade
2. Install Node.js dan Git
pkg install nodejs git
Cek versi:
node -v
git --version
Jika keduanya menampilkan versi, instalasi berhasil.
📥 Download FWHZZ
Clone repository:
git clone https://github.com/hanzz1213/Simple-Whatsapp-Bot.git fwhzz-bot
Masuk ke folder:
cd fwhzz-bot
📦 Install Dependency
Jalankan:
npm install
Tunggu sampai proses selesai.
⚙️ Konfigurasi
Jika source FWHZZ menggunakan config.json, buat file konfigurasi:
cp config.example.json config.json
Kemudian edit:
nano config.json
Contoh:
{
  "owner": "628xxxxxxxxxx",
  "targetGroup": "120xxxxxxxx@g.us"
}
👤 Owner
owner adalah nomor WhatsApp pemilik atau administrator bot.
Gunakan format internasional tanpa tanda +.
Contoh:
628123456789
Bukan:
+628123456789
👥 Target Group
targetGroup adalah ID grup WhatsApp yang diizinkan menggunakan bot.
Contoh:
120363xxxxxxxx@g.us
Pastikan source FWHZZ yang digunakan memang membaca config.json. Jika tidak, konfigurasi tersebut harus disesuaikan dengan source bot.
🆔 Cara Mendapatkan ID Grup
Masukkan bot ke grup WhatsApp.
Kemudian gunakan:
!id
Jika fitur tersebut tersedia, bot akan memberikan ID grup.
Contoh:
120363xxxxxxxx@g.us
Masukkan ID tersebut ke config.json:
{
  "owner": "628xxxxxxxxxx",
  "targetGroup": "120363xxxxxxxx@g.us"
}
📲 Menjalankan Bot
Setelah instalasi dan konfigurasi selesai:
node index.cjs
Jika bot menggunakan pairing code, ikuti instruksi yang muncul di Termux.
Gunakan akun WhatsApp yang ingin dijadikan akun bot.
Setelah pairing berhasil, bot akan terhubung ke WhatsApp.
🔐 Session WhatsApp
Setelah berhasil login, FWHZZ akan membuat session.
Contohnya:
session/
Jangan menghapus folder session jika tidak diperlukan.
Session digunakan agar bot dapat mempertahankan login.
Jangan pernah membagikan folder ini kepada orang lain.
👑 Menjadikan Bot Admin
Agar command administrasi grup dapat digunakan, jadikan akun bot sebagai admin.
Caranya:
Buka WhatsApp.
Buka grup tempat bot berada.
Tekan nama grup.
Buka daftar peserta.
Cari akun bot.
Tekan akun bot.
Pilih Jadikan admin.
Setelah itu bot dapat menggunakan command yang membutuhkan hak admin, sesuai izin dan implementasi source.
Contohnya:
!kick
!promote
!demote
!del
!mute
!unmute
!setname
!setdesc
!link
!revoke
🧪 Tes Bot
Setelah bot terhubung dan menjadi admin, coba:
!help
Jika bot membalas dengan daftar command, berarti bot sudah berjalan.
Tes lainnya:
!status
atau:
!id
📋 Daftar Command
!help
Menampilkan daftar command.
!help
!status
Mengecek status bot.
!status