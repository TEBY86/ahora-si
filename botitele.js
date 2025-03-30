'use strict';

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Configuración - REEMPLAZA ESTOS VALORES
const CONFIG = {
  TELEGRAM_TOKEN: '7811444781:AAHDRHGOdqZcx_ffD4iaZE6aNp1m4qaq5_k',
  GAS_URL: 'https://script.google.com/macros/s/AKfycbwlZUBOSU_dt-LAbftfMUxmgnYSxWf4Vghibsn8S2J_Ov8SkbF8DHO1FrqRIMl95qH0rg/exec'
};

// Inicialización del bot
const bot = new TelegramBot(CONFIG.TELEGRAM_TOKEN, {
  polling: true,
  onlyFirstMatch: true
});

// Mapeo mejorado de campos
const FIELD_MAP = {
  empresa: { synonyms: ['empresa', 'compania', 'proveedor'], required: true },
  nombre: { synonyms: ['nombre', 'cliente', 'name'], required: true },
  rut: { synonyms: ['rut', 'identificacion', 'dni'], required: true, format: formatRut },
  telefono: { synonyms: ['telefono', 'fono', 'celular', 'contacto'] },
  correo: { synonyms: ['correo', 'email', 'mail'], format: v => v.toLowerCase() },
  direccion: { synonyms: ['direccion', 'domicilio', 'address'] },
  comuna: { synonyms: ['comuna', 'ciudad'] },
  region: { synonyms: ['region', 'provincia'] },
  plan: { synonyms: ['plan', 'servicio'] },
  deco: { synonyms: ['deco', 'equipo', 'adicional'] },
  obs: { synonyms: ['obs', 'observacion', 'nota'] },
  ejecutivo: { synonyms: ['ejecutivo', 'vendedor', 'asesor'] }
};

// Función para formatear RUT
function formatRut(rut) {
  if (!rut) return '';
  const cleanRut = rut.toString()
    .toUpperCase()
    .replace(/[^0-9K]/g, '')
    .replace(/^0+/, '');
  if (cleanRut.length < 2) return rut;
  return `${cleanRut.slice(0, -1)}-${cleanRut.slice(-1)}`;
}

// Procesador de mensajes
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    if (!msg.text || !msg.text.toLowerCase().includes('venta')) {
      return; // Ignorar mensajes sin "venta"
    }

    const ventaData = parseMessage(msg.text);
    validateData(ventaData);

    const response = await axios.post(CONFIG.GAS_URL, ventaData);
    await bot.sendMessage(chatId, response.data.message || '✅ Registro exitoso');

  } catch (error) {
    console.error('Error en mensaje:', error);
    const errorMsg = error.response?.data?.message || 
                    error.message || 
                    'Error al procesar la solicitud';
    await bot.sendMessage(chatId, `⚠️ ${errorMsg}`);
  }
});

// Analizador de mensajes mejorado
function parseMessage(text) {
  const result = {};
  const lines = text.split('\n');

  // Detección automática de empresa
  const lowerText = text.toLowerCase();
  if (lowerText.includes('entel')) result.empresa = 'ENTEL';
  else if (lowerText.includes('vtr')) result.empresa = 'VTR';
  else if (lowerText.includes('wom')) result.empresa = 'WOM';

  // Procesar líneas con formato "clave: valor"
  lines.forEach(line => {
    const match = line.match(/^\s*[•\-*]*\s*([^:]+):\s*(.+)/i);
    if (!match) return;

    const rawKey = match[1].trim().toLowerCase();
    const rawValue = match[2].trim();

    for (const [field, config] of Object.entries(FIELD_MAP)) {
      if (config.synonyms.some(syn => rawKey.includes(syn))) {
        result[field] = config.format ? config.format(rawValue) : rawValue.toUpperCase();
        break;
      }
    }
  });

  return result;
}

// Validación de datos
function validateData(data) {
  const missingFields = [];
  
  for (const [field, config] of Object.entries(FIELD_MAP)) {
    if (config.required && !data[field]) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new Error(`Faltan campos obligatorios: ${missingFields.join(', ')}`);
  }
}

console.log('🤖✅ Bot iniciado correctamente. Esperando mensajes...');
