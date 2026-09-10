# FWHZZ WhatsApp Bot

Bot WA sederhana pake Node.js + Baileys, buat bantu-bantu ngatur grup + hiburan dikit. Awalnya cuma buat dipake sendiri tapi ya udah sekalian di-share aja siapa tau ada yang butuh.

repo: https://github.com/hanzz1213/Simple-Whatsapp-Bot

## Fitur

Command grup:

- `!help` - liat semua command
- `!status` - cek bot masih hidup apa engga
- `!id` - liat id grup
- `!add` - invite member
- `!kick` - keluarin member
- `!promote` / `!demote` - jadiin/copot admin
- `!del` - hapus pesan
- `!tagall` / `!hidetag` - mention semua orang
- `!groupinfo` - info grup
- `!link` / `!revoke` - liat/ganti link invite
- `!mute` / `!unmute` - kunci/buka grup
- `!setname` / `!setdesc` - ganti nama/deskripsi grup
- `!scan` - scan file

Command hiburan (baru ditambahin):

- `!s` - reply gambar/video pendek buat dijadiin stiker
- `!toimg` - reply stiker buat diubah balik jadi gambar
- `!tt <link>` - download video TikTok tanpa watermark
- `!yt <link>` - download video youtube
- `!ytmp3 <link>` - download audio dari youtube
- `!spotify <link>` - kirim link lagu spotify, nanti dikirimin audionya
- `!spotifylive` - bikin room, bisa dengerin lagu bareng temen (masih eksperimental, baca bagian bawah)

nanti mungkin nambah lagi kalo sempet ngerjain.

## Yang dibutuhin

- HP android + Termux, atau bisa juga VPS/linux
- Node.js sama Git udah keinstall
- akun WA (disaranin pake nomor cadangan, bukan nomor utama)

## Cara install (di Termux)

Update dulu termuxnya

```
pkg update && pkg upgrade
```

install node sama git

```
pkg install nodejs git
```

cek udah kepasang apa belum

```
node -v
git --version
```

kalo dua-duanya keluar versi nya berarti aman, lanjut clone reponya

```
git clone https://github.com/hanzz1213/Simple-Whatsapp-Bot.git fwhzz-bot
cd fwhzz-bot
```

terus install dependency nya, ini agak lama tergantung koneksi

```
npm install
```

kalo mau pake fitur hiburan (stiker/downloader/spotify), install juga package tambahan ini

```
npm install wa-sticker-formatter sharp axios ytdl-core spotify-url-info yt-search node-fetch@2
```

## Setting config

Copy dulu file example nya

```
cp config.example.json config.json
```

terus edit pake nano (atau editor apa aja yang lo suka)

```
nano config.json
```

isinya kira2 gini

```json
{
  "owner": "628xxxxxxxxxx",
  "targetGroup": "120xxxxxxxx@g.us"
}
```

buat `owner`, isi nomor WA lo pake format internasional TAPI tanpa tanda +. jadi bukan `+628xxx` tapi `628xxx` aja.

buat `targetGroup`, ini id grup yang boleh pake bot. cara dapetinnya masukin dulu bot ke grup, terus ketik `!id` di grup itu, nanti bot bakal balas id grupnya. tinggal copy paste ke config.

## Jalanin botnya

kalo config udah beres, tinggal

```
node index.cjs
```

biasanya bakal muncul pairing code atau QR, ikutin aja instruksinya, scan/masukin di WA yang mau dijadiin bot.

## Biar botnya tetep nyala pas HP/terminal ditutup

kalo dijalanin biasa pake `node index.cjs`, begitu app Termux ditutup atau koneksi ssh keputus, botnya ikut mati. buat production biasanya dijalanin di background pake salah satu cara ini:

**pake pm2** (paling gampang, ada auto-restart kalo crash)

```
npm install -g pm2
pm2 start index.cjs --name fwhzz-bot
```

cek statusnya

```
pm2 status
pm2 logs fwhzz-bot
```

kalo mau stop/restart

```
pm2 stop fwhzz-bot
pm2 restart fwhzz-bot
```

biar pm2 auto-start lagi kalo device/vps reboot

```
pm2 startup
pm2 save
```

**pake nohup** (lebih simpel, ga perlu install apa-apa)

```
nohup node index.cjs > bot.log 2>&1 &
```

nanti prosesnya jalan di background, log-nya kesimpen di file `bot.log`. buat liat log-nya realtime:

```
tail -f bot.log
```

buat stop, cari dulu process id-nya terus kill

```
ps aux | grep index.cjs
kill <PID>
```

**pake tmux/screen** (kalo mau tetep bisa liat terminal-nya kapan aja)

```
pkg install tmux
tmux new -s fwhzz
node index.cjs
```

detach session-nya (bot tetep jalan) pake `Ctrl+B` terus `D`. buat balik liat lagi:

```
tmux attach -t fwhzz
```

saran sih pake pm2 aja kalo memungkinkan, soalnya ada auto-restart otomatis kalo botnya crash tiba-tiba, ga perlu jalanin manual lagi.

> khusus buat `!spotifylive`, servernya (`spotifylive/server.js`) juga perlu dijalanin dengan cara yang sama biar tetep nyala bareng bot-nya. bisa pake pm2 juga, tinggal `pm2 start spotifylive/server.js --name spotifylive-server`.

## Soal session

pas login pertama bakal ke-generate folder `session/`. JANGAN dihapus kalo ga kepepet, soalnya itu yang bikin bot tetep login tanpa harus scan ulang tiap kali jalanin.

dan yang paling penting - JANGAN SEKALI-KALI share folder ini ke orang lain atau upload ke github/public repo. itu sama aja kasih akses login WA lo ke orang. udah masuk di .gitignore sih harusnya, tapi tetep double check ya sebelum push.

## Biar bisa dipake command admin

command kayak kick, mute, dll butuh bot jadi admin dulu di grupnya. caranya:

1. buka grup di WA
2. tap nama grup di atas
3. masuk ke daftar peserta
4. cari akun bot, tap
5. pilih "jadikan admin"

## Soal fitur !spotifylive

ini beda sendiri dari command lain, soalnya butuh server terpisah yang nyala terus (bukan cuma fungsi biasa di bot). singkatnya:

1. masuk folder `spotifylive/`, install dependency-nya (`express socket.io ytdl-core yt-search nanoid@3`)
2. jalanin `node server.js` (defaultnya port 4001), biarin nyala bareng proses bot
3. karena yang buka link-nya temen-temen kamu (bukan cuma kamu), server ini harus bisa diakses dari luar, paling gampang pake ngrok (`ngrok http 4001`)
4. baru command `!spotifylive` bisa dipake buat generate link room-nya

detail lengkapnya + kode-kodenya nyusul, ini masih tahap awal jadi kemungkinan masih ada bug kecil sana-sini. juga penting: audio yang diputer di room ini sebenernya dari youtube, bukan streaming asli spotify (spotify emang ga bisa di-download langsung tanpa akun premium + sdk resminya), jadi anggep aja "spotify-style room" bukan "spotify beneran".

## Testing

kalo udah connect dan udah admin, coba aja ketik `!help` di grup. kalo bot bales list command berarti udah jalan normal. bisa juga coba `!status` atau `!id`.

buat fitur baru, tinggal reply gambar sama `!s` buat tes stiker, atau `!tt <link tiktok>` buat tes downloader.

---

ada bug atau mau request fitur, buka issue aja di repo ini.
