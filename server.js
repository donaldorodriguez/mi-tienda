/**
 * BOT WHATSAPP IA — MEGA PACK ICFES 2026 🇨🇴
 * Claude maneja SOLO objeciones. El código maneja TODO lo demás.
 */

const express = require('express');
const axios   = require('axios');
const app     = express();
app.use(express.json({ limit: '10mb' }));

// ══════════════════════════════════════════════
// ⚙️  CONFIGURACIÓN
// ══════════════════════════════════════════════
const CONFIG = {
  ANTHROPIC_API_KEY   : process.env.ANTHROPIC_API_KEY,
  EVOLUTION_URL       : 'https://evolution-api-production-905e.up.railway.app',
  EVOLUTION_API_KEY   : 'db25dfe6adad17eeea9555433007cccad3372320ae2f9051ba8a4791694aa3db',
  EVOLUTION_INSTANCE  : 'Mi-tienda',
  NEQUI               : '3003843676',        // ← actualiza si cambia
  BREB                : '3003843676',        // ← actualiza si cambia
  NOMBRE_PARCIAL      : 'And*** Her***',
  NOMBRE_REAL_1       : 'Andrea Hernandez',
  NOMBRE_REAL_2       : 'Andrea Hernandez Salcedo',
  LINK_PRODUCTO       : 'https://drive.google.com/drive/u/0/folders/1ITXM4pV90akRQYak80-KmdkZ8BsvSsnE', // ← actualiza con el link del pack
  PRECIO              : 15000,
  PRECIO_ANTES        : 47000,
  ADMIN_KEY           : process.env.ADMIN_KEY || 'admin-estimulacion-2024',
  PORT                : process.env.PORT || 3000,
};

// ══════════════════════════════════════════════
// 💬 MENSAJES FIJOS — el código los envía, Claude nunca los toca
// ══════════════════════════════════════════════
const MSG_BIENVENIDA_1 = `¡Hola! 👋🏻 Qué alegría saludarte, gracias por escribirnos ✨

El *Mega Pack de Estimulación Temprana* está pensado para acompañar el desarrollo de tu peque con actividades prácticas, divertidas y sin pantallas, desde los *0 hasta los 8 añitos.*

🧠 Más de 1.200 actividades imprimibles
📚 Organizadas por edad y habilidad: lenguaje, motricidad, atención, memoria, lectoescritura, pensamiento lógico, matemáticas, inglés y más
📥 Material 100% digital — Descarga inmediata

Precio anterior: $47.000 ❌
*HOY solo: $15.000* ✅

➡️ Puedes comenzar con tu hijo hoy mismo, a su ritmo y sin complicaciones.`;

const MSG_BIENVENIDA_2 = `🎁 *Y al adquirirlo HOY recibes estos bonos totalmente GRATIS:*

• Colección completa del método Coquito
• Actividades del método Coquito para iniciar lectura y escritura
• Material para introducir inglés jugando
• Juegos de pensamiento lógico y razonamiento
• Actividades sensoriales + experimentos caseros
• Guía para padres paso a paso
• *Actualizaciones gratuitas de por vida* (sin costos adicionales)

👉 Todo pensado para que disfrutes momentos reales de aprendizaje, conexión y avances con tu peque.

🛒 *¿Con qué prefieres pagar?*
👇 Responde: *Nequi* o *Bre-B*`;

const MSG_BIENVENIDA = MSG_BIENVENIDA_1; // mantener compatibilidad

const MSG_DATOS_PAGO = `💳 *Datos para tu pago de $15.000 COP:*

*Nequi 📱*
${CONFIG.NEQUI}

*Llave Bre-B 🔑*
${CONFIG.BREB}

A nombre de: *${CONFIG.NOMBRE_PARCIAL}*

Cuando hagas el pago, mándame la *captura de pantalla* del comprobante y te envío el pack al instante 📥

⏰ Recuerda: este precio es *solo por hoy*`;

const MSG_PEDIR_CAPTURA = `📸 Listo, mándame la *captura de pantalla* del comprobante y lo verifico al instante.`;

const MSG_VERIFICANDO = `🔍 Verificando tu pago...`;

// ══════════════════════════════════════════════
// 🗄️  SESIONES
// ══════════════════════════════════════════════
const sesiones = new Map();
const transaccionesUsadas = new Set();

setInterval(() => {
  const limite = Date.now() - 86_400_000;
  for (const [tel, s] of sesiones) {
    if (s.ultimaActividad < limite) sesiones.delete(tel);
  }
}, 3_600_000);

function getSesion(telefono) {
  if (!sesiones.has(telefono)) {
    sesiones.set(telefono, {
      historial       : [],
      estado          : 'nuevo', // nuevo | vendiendo | esperando_pago | verificando
      ultimaActividad : Date.now(),
    });
  }
  const s = sesiones.get(telefono);
  s.ultimaActividad = Date.now();
  return s;
}

// ══════════════════════════════════════════════
// 📤 WHATSAPP
// ══════════════════════════════════════════════
const EVO_HEADERS = {
  'apikey'      : CONFIG.EVOLUTION_API_KEY,
  'Content-Type': 'application/json',
};

async function enviar(telefono, texto) {
  try {
    await axios.post(
      `${CONFIG.EVOLUTION_URL}/message/sendText/${CONFIG.EVOLUTION_INSTANCE}`,
      { number: telefono, text: texto },
      { headers: EVO_HEADERS }
    );
  } catch (e) {
    console.error(`❌ enviar:`, e.response?.data || e.message);
  }
}

async function entregar(telefono) {
  await enviar(telefono,
    `🎉 *¡Pago confirmado!* Aquí está tu material:\n\n` +
    `🔗 ${CONFIG.LINK_PRODUCTO}\n\n` +
    `Descarga todo y guárdalo bien. ¡Mucho éxito en el ICFES! 💪🏆`
  );
}

const esperar = ms => new Promise(r => setTimeout(r, ms));

// ══════════════════════════════════════════════
// 🔍 DETECTORES DE INTENCIÓN (sin Claude)
// ══════════════════════════════════════════════
function esProductoEstimulacion(texto) {
  const t = texto.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // quitar tildes
  return [
    'estimulacion','estimulación','temprana','estimulacion temprana',
    'mega pack','megapack','pack estimul','actividades imprimibles',
    'coquito','motricidad','lectoescritura','estimula'
  ].some(p => t.includes(p));
}

function quiereComprar(texto) {
  const t = texto.toLowerCase();
  return [
    'nequi','bre-b','breb','bre b',
    'quiero','lo quiero','dale','listo','cómo pago','como pago',
    'cómo compro','como compro','me interesa','lo compro',
    'por nequi','con nequi','por bre','acepto','ok','okey','okay',
    'si','sí','claro','vamos','cómpralo','compralo','lo quiero'
  ].some(p => t.includes(p));
}

function yaPago(texto) {
  const t = texto.toLowerCase();
  return [
    'ya pagué','ya pague','hice el pago','ya transferí','ya transferi',
    'te mandé','te mande','ya lo hice','listo pagué','listo pague',
    'ya te mandé','ya te mande','ya pague','realicé el pago','realize'
  ].some(p => t.includes(p));
}

// ══════════════════════════════════════════════
// 🤖 CLAUDE — SOLO para manejar objeciones/dudas
// ══════════════════════════════════════════════
async function claudeObjeciones(historial) {
  const system = `Eres el mejor cerrador de ventas de Colombia. Vendes el Mega Pack ICFES 2026 a $15.000 COP.

El cliente ya vio el producto completo. Tu trabajo es resolver su duda en UNA sola frase y cerrar.

REGLAS:
- Máximo 1 frase de respuesta
- Usa gatillos mentales: escasez, urgencia, prueba social, miedo a perder
- Ejemplos de cierres:
  * "Ya van más de 200 estudiantes preparados, ¿vas a ser el siguiente? 🎯"
  * "Cada día sin prepararte es un punto menos. Por $15.000 no vale la pena arriesgarlo 💪"
  * "Este precio es solo por hoy, mañana vuelve a $79.000 ⏰"
  * "Tienes el material en 2 minutos si pagas ahora 🚀"
- NUNCA menciones números de cuenta ni datos de pago
- NUNCA preguntes información personal
- NUNCA hagas preguntas — solo afirmaciones que cierren`;

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model      : 'claude-haiku-4-5-20251001',
      max_tokens : 100,
      system,
      messages   : historial.slice(-6),
    },
    {
      headers: {
        'x-api-key'         : CONFIG.ANTHROPIC_API_KEY,
        'anthropic-version' : '2023-06-01',
        'Content-Type'      : 'application/json',
      },
    }
  );
  return response.data.content[0].text;
}

// ══════════════════════════════════════════════
// 👁️  CLAUDE — verificar captura
// ══════════════════════════════════════════════
async function claudeVerificarCaptura(imagenBase64, mediaType) {
  const ahora = new Date();
  const col = new Date(ahora.getTime() + ahora.getTimezoneOffset() * 60000 + (-5 * 3600000));
  const hoy = col.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const ayer = new Date(col); ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  const system = `Verificador de pagos para Colombia.
FECHA HOY: ${hoy} | AYER: ${ayerStr}
PAGO VÁLIDO SI: monto=$15.000 COP, receptor="Andrea Hernandez" o "Andrea Hernandez Salcedo", fecha=hoy o ayer, captura real.
Responde SOLO JSON sin texto extra:
{"valido":true,"monto_detectado":15000,"fecha_detectada":"texto","numero_transaccion":"ref o null","banco_detectado":"banco o null","nombre_pagador":"nombre o null","razon_rechazo":null}`;

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model      : 'claude-sonnet-4-20250514',
      max_tokens : 200,
      system,
      messages   : [{
        role    : 'user',
        content : [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imagenBase64 } },
          { type: 'text',  text: 'Analiza.' },
        ],
      }],
    },
    {
      headers: {
        'x-api-key'         : CONFIG.ANTHROPIC_API_KEY,
        'anthropic-version' : '2023-06-01',
        'Content-Type'      : 'application/json',
      },
    }
  );
  return response.data.content[0].text;
}

// ══════════════════════════════════════════════
// 💬 PROCESAR MENSAJE DE TEXTO
// ══════════════════════════════════════════════
async function procesarTexto(telefono, texto) {
  const sesion = getSesion(telefono);

  // ── 1. PRIMER MENSAJE → bienvenida fija ──
  if (sesion.estado === 'nuevo') {
    sesion.estado = 'vendiendo';
    sesion.historial.push({ role: 'user', content: texto });
    sesion.historial.push({ role: 'assistant', content: MSG_BIENVENIDA_1 + '\n\n' + MSG_BIENVENIDA_2 });
    await enviar(telefono, MSG_BIENVENIDA_1);
    await esperar(1500);
    await enviar(telefono, MSG_BIENVENIDA_2);
    return;
  }

  // ── 2. YA PAGÓ → pedir captura ──
  if (yaPago(texto)) {
    sesion.estado = 'esperando_pago';
    await enviar(telefono, MSG_PEDIR_CAPTURA);
    return;
  }

  // ── 3. QUIERE COMPRAR → datos de pago fijos ──
  if (quiereComprar(texto)) {
    sesion.estado = 'esperando_pago';
    await enviar(telefono, MSG_DATOS_PAGO);
    return;
  }

  // ── 4. ESTÁ ESPERANDO PAGO y escribe algo → recordarle ──
  if (sesion.estado === 'esperando_pago') {
    await enviar(telefono, `⏰ Recuerda hacer el pago y mandarme la captura para enviarte el material al instante 📥`);
    return;
  }

  // ── 5. DUDA U OBJECIÓN → Claude cierra en 1 frase ──
  sesion.historial.push({ role: 'user', content: texto });
  let respuesta;
  try {
    respuesta = await claudeObjeciones(sesion.historial);
  } catch (e) {
    console.error('❌ Claude:', e.message);
    respuesta = `Por $15.000 tienes todo lo que necesitas para arrasar en el ICFES 💪 ¿Pagamos por Nequi o Bre-B?`;
  }
  sesion.historial.push({ role: 'assistant', content: respuesta });
  await enviar(telefono, respuesta);
}

// ══════════════════════════════════════════════
// 🧾 PROCESAR CAPTURA
// ══════════════════════════════════════════════
async function procesarCaptura(telefono, imagenBase64, mediaType) {
  const sesion = getSesion(telefono);
  await enviar(telefono, MSG_VERIFICANDO);

  let resultado;
  try {
    const raw = await claudeVerificarCaptura(imagenBase64, mediaType);
    const match = raw.match(/\{[\s\S]*\}/);
    resultado = match ? JSON.parse(match[0]) : null;
  } catch (e) {
    console.error('❌ Vision:', e.message);
    await enviar(telefono, `No pude leer la imagen 😅 Mándala de nuevo con buena calidad.`);
    sesion.estado = 'esperando_pago';
    return;
  }

  if (!resultado) {
    await enviar(telefono, `No pude leer el comprobante. ¿Lo mandas de nuevo? 📸`);
    return;
  }

  console.log(`🔍 ${telefono}:`, JSON.stringify(resultado));

  if (resultado.valido) {
    const txn = resultado.numero_transaccion;
    if (txn && transaccionesUsadas.has(txn)) {
      await enviar(telefono, `⚠️ Este comprobante ya fue usado. Si es un error escríbenos.`);
      return;
    }
    if (txn) transaccionesUsadas.add(txn);

    await enviar(telefono, `✅ *¡Pago confirmado!* Recibimos *$${Number(resultado.monto_detectado).toLocaleString('es-CO')} COP* 🎉`);
    await esperar(800);
    await entregar(telefono);
    sesion.estado = 'vendiendo';
    console.log(`💰 VENTA | ${telefono} | Txn: ${txn}`);

  } else {
    const razon = (resultado.razon_rechazo || '').toLowerCase();
    let msg;
    if (razon.includes('monto') || razon.includes('valor')) {
      msg = `El monto no coincide ❌ El valor exacto es *$15.000 COP*. Verifica y manda la captura de nuevo.`;
    } else if (razon.includes('nombre') || razon.includes('titular')) {
      msg = `El destinatario no coincide ❌ Verifica que estés pagando a la cuenta correcta.`;
    } else if (razon.includes('edit') || razon.includes('manipul')) {
      msg = `⚠️ La imagen no parece un comprobante original. Mándala directo desde tu app bancaria.`;
    } else if (razon.includes('fecha')) {
      msg = `Comprobante muy antiguo 📅 Solo acepto pagos de hoy o ayer.`;
    } else {
      msg = `No pude confirmar el pago 😅 ${resultado.razon_rechazo || ''} Manda la captura de nuevo.`;
    }
    await enviar(telefono, msg);
    sesion.estado = 'esperando_pago';
  }
}

// ══════════════════════════════════════════════
// 📥 WEBHOOK
// ══════════════════════════════════════════════
app.post('/webhook/evolution', async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;

    // LOG COMPLETO para diagnóstico
    console.log('📨 WEBHOOK:', JSON.stringify({
      event   : body.event,
      fromMe  : body.data?.key?.fromMe,
      jid     : body.data?.key?.remoteJid,
      msgType : body.data?.message ? Object.keys(body.data.message)[0] : null,
      texto   : body.data?.message?.conversation || body.data?.message?.extendedTextMessage?.text || null,
    }));

    if (!['messages.upsert', 'messages.update'].includes(body.event)) return;
    const data = body.data;
    if (!data || data.key?.fromMe) return;
    const remoteJid = data.key?.remoteJid || '';
    if (remoteJid.includes('@g.us')) return;
    const telefono = remoteJid.replace('@s.whatsapp.net', '');
    if (!telefono) return;
    const mensaje = data.message;
    if (!mensaje) return;

    // Extraer texto de TODOS los tipos de mensaje posibles
    // incluyendo mensajes de anuncios Click-to-WhatsApp
    const texto =
      mensaje.conversation ||
      mensaje.extendedTextMessage?.text ||
      mensaje.buttonsResponseMessage?.selectedDisplayText ||
      mensaje.templateButtonReplyMessage?.selectedDisplayText ||
      mensaje.listResponseMessage?.title ||
      mensaje.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
      // Click-to-WhatsApp trae el mensaje aquí
      mensaje.ephemeralMessage?.message?.conversation ||
      mensaje.ephemeralMessage?.message?.extendedTextMessage?.text ||
      mensaje.viewOnceMessage?.message?.conversation ||
      // Si viene cualquier tipo de mensaje pero sin texto, tratar como "Hola"
      (Object.keys(mensaje).length > 0 ? 'Hola' : null);

    if (texto?.trim()) {
      console.log(`📩 ${telefono}: ${texto.trim()}`);
      await procesarTexto(telefono, texto.trim());
      return;
    }

    if (mensaje.imageMessage) {
      console.log(`📸 ${telefono}`);
      try {
        const r = await axios.post(
          `${CONFIG.EVOLUTION_URL}/chat/getBase64FromMediaMessage/${CONFIG.EVOLUTION_INSTANCE}`,
          { message: { key: data.key, message: mensaje } },
          { headers: EVO_HEADERS }
        );
        const base64 = r.data?.base64;
        const mime = mensaje.imageMessage.mimetype || 'image/jpeg';
        if (base64) {
          await procesarCaptura(telefono, base64, mime);
        } else {
          await enviar(telefono, `No pude leer tu imagen 😅 Mándala de nuevo.`);
        }
      } catch (e) {
        console.error('❌ Imagen:', e.message);
        await enviar(telefono, `Error al recibir la imagen. Inténtalo de nuevo 📸`);
      }
      return;
    }

    if (mensaje.audioMessage || mensaje.videoMessage || mensaje.stickerMessage) {
      await enviar(telefono, `Solo puedo leer texto e imágenes 😊`);
    }
  } catch (e) {
    console.error('❌ Webhook:', e.message);
  }
});

// ══════════════════════════════════════════════
// 🔧 ADMIN
// ══════════════════════════════════════════════
app.get('/health', (_req, res) => {
  res.json({ status: '✅ Bot activo', sesiones: sesiones.size, ventas: transaccionesUsadas.size });
});

app.post('/admin/entregar', async (req, res) => {
  const { telefono, adminKey } = req.body;
  if (adminKey !== CONFIG.ADMIN_KEY) return res.status(401).json({ error: 'No autorizado' });
  await entregar(telefono);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════
// 🚀 ARRANCAR
// ══════════════════════════════════════════════
app.listen(CONFIG.PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║  🤖 BOT ESTIMULACIÓN TEMPRANA — ACTIVO   ║
║  Nequi/Bre-B : ${CONFIG.NEQUI}          ║
║  Titular     : ${CONFIG.NOMBRE_PARCIAL}         ║
╚══════════════════════════════════════════╝
  `);
});
