# FWHZZ WhatsApp Bot

Bot WA sederhana pake Node.js + Baileys, buat bantu-bantu ngatur grup. Awalnya cuma buat dipake sendiri tapi ya udah sekalian di-share aja siapa tau ada yang butuh.

repo: https://github.com/hanzz1213/Simple-Whatsapp-Bot

## Fitur

Command yang ada sekarang:

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

## Testing

kalo udah connect dan udah admin, coba aja ketik `!help` di grup. kalo bot bales list command berarti udah jalan normal. bisa juga coba `!status` atau `!id`.

---

ada bug atau mau request fitur, buka issue aja di repo ini.