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
