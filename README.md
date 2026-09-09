# FWHZZ WhatsApp Bot

Bot WhatsApp otomatis untuk manajemen grup dengan fitur moderasi, keamanan file, dan AI assistant.

## Fitur

### Manajemen Anggota
- `!add <nomor>` - Tambah anggota ke grup
- `!kick @user` - Keluarkan anggota (mention atau reply)
- `!promote @user` - Jadikan admin
- `!demote @user` - Cabut status admin

### Moderasi Pesan
- `!del` - Hapus pesan (reply pesan yang mau dihapus)
- `!tagall` - Tag semua member dengan mention terlihat
- `!hidetag` - Tag semua member tanpa mention

### Pengaturan Grup
- `!groupinfo` - Lihat info grup
- `!link` - Dapatkan link undangan
- `!revoke` - Perbarui link undangan
- `!setname <nama>` - Ubah nama grup
- `!setdesc <deskripsi>` - Ubah deskripsi
- `!mute` - Kunci grup (hanya admin)
- `!unmute` - Buka grup (semua bisa chat)

### Keamanan
- `!scan` - Scan file untuk malware (gunakan ClamAV)

### Informasi
- `!help` - Daftar command
- `!status` - Status bot
- `!id` - ID grup
- `!owner` - Nomor owner

### AI
- `!ai <pertanyaan>` - Tanya ke Gemini AI (bisa digunakan siapa saja)

## Install

### 1. Clone repo
```bash
git clone https://github.com/hanzz1213/Simple-Whatsapp-Bot.git
cd Simple-Whatsapp-Bot
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup config
```bash
cp config.example.json config.json
```

Edit `config.json`:
```json
{
  "owner": "6281234567890",
  "targetGroup": ""
}
```

Ganti nomor dengan punya Anda (format 62XXXXXXXXX untuk Indonesia).

### 4. Jalankan
```bash
npm start
```

## Cara Pairing

1. Jalankan bot dengan `npm start`
2. Masukkan nomor WhatsApp Anda (format 62...)
3. Salin kode pairing yang muncul
4. Di WhatsApp, masuk ke Setelan → Perangkat tertaut → Tautkan dengan nomor telepon
5. Masukkan kode pairing
6. Bot siap digunakan

## Catatan

- Bot harus menjadi admin grup untuk menjalankan command moderasi
- Hanya owner yang bisa gunakan command admin (kecuali `!ai` dan `!scan`)
- Untuk fitur scanner, pastikan ClamAV sudah terinstall
- Bot perlu koneksi internet yang stabil

## API Keys (Opsional)

Untuk AI feature, tambahkan environment variable:
```bash
export GEMINI_API_KEY=your_key
```

## Deps

- @whiskeysockets/baileys - WhatsApp API
- pino - Logger
- ClamAV - File scanner (external)

## License

ISC
