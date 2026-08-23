const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    downloadMediaMessage
} = require("@whiskeysockets/baileys");

const P = require("pino");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execFile } = require("child_process");

const HOME = process.env.HOME;

const SESSION_DIR = path.join(HOME, "session");
const CONFIG_FILE = path.join(HOME, "config.json");
const SCAN_DIR = path.join(HOME, "fwhzz-scans");

const BOT_NAME = "FWHZZ";
const RECONNECT_DELAY = 2000;

let sock = null;
let reconnectTimer = null;
let starting = false;

// ==================================================
// FOLDER
// ==================================================

fs.mkdirSync(SESSION_DIR, { recursive: true });
fs.mkdirSync(SCAN_DIR, { recursive: true });

// ==================================================
// CONFIG
// ==================================================

function loadConfig() {
    const defaultConfig = {
        owner: "",
        targetGroup: ""
    };

    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(
            CONFIG_FILE,
            JSON.stringify(defaultConfig, null, 2)
        );

        return defaultConfig;
    }

    try {
        return JSON.parse(
            fs.readFileSync(CONFIG_FILE, "utf8")
        );
    } catch (err) {
        console.log("Config rusak, menggunakan config default.");
        return defaultConfig;
    }
}

const config = loadConfig();

// FWHZZ OWNER ONLY SYSTEM
// Owner dibaca dari config.json.
// Nomor owner TIDAK disimpan di source code.

function fwhzzNormalizeNumber(value) {
    if (!value) return "";

    let number = String(value)
        .replace(/\D/g, "");

    if (number.startsWith("0")) {
        number = "62" + number.slice(1);
    }

    return number;
}

function fwhzzGetSender(msg) {
    return (
        msg?.key?.participant ||
        msg?.participant ||
        msg?.key?.remoteJid ||
        ""
    );
}

function fwhzzGetSenderNumber(msg) {
    const sender = fwhzzGetSender(msg);

    return fwhzzNormalizeNumber(
        String(sender)
            .split(":")[0]
            .split("@")[0]
    );
}

function fwhzzIsOwner(msg) {
    const configuredOwner =
        fwhzzNormalizeNumber(config?.owner);

    const sender =
        fwhzzGetSenderNumber(msg);

    if (!configuredOwner) {
        return false;
    }

    return sender === configuredOwner;
}

function fwhzzOwnerOnly(msg, text) {

    // Pesan biasa tetap diproses normal.
    if (!text || !text.startsWith("!")) {
        return true;
    }

    // Command hanya untuk owner.
    // User lain benar-benar diabaikan.
    return fwhzzIsOwner(msg);
}



// ==================================================
// NUMBER / JID
// ==================================================

function normalizeNumber(value) {
    if (!value) return "";

    let number = String(value).replace(/\D/g, "");

    if (number.startsWith("0")) {
        number = "62" + number.slice(1);
    }

    return number;
}

function jidNumber(jid) {
    if (!jid) return "";

    return String(jid)
        .split(":")[0]
        .split("@")[0];
}

function cleanJid(jid) {
    if (!jid) return "";

    return String(jid).trim();
}

// ==================================================
// BOT ID
// ==================================================

function getBotIds() {
    const ids = new Set();

    if (!sock?.user) {
        return ids;
    }

    const user = sock.user;

    if (user.id) {
        ids.add(cleanJid(user.id));
    }

    if (user.lid) {
        ids.add(cleanJid(user.lid));
    }

    if (user.jid) {
        ids.add(cleanJid(user.jid));
    }

    // Nomor bot
    const number = jidNumber(user.id);

    if (number) {
        ids.add(number);
        ids.add(`${number}@s.whatsapp.net`);
    }

    return ids;
}

// ==================================================
// LID-SAFE ADMIN CHECK
// ==================================================
function normalizeJidForCompare(jid) {
    if (!jid) return "";

    let value = String(jid)
        .trim()
        .toLowerCase();

    const parts = value.split("@");

    let user = parts[0];
    const domain = parts[1] || "";

    // Hapus device suffix seperti :9
    if (user.includes(":")) {
        user = user.split(":")[0];
    }

    return `${user}@${domain}`;
}

function participantMatchesBot(participant) {
    if (!participant) return false;

    const botIds = getBotIds();

    const participantIds = [];

    if (participant.id) {
        participantIds.push(participant.id);
    }

    if (participant.lid) {
        participantIds.push(participant.lid);
    }

    if (participant.jid) {
        participantIds.push(participant.jid);
    }

    for (const participantId of participantIds) {

        const normalizedParticipant =
            normalizeJidForCompare(participantId);

        for (const botId of botIds) {

            const normalizedBot =
                normalizeJidForCompare(botId);

            if (
                normalizedParticipant ===
                normalizedBot
            ) {
                return true;
            }
        }
    }

    return false;
}


// ==================================================
// OWNER CHECK
// ==================================================

function isOwner(sender) {
    if (!sender) {
        return false;
    }

    // Cek Owner LID
    const ownerLid =
        normalizeJidForCompare(
            config.ownerLid || ""
        );

    const senderClean =
        normalizeJidForCompare(sender);

    if (
        ownerLid &&
        senderClean === ownerLid
    ) {
        return true;
    }

    // Cek nomor WhatsApp
    const ownerNumber =
        normalizeNumber(
            config.owner || ""
        );

    const senderNumber =
        normalizeNumber(
            jidNumber(sender)
        );

    if (
        ownerNumber &&
        senderNumber &&
        ownerNumber === senderNumber
    ) {
        return true;
    }

    return false;
}

function isAdminParticipant(participant) {
    if (!participant) return false;

    return (
        participant.admin === "admin" ||
        participant.admin === "superadmin"
    );
}

function isBotAdmin(metadata) {
    if (!metadata?.participants) {
        return false;
    }

    for (const participant of metadata.participants) {

        if (
            participantMatchesBot(participant) &&
            isAdminParticipant(participant)
        ) {
            return true;
        }
    }

    return false;
}

// ==================================================
// DEBUG
// ==================================================

function printAdminDebug(metadata) {
    console.log("");
    console.log("========================================");
    console.log("        FWHZZ ADMIN DEBUG");
    console.log("========================================");

    console.log("BOT ID:");

    for (const id of getBotIds()) {
        console.log(" ", id);
    }

    console.log("");
    console.log("PARTICIPANTS:");

    for (const p of metadata?.participants || []) {

        console.log(
            "ID:",
            p.id || "-",
            "| LID:",
            p.lid || "-",
            "| JID:",
            p.jid || "-",
            "| ADMIN:",
            p.admin || "NO"
        );
    }

    console.log("");
    console.log(
        "BOT ADMIN RESULT:",
        isBotAdmin(metadata)
    );

    console.log("========================================");
    console.log("");
}

// ==================================================
// GROUP
// ==================================================

function isGroup(jid) {
    return jid && jid.endsWith("@g.us");
}

async function getGroupMetadata(msg) {

    const jid = msg.key.remoteJid;

    if (!isGroup(jid)) {

        await sock.sendMessage(
            jid,
            {
                text:
                    "❌ Command ini hanya dapat digunakan di grup."
            }
        );

        return null;
    }

    try {

        return await sock.groupMetadata(jid);

    } catch (err) {

        console.error(
            "GROUP METADATA ERROR:",
            err
        );

        await sock.sendMessage(
            jid,
            {
                text:
                    "❌ Gagal mengambil data grup."
            }
        );

        return null;
    }
}

// ==================================================
// BOT ADMIN REQUIREMENT
// ==================================================

async function requireBotAdmin(msg) {

    const metadata =
        await getGroupMetadata(msg);

    if (!metadata) {
        return null;
    }

    printAdminDebug(metadata);

    if (!isBotAdmin(metadata)) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "❌ Bot harus menjadi admin grup untuk menjalankan command ini."
            }
        );

        return null;
    }

    return metadata;
}

// ==================================================
// USER ADMIN REQUIREMENT
// ==================================================

function findParticipant(metadata, jid) {

    if (!metadata?.participants) {
        return null;
    }

    const target = cleanJid(jid);

    return metadata.participants.find(p => {

        if (p.id === target) {
            return true;
        }

        if (p.lid === target) {
            return true;
        }

        if (p.jid === target) {
            return true;
        }

        return false;
    });
}

async function requireUserAdmin(msg) {

    const metadata =
        await getGroupMetadata(msg);

    if (!metadata) {
        return null;
    }

    const sender =
        msg.key.participant ||
        msg.participant ||
        msg.key.remoteJid;

    const participant =
        findParticipant(
            metadata,
            sender
        );

    if (!isAdminParticipant(participant)) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "❌ Hanya admin grup yang dapat menjalankan command ini."
            }
        );

        return null;
    }

    return metadata;
}

// ==================================================
// TEXT
// ==================================================

function getText(msg) {

    return (
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        msg.message?.documentMessage?.caption ||
        ""
    );
}

// ==================================================
// COMMAND
// ==================================================

function parseCommand(text) {

    if (!text.startsWith("!")) {
        return null;

    }

    const parts =
        text.trim().split(/\s+/);

    return {
        command:
            parts[0].toLowerCase(),

        args:
            parts.slice(1)
    };
}

// ==================================================
// QUOTED MESSAGE
// ==================================================

function getQuoted(msg) {

    const context =
        msg.message?.extendedTextMessage?.contextInfo ||
        msg.message?.imageMessage?.contextInfo ||
        msg.message?.videoMessage?.contextInfo ||
        msg.message?.documentMessage?.contextInfo;

    if (!context?.quotedMessage) {
        return null;
    }

    return {
        key: {
            remoteJid:
                msg.key.remoteJid,

            fromMe: false,

            id:
                context.stanzaId,

            participant:
                context.participant
        },

        message:
            context.quotedMessage
    };
}

// ==================================================
// MENTIONS
// ==================================================

function getMentions(msg) {

    const context =
        msg.message?.extendedTextMessage?.contextInfo ||
        msg.message?.imageMessage?.contextInfo ||
        msg.message?.videoMessage?.contextInfo ||
        msg.message?.documentMessage?.contextInfo;

    return context?.mentionedJid || [];
}

function getTarget(msg) {

    const mentions =
        getMentions(msg);

    if (mentions.length > 0) {
        return mentions[0];
    }

    const quoted =
        getQuoted(msg);

    if (
        quoted?.key?.participant
    ) {
        return quoted.key.participant;
    }

    return null;
}

// ==================================================
// HELP
// ==================================================

async function commandHelp(msg) {

    const text = `
╭━━━〔 FWHZZ BOT 〕━━━╮
┃
┃ !help
┃ !status
┃ !id
┃ !owner
┃
┃ ADMIN
┃ !add nomor
┃ !kick @user
┃ !promote @user
┃ !demote @user
┃ !del
┃ !tagall
┃ !hidetag
┃
┃ GROUP
┃ !groupinfo
┃ !link
┃ !revoke
┃ !mute
┃ !unmute
┃ !setname teks
┃ !setdesc teks
┃
┃ SECURITY
┃ !scan
┃
╰━━━━━━━━━━━━━━━━━━╯
`;

    await sock.sendMessage(
        msg.key.remoteJid,
        {
            text
        }
    );
}

// ==================================================
// STATUS
// ==================================================

function formatUptime(seconds) {

    let s =
        Math.floor(seconds);

    const d =
        Math.floor(s / 86400);

    s %= 86400;

    const h =
        Math.floor(s / 3600);

    s %= 3600;

    const m =
        Math.floor(s / 60);

    s %= 60;

    return `${d}d ${h}h ${m}m ${s}s`;
}

async function commandStatus(msg) {

    const memory =
        process.memoryUsage();

    const text = `
╭━━〔 FWHZZ STATUS 〕━━╮
┃
┃ 🟢 Status: ONLINE
┃ 🔗 WhatsApp: CONNECTED
┃ 🔄 Reconnect: 2 detik
┃ 👑 Owner: Terproteksi
┃ ⏱️ Uptime: ${formatUptime(process.uptime())}
┃ 💾 RAM: ${(memory.rss / 1024 / 1024).toFixed(1)} MB
┃
╰━━━━━━━━━━━━━━━━━━╯
`;

    await sock.sendMessage(
        msg.key.remoteJid,
        {
            text
        }
    );
}

// ==================================================
// ID
// ==================================================

async function commandId(msg) {

    await sock.sendMessage(
        msg.key.remoteJid,
        {
            text:
                `🆔 ID grup:\n${msg.key.remoteJid}`
        }
    );
}

// ==================================================
// OWNER
// ==================================================

async function commandOwner(msg) {

    await sock.sendMessage(
        msg.key.remoteJid,
        {
            text:
                `👑 Owner FWHZZ:\n${config.owner || "BELUM DIATUR"}`
        }
    );
}

// ==================================================
// ADD
// ==================================================

async function commandAdd(msg, args) {

    const metadata =
        await requireUserAdmin(msg);

    if (!metadata) return;

    const botAdmin =
        await requireBotAdmin(msg);

    if (!botAdmin) return;

    if (!args.length) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "Contoh:\n!add 6281234567890"
            }
        );

        return;
    }

    const number =
        normalizeNumber(
            args.join("")
        );

    if (number.length < 10) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "❌ Nomor tidak valid."
            }
        );

        return;
    }

    const jid =
        `${number}@s.whatsapp.net`;

    try {

        console.log(
            "ADD:",
            jid
        );

        const result =
            await sock.groupParticipantsUpdate(
                msg.key.remoteJid,
                [jid],
                "add"
            );

        console.log(
            "ADD RESULT:",
            result
        );

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    `✅ Permintaan menambahkan ${number} telah diproses.`
            }
        );

    } catch (err) {

        console.error(
            "ADD ERROR:",
            err
        );

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "❌ Gagal menambahkan nomor."
            }
        );
    }
}

// ==================================================
// KICK
// ==================================================

async function commandKick(msg) {

    const metadata =
        await requireUserAdmin(msg);

    if (!metadata) return;

    const botAdmin =
        await requireBotAdmin(msg);

    if (!botAdmin) return;

    const target =
        getTarget(msg);

    if (!target) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "❌ Mention atau reply anggota yang ingin dikeluarkan."
            }
        );

        return;
    }

    try {

        await sock.groupParticipantsUpdate(
            msg.key.remoteJid,
            [target],
            "remove"
        );

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    `✅ @${jidNumber(target)} dikeluarkan.`,
                mentions: [target]
            }
        );

    } catch (err) {

        console.error(
            "KICK ERROR:",
            err
        );

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "❌ Gagal mengeluarkan anggota."
            }
        );
    }
}

// ==================================================
// PROMOTE
// ==================================================

async function commandPromote(msg) {

    const metadata =
        await requireUserAdmin(msg);

    if (!metadata) return;

    const botAdmin =
        await requireBotAdmin(msg);

    if (!botAdmin) return;

    const target =
        getTarget(msg);

    if (!target) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "❌ Mention atau reply anggota."
            }
        );

        return;
    }

    try {

        await sock.groupParticipantsUpdate(
            msg.key.remoteJid,
            [target],
            "promote"
        );

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    `✅ @${jidNumber(target)} sekarang menjadi admin.`,
                mentions: [target]
            }
        );

    } catch (err) {

        console.error(
            "PROMOTE ERROR:",
            err
        );
    }
}

// ==================================================
// DEMOTE
// ==================================================

async function commandDemote(msg) {

    const metadata =
        await requireUserAdmin(msg);

    if (!metadata) return;

    const botAdmin =
        await requireBotAdmin(msg);

    if (!botAdmin) return;

    const target =
        getTarget(msg);

    if (!target) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "❌ Mention atau reply admin."
            }
        );

        return;
    }

    try {

        await sock.groupParticipantsUpdate(
            msg.key.remoteJid,
            [target],
            "demote"
        );

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    `✅ @${jidNumber(target)} bukan lagi admin.`,
                mentions: [target]
            }
        );

    } catch (err) {

        console.error(
            "DEMOTE ERROR:",
            err
        );
    }
}

// ==================================================
// DELETE MESSAGE
// ==================================================

async function commandDelete(msg) {

    const metadata =
        await requireUserAdmin(msg);

    if (!metadata) return;

    const botAdmin =
        await requireBotAdmin(msg);

    if (!botAdmin) return;

    const quoted =
        getQuoted(msg);

    if (!quoted) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "❌ Reply pesan yang ingin dihapus."
            }
        );

        return;
    }

    try {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                delete: quoted.key
            }
        );

    } catch (err) {

        console.error(
            "DELETE ERROR:",
            err
        );
    }
}

// ==================================================
// TAG ALL
// ==================================================

async function commandTagAll(msg, args, hidden = false) {

    const metadata =
        await requireUserAdmin(msg);

    if (!metadata) return;

    const participants =
        metadata.participants || [];

    const mentions =
        participants.map(
            p => p.id
        );

    let text =
        args.join(" ").trim();

    if (!text) {
        text = "📢 Perhatian semua anggota";
    }

    if (!hidden) {

        text +=
            "\n\n" +
            participants
                .map(
                    p =>
                        `@${jidNumber(p.id)}`
                )
                .join(" ");
    }

    await sock.sendMessage(
        msg.key.remoteJid,
        {
            text,
            mentions
        }
    );
}

// ==================================================
// GROUP INFO
// ==================================================

async function commandGroupInfo(msg) {

    const metadata =
        await getGroupMetadata(msg);

    if (!metadata) return;

    const participants =
        metadata.participants || [];

    const admins =
        participants.filter(
            p =>
                p.admin === "admin" ||
                p.admin === "superadmin"
        );

    const text = `
📋 GROUP INFO

Nama:
${metadata.subject}

ID:
${msg.key.remoteJid}

Member:
${participants.length}

Admin:
${admins.length}
`;

    await sock.sendMessage(
        msg.key.remoteJid,
        {
            text
        }
    );
}

// ==================================================
// LINK
// ==================================================

async function commandLink(msg) {

    const metadata =
        await requireUserAdmin(msg);

    if (!metadata) return;

    const botAdmin =
        await requireBotAdmin(msg);

    if (!botAdmin) return;

    try {

        const code =
            await sock.groupInviteCode(
                msg.key.remoteJid
            );

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    `🔗 Link grup:\nhttps://chat.whatsapp.com/${code}`
            }
        );

    } catch (err) {

        console.error(
            "LINK ERROR:",
            err
        );
    }
}

// ==================================================
// REVOKE
// ==================================================

async function commandRevoke(msg) {

    const metadata =
        await requireUserAdmin(msg);

    if (!metadata) return;

    const botAdmin =
        await requireBotAdmin(msg);

    if (!botAdmin) return;

    try {

        await sock.groupRevokeInvite(
            msg.key.remoteJid
        );

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "✅ Link grup berhasil diperbarui."
            }
        );

    } catch (err) {

        console.error(
            "REVOKE ERROR:",
            err
        );
    }
}

// ==================================================
// MUTE
// ==================================================

async function commandMute(msg) {

    const metadata =
        await requireUserAdmin(msg);

    if (!metadata) return;

    const botAdmin =
        await requireBotAdmin(msg);

    if (!botAdmin) return;

    try {

        await sock.groupSettingUpdate(
            msg.key.remoteJid,
            "announcement"
        );

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "🔒 Grup dikunci. Hanya admin yang dapat mengirim pesan."
            }
        );

    } catch (err) {

        console.error(
            "MUTE ERROR:",
            err
        );
    }
}

// ==================================================
// UNMUTE
// ==================================================

async function commandUnmute(msg) {

    const metadata =
        await requireUserAdmin(msg);

    if (!metadata) return;

    const botAdmin =
        await requireBotAdmin(msg);

    if (!botAdmin) return;

    try {

        await sock.groupSettingUpdate(
            msg.key.remoteJid,
            "not_announcement"
        );

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "🔓 Grup dibuka. Semua anggota dapat mengirim pesan."
            }
        );

    } catch (err) {

        console.error(
            "UNMUTE ERROR:",
            err
        );
    }
}

// ==================================================
// SET NAME
// ==================================================

async function commandSetName(msg, args) {

    const metadata =
        await requireUserAdmin(msg);

    if (!metadata) return;

    const botAdmin =
        await requireBotAdmin(msg);

    if (!botAdmin) return;

    const name =
        args.join(" ").trim();

    if (!name) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "Contoh:\n!setname Nama Grup Baru"
            }
        );

        return;
    }

    try {

        await sock.groupUpdateSubject(
            msg.key.remoteJid,
            name
        );

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "✅ Nama grup berhasil diubah."
            }
        );

    } catch (err) {

        console.error(
            "SETNAME ERROR:",
            err
        );
    }
}

// ==================================================
// SET DESCRIPTION
// ==================================================

async function commandSetDesc(msg, args) {

    const metadata =
        await requireUserAdmin(msg);

    if (!metadata) return;

    const botAdmin =
        await requireBotAdmin(msg);

    if (!botAdmin) return;

    const desc =
        args.join(" ").trim();

    if (!desc) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "Contoh:\n!setdesc Deskripsi grup"
            }
        );

        return;
    }

    try {

        await sock.groupUpdateDescription(
            msg.key.remoteJid,
            desc
        );

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "✅ Deskripsi grup berhasil diubah."
            }
        );

    } catch (err) {

        console.error(
            "SETDESC ERROR:",
            err
        );
    }
}

// ==================================================
// FILE SCANNER
// ==================================================

async function commandScan(msg) {

    const quoted =
        getQuoted(msg);

    if (!quoted) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "❌ Reply file yang ingin diperiksa dengan !scan."
            }
        );

        return;
    }

    const media =
        quoted.message?.documentMessage ||
        quoted.message?.imageMessage ||
        quoted.message?.videoMessage ||
        quoted.message?.audioMessage;

    if (!media) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "❌ Pesan yang direply bukan file/media."
            }
        );

        return;
    }

    const filename =
        media.fileName ||
        "file";

    const safeName =
        path.basename(filename)
            .replace(/[^\w.\-]/g, "_");

    const outputFile =
        path.join(
            SCAN_DIR,
            `${Date.now()}_${safeName}`
        );

    try {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    `🔍 FWHZZ Scanner\n\nFile: ${filename}\nStatus: sedang diperiksa...`
            }
        );

        const buffer =
            await downloadMediaMessage(
                quoted,
                "buffer",
                {},
                {
                    logger: P({
                        level: "silent"
                    })
                }
            );

        if (!Buffer.isBuffer(buffer)) {
            throw new Error(
                "File gagal diunduh."
            );
        }

        if (
            buffer.length >
            50 * 1024 * 1024
        ) {
            throw new Error(
                "Ukuran file maksimal 50 MB."
            );
        }

        fs.writeFileSync(
            outputFile,
            buffer
        );

        execFile(
            "clamscan",
            [
                "--no-summary",
                outputFile
            ],
            async (error, stdout, stderr) => {

                const result =
                    `${stdout || ""}\n${stderr || ""}`.trim();

                try {

                    if (
                        result.includes("FOUND")
                    ) {

                        await sock.sendMessage(
                            msg.key.remoteJid,
                            {
                                text:
                                    `🚨 HASIL SCAN\n\nFile: ${filename}\nStatus: TERDETEKSI\n\nClamAV menemukan ancaman yang dikenali.`
                            }
                        );

                    } else if (
                        !error ||
                        error.code === 1
                    ) {

                        await sock.sendMessage(
                            msg.key.remoteJid,
                            {
                                text:
                                    `✅ HASIL SCAN\n\nFile: ${filename}\nStatus: TIDAK TERDETEKSI\n\nClamAV tidak menemukan ancaman yang dikenali.`
                            }
                        );

                    } else {

                        await sock.sendMessage(
                            msg.key.remoteJid,
                            {
                                text:
                                    `⚠️ SCAN GAGAL\n\n${result || error.message}`
                            }
                        );
                    }

                } catch (sendError) {

                    console.error(
                        "SCAN SEND ERROR:",
                        sendError
                    );

                } finally {

                    try {

                        if (
                            fs.existsSync(
                                outputFile
                            )
                        ) {
                            fs.unlinkSync(
                                outputFile
                            );
                        }

                    } catch {}
                }
            }
        );

    } catch (err) {

        console.error(
            "SCAN ERROR:",
            err
        );

        try {

            if (
                fs.existsSync(
                    outputFile
                )
            ) {
                fs.unlinkSync(
                    outputFile
                );
            }

        } catch {}

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    `❌ Scanner gagal:\n${err.message}`
            }
        );
    }
}

// ==================================================


// ==================================================
// FWHZZ_AI_PATCH_V2
// ==================================================

const FWHZZ_AI_MODEL =
    process.env.FWHZZ_AI_MODEL || "gpt-5.6-luna";

let fwhzzOpenAI = null;

function getFwhzzOpenAI() {

    if (!process.env.OPENAI_API_KEY) {
        return null;
    }

    if (!fwhzzOpenAI) {
        fwhzzOpenAI = new OpenAI({
            apiKey:
                process.env.OPENAI_API_KEY
        });
    }

    return fwhzzOpenAI;
}





// ==================================================
// FWHZZ GEMINI AI
// ==================================================

async function commandAI(msg, prompt) {

    const question =
        String(prompt || "").trim();

    if (!question) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "🤖 FWHZZ AI\\n\\nGunakan:\\n!ai <pertanyaan>"
            },
            {
                quoted: msg
            }
        );

        return;
    }

    const apiKey =
        process.env.GEMINI_API_KEY;

    if (!apiKey) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "❌ GEMINI_API_KEY belum diatur di Termux."
            },
            {
                quoted: msg
            }
        );

        return;
    }

    try {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "🤖 FWHZZ AI\\n\\n⏳ Sedang berpikir..."
            },
            {
                quoted: msg
            }
        );

        const response =
            await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" +
                encodeURIComponent(apiKey),
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [
                                {
                                    text:
                                        "Kamu adalah FWHZZ AI, asisten AI untuk grup WhatsApp. Jawab dalam bahasa yang digunakan pengguna. Berikan jawaban yang jelas, membantu, dan tidak terlalu panjang kecuali diminta."
                                }
                            ]
                        },

                        contents: [
                            {
                                role: "user",

                                parts: [
                                    {
                                        text:
                                            question
                                    }
                                ]
                            }
                        ],

                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1024
                        }
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            const detail =
                data?.error?.message ||
                "Gemini API error.";

            throw new Error(detail);
        }

        const answer =
            data
                ?.candidates?.[0]
                ?.content
                ?.parts
                ?.map(part => part.text || "")
                ?.join("")
                ?.trim();

        if (!answer) {
            throw new Error(
                "Gemini tidak mengembalikan jawaban."
            );
        }

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "🤖 FWHZZ AI\\n\\n" +
                    answer
            },
            {
                quoted: msg
            }
        );

    } catch (err) {

        console.error(
            "GEMINI AI ERROR:",
            err
        );

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
                    "❌ FWHZZ AI gagal.\\n\\n" +
                    (err.message || "Terjadi kesalahan.")
            },
            {
                quoted: msg
            }
        );
    }
}

// ==================================================
// END FWHZZ GEMINI AI
// ==================================================


// COMMAND HANDLER
// ==================================================

async function handleMessage(msg) {

    if (!msg?.message) {
        return;
    }


    const text =
        getText(msg);
    
    // FWHZZ OWNER ONLY
    // Command dari non-owner diabaikan tanpa respons.
    if (text.startsWith("!") && !fwhzzIsOwner(msg)) {
        return;
    }


    if (!text) {
        return;
    }

    const parsed =
        parseCommand(text);

    if (!parsed) {
        return;
    }

    const {
        command,
        args
    } = parsed;

    console.log(
        `[COMMAND] ${command}`,
        args
    );
const sender =
    msg.key?.participant ||
    msg.key?.remoteJid ||
    "";



// ==================================================
// PUBLIC !AI
// Semua member grup dapat menggunakan command ini.
// ==================================================

if (command === "!ai") {

    return commandAI(
        msg,
        args.join(" ")
    );
}

if (!isOwner(sender)) {
    return sock.sendMessage(
        msg.key.remoteJid,
        {
            text: "❌ Kamu tidak memiliki izin menggunakan command FWHZZ BOT."
        },
        {
            quoted: msg
        }
    );
}
    switch (command) {

        case "!help":
            return commandHelp(msg);

        case "!status":
            return commandStatus(msg);

        case "!id":
            return commandId(msg);

        case "!owner":
            return commandOwner(msg);

        case "!add":
            return commandAdd(
                msg,
                args
            );

        case "!kick":
            return commandKick(msg);

        case "!promote":
            return commandPromote(msg);

        case "!demote":
            return commandDemote(msg);

        case "!del":
            return commandDelete(msg);

        case "!tagall":
            return commandTagAll(
                msg,
                args,
                false
            );

        case "!hidetag":
            return commandTagAll(
                msg,
                args,
                true
            );

        case "!groupinfo":
            return commandGroupInfo(msg);

        case "!link":
            return commandLink(msg);

        case "!revoke":
            return commandRevoke(msg);

        case "!mute":
            return commandMute(msg);

        case "!unmute":
            return commandUnmute(msg);

        case "!setname":
            return commandSetName(
                msg,
                args
            );

        case "!setdesc":
            return commandSetDesc(
                msg,
                args
            );

        case "!scan":
            return commandScan(msg);

        default:
            return;
    }
}

// ==================================================
// PAIRING
// ==================================================

async function askPhoneNumber() {

    const rl =
        readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

    return new Promise(resolve => {

        rl.question(
            "Nomor WhatsApp: ",
            answer => {

                rl.close();

                resolve(
                    normalizeNumber(
                        answer
                    )
                );
            }
        );
    });
}

// ==================================================
// START BOT
// ==================================================

async function startBot() {

    if (starting) {
        return;
    }

    starting = true;

    try {

        const {
            state,
            saveCreds
        } =
            await useMultiFileAuthState(
                SESSION_DIR
            );

        let version;

        try {

            const latest =
                await fetchLatestBaileysVersion();

            version =
                latest.version;

        } catch (err) {

            console.log(
                "Tidak dapat mengambil versi terbaru Baileys."
            );
        }

        sock =
            makeWASocket({
                auth: state,

                ...(version
                    ? { version }
                    : {}),

                logger:
                    P({
                        level: "silent"
                    }),

                printQRInTerminal:
                    false,

                browser: [
                    BOT_NAME,
                    "Chrome",
                    "1.0.0"
                ],

                markOnlineOnConnect:
                    false,

                syncFullHistory:
                    false
            });

        sock.ev.on(
            "creds.update",
            saveCreds
        );

        sock.ev.on(
            "messages.upsert",
            async ({ messages }) => {

                for (
                    const msg
                    of messages
                ) {

                    try {

                        await handleMessage(
                            msg
                        );

                    } catch (err) {

                        console.error(
                            "MESSAGE ERROR:",
                            err
                        );
                    }
                }
            }
        );

        sock.ev.on(
            "connection.update",
            async ({
                connection,
                lastDisconnect
            }) => {

                if (
                    connection ===
                    "connecting"
                ) {

                    console.log(
                        "Menghubungkan ke WhatsApp..."
                    );
                }

                if (
                    connection ===
                    "open"
                ) {

                    starting =
                        false;

                    console.log(`
========================================
          FWHZZ WHATSAPP BOT
========================================
Status       : ONLINE
Bot ID       : ${sock.user?.id || "-"}
Bot LID      : ${sock.user?.lid || "-"}
Owner        : ${config.owner || "BELUM DIATUR"}
Target Group : ${config.targetGroup || "SEMUA GRUP"}
Reconnect    : 2 detik
Scanner      : ClamAV
========================================
`);
                }

                if (
                    connection ===
                    "close"
                ) {

                    starting =
                        false;

                    const code =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode;

                    console.log(
                        "Koneksi WhatsApp terputus."
                    );

                    console.log(
                        "Disconnect code:",
                        code
                    );

                    if (
                        code ===
                        DisconnectReason.loggedOut
                    ) {

                        console.log(
                            "Session logout."
                        );

                        return;
                    }

                    if (
                        !reconnectTimer
                    ) {

                        console.log(
                            "Reconnect dalam 2 detik..."
                        );

                        reconnectTimer =
                            setTimeout(
                                () => {

                                    reconnectTimer =
                                        null;

                                    startBot();

                                },
                                RECONNECT_DELAY
                            );
                    }
                }
            }
        );

        // ==========================================
        // PAIRING CODE
        // ==========================================

        if (
            !state.creds.registered
        ) {

            const number =
                await askPhoneNumber();

            if (!number) {

                console.log(
                    "Nomor tidak valid."
                );

                process.exit(1);
            }

            console.log(
                "Meminta pairing code..."
            );

            const code =
                await sock.requestPairingCode(
                    number
                );

            console.log(`
========================================
          FWHZZ PAIRING CODE
========================================
CODE : ${code}
========================================
Di WhatsApp:
Setelan
→ Perangkat tertaut
→ Tautkan perangkat
→ Tautkan dengan nomor telepon
========================================
`);
        }

    } catch (err) {

        starting =
            false;

        console.error(
            "START ERROR:",
            err
        );

        if (
            !reconnectTimer
        ) {

            reconnectTimer =
                setTimeout(
                    () => {

                        reconnectTimer =
                            null;

                        startBot();

                    },
                    RECONNECT_DELAY
                );
        }
    }
}

// ==================================================
// START
// ==================================================

console.log(`
========================================
             FWHZZ BOT
========================================
Starting...
========================================
`);

startBot();
