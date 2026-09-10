// spotifylive/server.js
//
// Server terpisah buat fitur "listening room". Jalan bareng bot WA kamu
// (proses Node sendiri), nyediain GUI mirip Spotify + room realtime
// pake Socket.IO biar host & pendengar bisa dengerin lagu yang sama
// bareng-bareng.
//
// CATATAN JUJUR: ini BUKAN streaming resmi dari Spotify (Spotify nge-DRM
// audio-nya, ga bisa diambil langsung tanpa Spotify Premium + Web Playback
// SDK resmi + OAuth login tiap user). Jadi caranya: search & metadata
// tampilannya nge-mirip Spotify, tapi sumber audio sebenernya dari YouTube
// (sama kayak fitur !ytmp3 sebelumnya). Kalau nanti mau upgrade ke Spotify
// Web Playback SDK asli, itu proyek terpisah yang jauh lebih besar (perlu
// tiap listener punya akun Spotify Premium).
//
// Install dulu:
//   npm install express socket.io ytdl-core yt-search nanoid@3

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const ytdl = require('ytdl-core');
const yts = require('yt-search');
const { nanoid } = require('nanoid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.SPOTIFYLIVE_PORT || 4001;

app.use(express.static(__dirname + '/public'));

// serve GUI yang sama buat semua /room/<id>, roomId-nya dibaca di client via URL
app.get('/room/:roomId', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// room ada di memori aja — kalau server restart, semua room ilang
const rooms = new Map();
// struct: { host, members: Map<socketId,{name}>, current: {videoId,title,artist,thumb,duration}|null,
//           isPlaying: bool, position: number, updatedAt: number }

function createRoom(roomId) {
  const room = {
    host: null,
    members: new Map(),
    current: null,
    isPlaying: false,
    position: 0,
    updatedAt: Date.now(),
  };
  rooms.set(roomId);
  return room;
}

function roomSummary(room) {
  return {
    current: room.current,
    isPlaying: room.isPlaying,
    position: room.position,
    updatedAt: room.updatedAt,
    listenerCount: room.members.size,
  };
}

// --- REST: bikin room baru (dipanggil dari bot pas !spotifylive) ---
app.get('/api/create-room', (req, res) => {
  const roomId = nanoid(8);
  createRoom(roomId);
  res.json({ roomId });
});

// --- REST: search lagu (nyari di YouTube, ditampilin gaya Spotify) ---
app.get('/api/search', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json({ results: [] });

  try {
    const r = await yts(q);
    const results = r.videos.slice(0, 10).map(v => ({
      videoId: v.videoId,
      title: v.title,
      artist: v.author.name,
      thumbnail: v.thumbnail,
      duration: v.timestamp,
    }));
    res.json({ results });
  } catch (err) {
    console.error('search error', err);
    res.status(500).json({ results: [] });
  }
});

// --- REST: stream audio buat <audio> tag ---
app.get('/api/stream/:videoId', (req, res) => {
  const { videoId } = req.params;
  res.setHeader('Content-Type', 'audio/mpeg');
  ytdl(`https://youtube.com/watch?v=${videoId}`, { filter: 'audioonly', quality: 'highestaudio' })
    .on('error', err => {
      console.error('stream error', err);
      res.end();
    })
    .pipe(res);
});

// --- Socket.IO: sinkronisasi room ---
io.on('connection', socket => {
  let joinedRoomId = null;

  socket.on('join-room', ({ roomId, name }) => {
    let room = rooms.get(roomId);
    if (!room) room = createRoom(roomId);

    joinedRoomId = roomId;
    socket.join(roomId);
    room.members.set(socket.id, { name: name || 'Pendengar' });

    // yang pertama masuk jadi host
    if (!room.host) room.host = socket.id;

    socket.emit('joined', {
      isHost: room.host === socket.id,
      ...roomSummary(room),
    });

    io.to(roomId).emit('listener-count', room.members.size);
  });

  function requireHost(room) {
    return room && room.host === socket.id;
  }

  socket.on('play-track', track => {
    const room = rooms.get(joinedRoomId);
    if (!requireHost(room)) return;
    room.current = track;
    room.isPlaying = true;
    room.position = 0;
    room.updatedAt = Date.now();
    io.to(joinedRoomId).emit('state-update', roomSummary(room));
  });

  socket.on('toggle-play', ({ isPlaying, position }) => {
    const room = rooms.get(joinedRoomId);
    if (!requireHost(room)) return;
    room.isPlaying = isPlaying;
    room.position = position;
    room.updatedAt = Date.now();
    io.to(joinedRoomId).emit('state-update', roomSummary(room));
  });

  socket.on('seek', ({ position }) => {
    const room = rooms.get(joinedRoomId);
    if (!requireHost(room)) return;
    room.position = position;
    room.updatedAt = Date.now();
    io.to(joinedRoomId).emit('state-update', roomSummary(room));
  });

  // host ngirim posisi tiap beberapa detik buat koreksi drift di listener
  socket.on('sync-tick', ({ position }) => {
    const room = rooms.get(joinedRoomId);
    if (!requireHost(room)) return;
    room.position = position;
    room.updatedAt = Date.now();
    socket.to(joinedRoomId).emit('sync-correction', { position, updatedAt: room.updatedAt });
  });

  socket.on('disconnect', () => {
    if (!joinedRoomId) return;
    const room = rooms.get(joinedRoomId);
    if (!room) return;
    room.members.delete(socket.id);
    io.to(joinedRoomId).emit('listener-count', room.members.size);

    if (room.host === socket.id) {
      // host kabur, pindahin host ke member lain yang masih ada (kalau ada)
      const next = room.members.keys().next().value;
      room.host = next || null;
      if (room.host) io.to(room.host).emit('you-are-host');
    }

    if (room.members.size === 0) {
      rooms.delete(joinedRoomId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`spotifylive server jalan di port ${PORT}`);
});
