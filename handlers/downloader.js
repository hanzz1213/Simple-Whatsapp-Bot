// handlers/downloader.js
// Fitur: !tt (TikTok no watermark) dan !yt (YouTube mp4/mp3)
// Install dulu: npm install axios ytdl-core

const axios = require('axios');
const ytdl = require('ytdl-core');

// --- TikTok downloader ---
// Pakai API publik tikwm.com (banyak dipakai bot WA komunitas, gratis, tanpa key)
async function handleTiktok(sock, msg, from, text) {
  try {
    const url = text.split(' ')[1];
    if (!url) {
      return sock.sendMessage(from, { text: 'Contoh: !tt https://vt.tiktok.com/xxxxx' });
    }

    const { data } = await axios.get('https://www.tikwm.com/api/', {
      params: { url, hd: 1 },
    });

    if (!data || data.code !== 0) {
      return sock.sendMessage(from, { text: 'Link tidak valid atau video tidak ditemukan.' });
    }

    const videoUrl = data.data.hdplay || data.data.play;
    await sock.sendMessage(from, {
      video: { url: videoUrl },
      caption: `${data.data.title || ''}\n\n👤 ${data.data.author?.nickname || '-'}`,
    });
  } catch (err) {
    console.error('Error handleTiktok:', err);
    await sock.sendMessage(from, { text: 'Gagal download video TikTok.' });
  }
}

// --- YouTube downloader ---
// !yt <url> -> video 360p
// !ytmp3 <url> -> audio saja
async function handleYoutube(sock, msg, from, text, asAudio = false) {
  try {
    const url = text.split(' ')[1];
    if (!url || !ytdl.validateURL(url)) {
      return sock.sendMessage(from, { text: 'Contoh: !yt https://youtube.com/watch?v=xxxxx' });
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;

    await sock.sendMessage(from, { text: `⏳ Mengunduh: ${title}` });

    if (asAudio) {
      // ambil info dulu, terus pilih format audio terbaik SEBELUM download
      // biar mimetype yang dikirim sesuai sama format asli (webm/opus atau m4a)
      // -- kalau mimetype ga cocok sama isi filenya, audio bisa gagal diputer
      const chosenFormat = ytdl.chooseFormat(info.formats, {
        filter: 'audioonly',
        quality: 'highestaudio',
      });
      const mimetype = chosenFormat.mimeType?.split(';')[0] || 'audio/webm';

      const stream = ytdl.downloadFromInfo(info, { format: chosenFormat });
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);

      await sock.sendMessage(from, {
        audio: buffer,
        mimetype,
        fileName: `${title}.${chosenFormat.container || 'webm'}`,
      });
    } else {
      const stream = ytdl(url, { filter: format => format.container === 'mp4' && format.hasVideo && format.hasAudio, quality: 'highest' });
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);

      await sock.sendMessage(from, {
        video: buffer,
        caption: title,
      });
    }
  } catch (err) {
    console.error('Error handleYoutube:', err);
    await sock.sendMessage(from, { text: 'Gagal download dari YouTube. Video mungkin dibatasi atau ytdl-core perlu update.' });
  }
}

module.exports = { handleTiktok, handleYoutube };
