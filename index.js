import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import { processarComando } from './comandos.js';

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();
  console.log(`⚡ Usando versão do WhatsApp: ${version.join('.')}`);

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;
    if (qr) {
      console.log('⚡ ESCANEIE O QR CODE:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      console.log('❌ Conexão encerrada. Reconectar?', update.lastDisconnect?.error);
      if (update.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        startSock();
      }
    } else if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const fromMe = msg.key.fromMe;
    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');

    if (isGroup && fromMe) {
      console.log('⚠️ Mensagem enviada por mim mesmo em grupo. Ignorando para evitar loop.');
      return;
    }

    const texto =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption;

    if (!texto) {
      console.log('⚠️ Mensagem sem texto legível. Ignorando.');
      return;
    }

    console.log(`📩 Mensagem recebida de ${jid}`);
    console.log(`📌 Conteúdo: ${texto}`);
    console.log(`👥 É grupo? ${isGroup}`);
    console.log(`✉️ De mim? ${fromMe}`);

    if (!isGroup) {
      await processarComando(sock, jid, texto.trim(), isGroup);
    } else {
      console.log(`⚠️ Ignorando mensagens em grupo para evitar spam.`);
    }
  });
}

startSock();
