# Cara integrasi fitur baru ke index.cjs

## 1. Install dependency yang dibutuhin

```bash
npm install wa-sticker-formatter sharp axios ytdl-core spotify-url-info yt-search node-fetch@2
```

(pakai `node-fetch@2` karena package spotify-url-info butuh versi CommonJS)

## 2. Copy folder `handlers/` ini ke root project kamu

Jadi strukturnya nanti:

```
fwhzz-bot/
├── handlers/
│   ├── sticker.js
│   ├── downloader.js
│   └── spotify.js
├── index.cjs
├── config.json
└── ...
```

## 3. Import di paling atas index.cjs

```js
const { handleSticker, handleToImg } = require('./handlers/sticker');
const { handleTiktok, handleYoutube } = require('./handlers/downloader');
const { handleSpotify } = require('./handlers/spotify');
```

## 4. Panggil di bagian message handler kamu

Cari bagian di index.cjs yang isinya semacam `if (text.startsWith('!help'))` dkk (biasanya di dalam `sock.ev.on('messages.upsert', ...)`), lalu tambahin cabang baru:

```js
else if (text.startsWith('!s')) {
  await handleSticker(sock, msg, from);
}
else if (text.startsWith('!toimg')) {
  await handleToImg(sock, msg, from);
}
else if (text.startsWith('!tt')) {
  await handleTiktok(sock, msg, from, text);
}
else if (text.startsWith('!yt ')) {
  await handleYoutube(sock, msg, from, text, false);
}
else if (text.startsWith('!ytmp3')) {
  await handleYoutube(sock, msg, from, text, true);
}
else if (text.startsWith('!spotify')) {
  await handleSpotify(sock, msg, from, text);
}
```

Sesuaikan nama variabel `sock`, `msg`, `from`, `text` dengan yang dipakai di index.cjs kamu — kemungkinan namanya udah sama karena pola umum Baileys, tapi cek dulu biar ga error.

## Command baru

| Command | Fungsi |
|---|---|
| `!s` (reply gambar/video) | Bikin stiker |
| `!toimg` (reply stiker) | Stiker jadi gambar |
| `!tt <link>` | Download TikTok tanpa watermark |
| `!yt <link>` | Download video YouTube |
| `!ytmp3 <link>` | Download audio YouTube |
| `!spotify <link>` | Download lagu dari link Spotify |

## Catatan penting

- **ytdl-core** kadang butuh update berkala karena YouTube sering ubah sistemnya — kalau tiba-tiba error, coba `npm update ytdl-core` dulu.
- **!spotify** tidak ambil audio langsung dari Spotify (memang tidak bisa/dilindungi), tapi cari lagu yang sama di YouTube lalu ambil audionya — jadi hasilnya bisa sedikit beda kualitas/versi dari originalnya.
- Fitur downloader ini manfaatin API pihak ketiga (tikwm) dan YouTube — pastikan dipakai buat penggunaan wajar (bukan buat distribusi ulang konten orang lain secara komersial), karena tetap ada aturan hak cipta dari platform aslinya.
