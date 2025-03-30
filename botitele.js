const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TELEGRAM_TOKEN = 'TU_TOKEN_AQUI';
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || !text.toLowerCase().includes("venta")) return;

  const lines = text.split('\n');
  const data = {};

  const fieldMappings = {
    'empresa': ['empresa', 'compania'],
    'nombre': ['nombre', 'cliente'],
    'rut': ['rut', 'identificacion'],
    'serie': ['serie', 'serial'],
    'telefono': ['telefono', 'fono', 'celular'],
    'correo': ['correo', 'email', 'mail'],
    'direccion': ['direccion', 'domicilio'],
    'comuna': ['comuna', 'ciudad'],
    'region': ['region', 'provincia'],
    'plan': ['plan', 'servicio'],
    'deco': ['deco', 'equipo'],
    'obs': ['obs', 'observacion'],
    'ejecutivo': ['ejecutivo', 'vendedor']
  };

  for (const line of lines) {
    const [_, rawKey, rawValue] = line.match(/^\s*[\*\.\-]*\s*([^:]+)\s*:\s*(.+)$/i) || [];
    if (!rawKey || !rawValue) continue;
    
    const lowerKey = rawKey.toLowerCase().trim();
    let foundKey = null;
    
    for (const [mainKey, variants] of Object.entries(fieldMappings)) {
      if (variants.some(v => lowerKey.includes(v))) {
        foundKey = mainKey;
        break;
      }
    }
    
    if (foundKey) {
      data[foundKey] = rawValue.trim();
    }
  }

  // Detección automática de empresa si no se especificó
  if (!data.empresa) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("entel")) data.empresa = "ENTEL";
    else if (lowerText.includes("vtr")) data.empresa = "VTR";
    else if (lowerText.includes("wom")) data.empresa = "WOM";
  }

  // Estructura final para enviar
  const postData = {
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
    observaciones: data.obs || '',
    ejecutivo: data.ejecutivo || ''
  };

  try {
    const response = await axios.post('URL_DE_TU_APPS_SCRIPT', postData);
    bot.sendMessage(chatId, response.data.message || "✅ Registrado correctamente");
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    bot.sendMessage(chatId, "⚠️ Error al registrar: " + (err.response?.data?.message || err.message));
  }
});
