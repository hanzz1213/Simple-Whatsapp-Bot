// handlers/sticker.js
// Fitur: !s (gambar/video -> stiker) dan !toimg (stiker -> gambar)
// Install dulu: npm install wa-sticker-formatter sharp

const { Sticker, StickerTypes } = require('wa-sticker-formatter');

async function handleSticker(sock, msg, from) {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const target = quoted || msg.message;

    const isImage = target?.imageMessage;
    const isVideo = target?.videoMessage;

    if (!isImage && !isVideo) {
      return sock.sendMessage(from, { text: 'Kirim/reply gambar atau video singkat dengan caption !s' });
    }

    // download media
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
    const mediaMsg = isImage ? target.imageMessage : target.videoMessage;
    const type = isImage ? 'image' : 'video';

    const stream = await downloadContentFromMessage(mediaMsg, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    const sticker = new Sticker(buffer, {
      pack: 'FWHZZ',
      author: 'FWHZZ Bot',
      type: StickerTypes.FULL,
      quality: 70,
    });

    const stickerBuffer = await sticker.toBuffer();
    await sock.sendMessage(from, { sticker: stickerBuffer });
  } catch (err) {
    console.error('Error handleSticker:', err);
    await sock.sendMessage(from, { text: 'Gagal bikin stiker, coba lagi.' });
  }
}

async function handleToImg(sock, msg, from) {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const stickerMsg = quoted?.stickerMessage;

    if (!stickerMsg) {
      return sock.sendMessage(from, { text: 'Reply stiker dengan caption !toimg' });
    }

    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
    const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    // convert webp -> png pake sharp
    const sharp = require('sharp');
    const pngBuffer = await sharp(buffer).png().toBuffer();

    await sock.sendMessage(from, { image: pngBuffer });
  } catch (err) {
    console.error('Error handleToImg:', err);
    await sock.sendMessage(from, { text: 'Gagal convert stiker ke gambar.' });
  }
}

module.exports = { handleSticker, handleToImg };
