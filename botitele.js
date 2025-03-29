const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// ⬅️ Reemplaza por tu token de BotFather
const TELEGRAM_TOKEN = '7811444781:AAHDRHGOdqZcx_ffD4iaZE6aNp1m4qaq5_k';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || !text.toLowerCase().includes("venta")) return;

  const lines = text.split('\n');
  const data = {};

  // Función para normalizar claves
  const normalizeKey = (key) => {
    const k = key.toLowerCase();
    if (k.includes("empresa")) return "empresa";
    if (k.includes("nombre")) return "nombre";
    if (k.includes("rut")) return "rut";
    if (k.includes("serie")) return "serie";
    if (k.includes("tel") || k.includes("fono") || k.includes("contacto") || k.includes("cel")) return "telefono";
    if (k.includes("correo") || k.includes("mail")) return "correo";
    if (k.includes("dire")) return "direccion";
    if (k.includes("comuna")) return "comuna";
    if (k.includes("región") || k.includes("region")) return "region";
    if (k.includes("plan") || k.includes("servicio") || k.includes("contrata")) return "plan";
    if (k.includes("deco") || k.includes("adicional")) return "deco";
    if (k.includes("obs") || k.includes("observacion") || k.includes("observación") || k.includes("nota")) return "obs";
    if (k.includes("ejecutiv")) return "ejecutivo";
    return null;
  };

  for (const line of lines) {
    const [_, rawKey, rawValue] = line.match(/^\s*[\*\.\-]*\s*([^:]+)\s*:\s*(.+)$/i) || [];
    const key = normalizeKey(rawKey || '');
    if (key && rawValue) {
      data[key] = rawValue.trim();
    }
  }

  // Detectar empresa si viene mencionada sin etiqueta
  if (!data.empresa) {
    const lower = text.toLowerCase();
    if (lower.includes("entel")) data.empresa = "ENTEL";
    else if (lower.includes("wom")) data.empresa = "WOM";
    else if (lower.includes("vtr")) data.empresa = "VTR";
    else data.empresa = "";
  }

  // Estructura final para enviar ordenadamente
  const orderedData = {
    empresa: data.empresa || '',
    nombre: data.nombre || '',
    rut: data.rut || '',
    serie: data.serie || '',
    telefono: data.telefono || '',
    correo: data.correo || '',
    direccion: data.direccion || '',
    comuna: data.comuna || '',
    region: data.region || '',
    plan: data.plan || '',
    deco: data.deco || '',
    obs: data.obs || '',
    ejecutivo: data.ejecutivo || '',
    supervisor: 'Sebastián Leiva'
  };

  try {
    await axios.post('https://script.google.com/macros/s/AKfycbwlZUBOSU_dt-LAbftfMUxmgnYSxWf4Vghibsn8S2J_Ov8SkbF8DHO1FrqRIMl95qH0rg/exec', orderedData); // 👈 pega tu URL real aquí
    bot.sendMessage(chatId, "✅ Venta registrada correctamente.");
  } catch (err) {
    console.error("❌ Error al enviar:", err.message);
    bot.sendMessage(chatId, "⚠️ Error al guardar la venta.");
  }
});
