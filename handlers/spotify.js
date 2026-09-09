// handlers/spotify.js
// Fitur: !spotify <url>
// Install dulu: npm install spotify-url-info yt-search ytdl-core
//
// CATATAN: Spotify tidak menyediakan cara resmi untuk download audio lagunya
// (file audio di-DRM/protected). Jadi cara paling aman & stabil: ambil info
// lagu (judul + artis) dari link Spotify, lalu cari & ambil audionya dari
// YouTube (sama seperti fitur !ytmp3). Ini pendekatan yang paling umum
// dipakai bot-bot WA lain karena tidak melanggar proteksi Spotify.

const { default: spotifyUrlInfo } = require('spotify-url-info')(require('node-fetch'));
const yts = require('yt-search');
const ytdl = require('ytdl-core');

async function handleSpotify(sock, msg, from, text) {
  try {
    const url = text.split(' ')[1];
    if (!url || !url.includes('open.spotify.com')) {
      return sock.sendMessage(from, { text: 'Contoh: !spotify https://open.spotify.com/track/xxxxx' });
    }

    await sock.sendMessage(from, { text: '🔎 Mencari info lagu...' });

    // ambil metadata dari link spotify
    const track = await spotifyUrlInfo.getData(url);
    const title = track.name;
    const artist = track.artists?.map(a => a.name).join(', ') || track.artist || '';
    const query = `${title} ${artist}`;

    // cari di youtube berdasarkan judul+artis
    const searchResult = await yts(query);
    const video = searchResult.videos[0];

    if (!video) {
      return sock.sendMessage(from, { text: 'Lagu tidak ditemukan.' });
    }

    await sock.sendMessage(from, { text: `⏳ Mengunduh: ${title} - ${artist}` });

    const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    await sock.sendMessage(from, {
      audio: buffer,
      mimetype: 'audio/mp4',
      fileName: `${title} - ${artist}.mp3`,
    });
  } catch (err) {
    console.error('Error handleSpotify:', err);
    await sock.sendMessage(from, { text: 'Gagal mengambil lagu dari Spotify. Cek link atau coba lagi.' });
  }
}

module.exports = { handleSpotify };
