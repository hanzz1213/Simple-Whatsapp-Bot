// handlers/spotifylive.js
// Fitur: !spotifylive -> bikin room baru & kirim link-nya ke chat.
//
// PENTING: server spotifylive (folder spotifylive/) harus dijalanin
// terpisah dan HARUS bisa diakses publik (bukan cuma localhost), soalnya
// nanti yang buka link itu temen-temen kamu di HP masing-masing, bukan
// cuma kamu sendiri.
//
// Opsi paling gampang buat expose ke publik: pakai ngrok
//   npm install -g ngrok      (atau download dari ngrok.com)
//   ngrok http 4001
// nanti ngrok kasih URL publik kayak https://xxxx.ngrok-free.app
// isi itu ke BASE_URL di bawah (lewat config.json atau env var).
//
// Kalau kamu punya VPS dengan domain/IP publik, tinggal set BASE_URL
// ke domain/IP itu, ga perlu ngrok.

const axios = require('axios');

// ganti sesuai setup kamu, atau taruh di config.json terus require di sini
const SPOTIFYLIVE_BASE_URL = process.env.SPOTIFYLIVE_BASE_URL || 'http://localhost:4001';

async function handleSpotifyLive(sock, msg, from) {
  try {
    const { data } = await axios.get(`${SPOTIFYLIVE_BASE_URL}/api/create-room`);
    const link = `${SPOTIFYLIVE_BASE_URL}/room/${data.roomId}`;

    await sock.sendMessage(from, {
      text:
        `🎧 Room baru dibuat!\n\n` +
        `${link}\n\n` +
        `Yang buka link ini duluan otomatis jadi host (bisa cari & muter lagu). ` +
        `Yang lain tinggal buka link yang sama buat ikut dengerin bareng.`,
    });
  } catch (err) {
    console.error('Error handleSpotifyLive:', err);
    await sock.sendMessage(from, {
      text: 'Gagal bikin room. Pastikan server spotifylive lagi nyala ya.',
    });
  }
}

module.exports = { handleSpotifyLive };
