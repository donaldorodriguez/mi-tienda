/**
 * BOT WHATSAPP IA — MEGA PACK ICFES 2026 🇨🇴
 * Stack: Evolution API + Claude AI + Express
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

  NEQUI_NUMERO        : '3003843676',
  LLAVE_BREB          : '3003843676',
  NOMBRE_TITULAR_REAL : 'Andrea Hernandez',
  NOMBRE_TITULAR_REAL2: 'Andrea Hernandez Salcedo',
  NOMBRE_PARCIAL      : 'And*** Her***',

  NOMBRE_NEGOCIO      : 'Mega Pack ICFES',
  ADMIN_KEY           : process.env.ADMIN_KEY || 'admin-icfes-2024',
  PORT                : process.env.PORT || 3000,
};

// ══════════════════════════════════════════════
// 🖼️  IMÁGENES
// Sube las imágenes a Google Drive como públicas
// y reemplaza los IDs aquí
// ══════════════════════════════════════════════
const IMAGENES = {
  flyer  : 'https://i.imgur.com/5wZnZIr.jpeg',
  muestra: 'https://i.imgur.com/rnuHfuF.jpeg',
};

// ══════════════════════════════════════════════
// 📦 PRODUCTO
// ══════════════════════════════════════════════
const PRODUCTO = {
  id          : 'mega-pack-icfes',
  nombre      : 'Mega Pack ICFES 2026',
  precio      : 15000,
  link_entrega: 'https://drive.google.com/drive/folders/187flxW4FjDOnDirhTzjaVyB0yUf7L4w4?usp=sharing',
};

// ══════════════════════════════════════════════
// 💬 MENSAJES FIJOS
// ══════════════════════════════════════════════

// Mensaje 1 — texto que acompaña la imagen del flyer
const SALUDO_MSG1 = `👋 ¡Hola! Qué gusto saludarte 😊

Te cuento sobre el *Mega Pack ICFES 2026* — el material más completo para prepararte con estrategia y sacar el puntaje que mereces 🎯

📦 *¿Qué incluye?*
🔹 Guía de inicio: cómo sacarle el máximo desde el día 1
🔹 Metodología paso a paso por áreas
🔹 Material completo: Lectura Crítica, Matemáticas, Ciencias, Sociales e Inglés
🔹 Simulacros tipo ICFES desde el año 2000 hasta 2026
🔹 Cuadernillos oficiales con respuestas explicadas
🔹 Acceso inmediato de por vida en PDF y Drive`;

// Mensaje 2 — texto que acompaña la imagen muestra + pregunta de pago
const SALUDO_MSG2 = `👆 Así se ve el material por dentro — pruebas reales, organizadas, listas para practicar como si fuera el día del examen 📝

━━━━━━━━━━━━━━━━━━
❌ ~~$79.000~~
✅ *HOY: $15.000 COP* 🇨🇴
━━━━━━━━━━━━━━━━━━
⏰ Si pagas ahora te llega un *regalo sorpresa* 🎁

¿Con cuál prefieres pagar?
👉 *Nequi* o *Bre-B*`;

// Datos de pago
const DATOS_PAGO = `💳 *Datos para tu pago de $15.000 COP:*

*Nequi:*
${CONFIG.NEQUI_NUMERO}

*Llave Bre-B:*
${CONFIG.LLAVE_BREB}

A nombre de *${CONFIG.NOMBRE_PARCIAL}*

Cuando hagas el pago, mándame la *captura de pantalla* del comprobante y te entrego el material al instante 📥`;

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
      mensajes        : [],
      estado          : 'nuevo',
      ultimaActividad : Date.now(),
    });
  }
  const s = sesiones.get(telefono);
  s.ultimaActividad = Date.now();
  return s;
}

// ══════════════════════════════════════════════
// 📤 ENVIAR POR WHATSAPP
// ══════════════════════════════════════════════
const EVO_HEADERS = {
  'apikey'      : CONFIG.EVOLUTION_API_KEY,
  'Content-Type': 'application/json',
};

async function enviarTexto(telefono, texto) {
  try {
    await axios.post(
      `${CONFIG.EVOLUTION_URL}/message/sendText/${CONFIG.EVOLUTION_INSTANCE}`,
      { number: telefono, text: texto },
      { headers: EVO_HEADERS }
    );
  } catch (e) {
    console.error(`❌ enviarTexto:`, e.response?.data || e.message);
  }
}

// enviarImagen desactivada temporalmente — Evolution API rechaza el formato
// async function enviarImagen(...) {}

async function entregarProducto(telefono) {
  try {
    await enviarTexto(telefono,
      `✅ *¡Pago confirmado!* Aquí está tu material 🎉\n\n` +
      `🔗 ${PRODUCTO.link_entrega}\n\n` +
      `Descarga todo y guárdalo bien. ¡Mucho éxito en el ICFES! 💪🏆`
    );
    console.log(`📦 Entregado → ${telefono}`);
  } catch (e) {
    console.error(`❌ entregarProducto:`, e.message);
    await enviarTexto(telefono, `😅 Problema enviando el link. Escríbenos y te lo mandamos ahora.`);
  }
}

const esperar = ms => new Promise(r => setTimeout(r, ms));

// ══════════════════════════════════════════════
// 🤖 PROMPT VENDEDOR — tono balanceado
// ══════════════════════════════════════════════
function promptVendedor() {
  return `Eres el asistente de ventas del *Mega Pack ICFES 2026* en Colombia.
El cliente ya vio toda la información del producto y el precio es $15.000 COP.
Tu estilo: amigo que conoce bien el tema + vendedor que sabe cerrar. Cálido pero directo.

REGLAS:
- Máximo 3 líneas por respuesta
- Si preguntan algo del contenido, responde brevemente y redirige a pagar
- Si dudan del precio, recuérdales que era $79.000 y hoy es $15.000
- Crea urgencia natural: "es por hoy", "acceso inmediato", "ya varios lo están pidiendo"
- Cuando confirmen que quieren comprar o pregunten cómo pagar, responde SOLO:
  {"accion":"mostrar_pago"}
- Si dicen "ya pagué", "hice la transferencia", "ya lo hice" o suben imagen, responde SOLO:
  {"accion":"pedir_captura"}
- NUNCA des el número de cuenta ni el nombre del titular
- NUNCA hagas más de una pregunta por mensaje
- Habla en español colombiano, natural y cercano`;
}

// ══════════════════════════════════════════════
// 👁️  PROMPT VERIFICACIÓN — zona horaria Colombia
// ══════════════════════════════════════════════
function promptVerificarCaptura() {
  // Fecha actual en Colombia (UTC-5)
  const ahora = new Date();
  const colombiaOffset = -5 * 60;
  const utc = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
  const fechaColombia = new Date(utc + colombiaOffset * 60000);
  const hoy = fechaColombia.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const ayer = new Date(fechaColombia);
  ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  return `Eres un verificador de pagos para Colombia. Analiza la captura de pantalla.

FECHA ACTUAL EN COLOMBIA: ${hoy}
FECHAS VÁLIDAS: ${hoy} o ${ayerStr}

PAGO VÁLIDO SI cumple TODOS estos criterios:
1. Monto: exactamente $15.000 COP (puede aparecer como 15000, 15.000, $15,000 o 15.000,00)
2. Nombre receptor visible: "Andrea Hernandez" O "Andrea Hernandez Salcedo"
3. Fecha: ${hoy} o ${ayerStr} — sé flexible con el formato de fecha (puede ser 12/03/2026, marzo 12, etc.)
4. Parece captura real de Nequi, Bancolombia, Daviplata u otra app bancaria colombiana

IMPORTANTE sobre fechas: las capturas de Nequi muestran la fecha en formato colombiano. Acepta cualquier formato que corresponda a hoy o ayer según Colombia.

RESPONDE SOLO con este JSON (sin texto extra):
{
  "valido": true,
  "monto_detectado": 15000,
  "fecha_detectada": "texto exacto de la fecha en la imagen",
  "numero_transaccion": "referencia o código único o null",
  "banco_detectado": "nombre del banco o null",
  "nombre_pagador": "quien envió o null",
  "razon_rechazo": null
}

Si algo no cuadra: valido false con razon_rechazo claro.
Si la imagen parece editada: valido false, razon_rechazo "imagen manipulada".`;
}

// ══════════════════════════════════════════════
// 🧠 CLAUDE TEXTO
// ══════════════════════════════════════════════
async function claudeChat(mensajes) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model      : 'claude-sonnet-4-20250514',
      max_tokens : 200,
      system     : promptVendedor(),
      messages   : mensajes,
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
// 👁️  CLAUDE VISIÓN
// ══════════════════════════════════════════════
async function claudeVision(imagenBase64, mediaType) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model      : 'claude-sonnet-4-20250514',
      max_tokens : 300,
      system     : promptVerificarCaptura(),
      messages   : [{
        role    : 'user',
        content : [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imagenBase64 } },
          { type: 'text',  text: 'Analiza este comprobante de pago.' },
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
// 💬 PROCESAR TEXTO
// ══════════════════════════════════════════════
async function procesarTexto(telefono, texto) {
  const sesion = getSesion(telefono);

  // ── PRIMER MENSAJE → bienvenida en 2 partes (solo texto) ──
  if (sesion.estado === 'nuevo') {
    sesion.estado = 'esperando_decision';

    await enviarTexto(telefono, SALUDO_MSG1);
    await esperar(2000);
    await enviarTexto(telefono, SALUDO_MSG2);

    sesion.mensajes.push({ role: 'user', content: texto });
    sesion.mensajes.push({ role: 'assistant', content: SALUDO_MSG1 + '\n\n' + SALUDO_MSG2 });
    return;
  }

  // ── DETECTAR "YA PAGUÉ" directamente sin gastar Claude ──
  const textoBajo = texto.toLowerCase();
  const yaPago = ['ya pagué','ya pague','ya transferí','ya transf','hice el pago',
    'te mandé','te mande','listo pagué','listo pague','ya lo hice','pague','pagué',
    'ya te mandé','ya te mande','realicé','realize'].some(p => textoBajo.includes(p));

  if (yaPago) {
    await enviarTexto(telefono, `📸 Perfecto, mándame la *captura del comprobante* y verifico al instante.`);
    sesion.estado = 'esperando_pago';
    return;
  }

  // ── CLAUDE responde ──
  sesion.mensajes.push({ role: 'user', content: texto });

  let respuesta;
  try {
    respuesta = await claudeChat(sesion.mensajes.slice(-10));
  } catch (e) {
    console.error('❌ Claude error:', e.message);
    await enviarTexto(telefono, 'Disculpa, tuve un error. Escríbeme de nuevo 🙏');
    return;
  }

  sesion.mensajes.push({ role: 'assistant', content: respuesta });

  // Detectar acción JSON
  let accion = null;
  try {
    const match = respuesta.match(/\{[\s\S]*?"accion"[\s\S]*?\}/);
    if (match) accion = JSON.parse(match[0]);
  } catch (_) {}

  if (accion?.accion === 'mostrar_pago') {
    sesion.estado = 'esperando_pago';
    await enviarTexto(telefono, DATOS_PAGO);
    return;
  }

  if (accion?.accion === 'pedir_captura') {
    sesion.estado = 'esperando_pago';
    await enviarTexto(telefono, `📸 Listo, mándame la *captura del comprobante* y te entrego el material al instante.`);
    return;
  }

  await enviarTexto(telefono, respuesta);
}

// ══════════════════════════════════════════════
// 🧾 VERIFICAR CAPTURA
// ══════════════════════════════════════════════
async function procesarCaptura(telefono, imagenBase64, mediaType) {
  const sesion = getSesion(telefono);

  await enviarTexto(telefono, `🔍 Verificando tu pago...`);
  sesion.estado = 'verificando';

  let resultado;
  try {
    const raw = await claudeVision(imagenBase64, mediaType);
    const match = raw.match(/\{[\s\S]*\}/);
    resultado = match ? JSON.parse(match[0]) : null;
  } catch (e) {
    console.error('❌ Vision error:', e.message);
    await enviarTexto(telefono, `No pude leer la imagen 😅 Mándala de nuevo con buena calidad.`);
    sesion.estado = 'esperando_pago';
    return;
  }

  if (!resultado) {
    await enviarTexto(telefono, `No pude leer el comprobante. ¿Lo mandas de nuevo? 📸`);
    sesion.estado = 'esperando_pago';
    return;
  }

  console.log(`🔍 Verificación ${telefono}:`, JSON.stringify(resultado));

  // ── VÁLIDO ──
  if (resultado.valido) {
    const txn = resultado.numero_transaccion;

    if (txn && transaccionesUsadas.has(txn)) {
      await enviarTexto(telefono, `⚠️ Este comprobante ya fue usado. Si es un error escríbenos.`);
      sesion.estado = 'conversando';
      return;
    }
    if (txn) transaccionesUsadas.add(txn);

    await enviarTexto(telefono,
      `✅ *¡Pago confirmado!* Recibimos *$${Number(resultado.monto_detectado).toLocaleString('es-CO')} COP* 🎉\n\nTe envío el material ahora mismo 📥`
    );
    await esperar(800);
    await entregarProducto(telefono);
    sesion.estado = 'conversando';
    console.log(`💰 VENTA | ${telefono} | Txn: ${txn}`);

  // ── INVÁLIDO ──
  } else {
    const razon = (resultado.razon_rechazo || '').toLowerCase();
    let msg;

    if (razon.includes('monto') || razon.includes('valor') || razon.includes('15')) {
      msg = `El monto no coincide ❌\nEl valor exacto es *$15.000 COP*. Verifica y manda la captura de nuevo.`;
    } else if (razon.includes('nombre') || razon.includes('titular') || razon.includes('destinat')) {
      msg = `El destinatario no coincide ❌\nVerifica que estés pagando a la cuenta correcta y manda la captura de nuevo.`;
    } else if (razon.includes('edit') || razon.includes('manipul')) {
      msg = `⚠️ La imagen no parece un comprobante original. Mándala directamente desde tu app bancaria.`;
    } else if (razon.includes('fecha') || razon.includes('antig')) {
      msg = `La fecha del comprobante no corresponde a hoy 📅\nSolo acepto pagos de hoy o ayer.`;
    } else {
      msg = `No pude confirmar el pago 😅\n${resultado.razon_rechazo || 'Intenta de nuevo.'}\nManda la captura de nuevo.`;
    }

    await enviarTexto(telefono, msg);
    sesion.estado = 'esperando_pago';
  }
}

// ══════════════════════════════════════════════
// 📥 WEBHOOK EVOLUTION API
// ══════════════════════════════════════════════
app.post('/webhook/evolution', async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.event !== 'messages.upsert') return;

    const data = body.data;
    if (!data) return;
    if (data.key?.fromMe) return;

    const remoteJid = data.key?.remoteJid || '';
    if (remoteJid.includes('@g.us')) return;

    const telefono = remoteJid.replace('@s.whatsapp.net', '');
    if (!telefono) return;

    const mensaje = data.message;
    if (!mensaje) return;

    // ── TEXTO ──
    const texto = mensaje.conversation || mensaje.extendedTextMessage?.text;
    if (texto?.trim()) {
      console.log(`📩 ${telefono}: ${texto.trim()}`);
      await procesarTexto(telefono, texto.trim());
      return;
    }

    // ── IMAGEN ──
    if (mensaje.imageMessage) {
      console.log(`📸 Imagen de ${telefono}`);
      try {
        const r = await axios.post(
          `${CONFIG.EVOLUTION_URL}/chat/getBase64FromMediaMessage/${CONFIG.EVOLUTION_INSTANCE}`,
          { message: { key: data.key, message: mensaje } },
          { headers: EVO_HEADERS }
        );
        const base64 = r.data?.base64;
        const mime   = mensaje.imageMessage.mimetype || 'image/jpeg';
        if (base64) {
          await procesarCaptura(telefono, base64, mime);
        } else {
          await enviarTexto(telefono, `No pude leer tu imagen 😅 Mándala de nuevo.`);
        }
      } catch (e) {
        console.error('❌ Imagen error:', e.message);
        await enviarTexto(telefono, `Error al recibir la imagen. Inténtalo de nuevo 📸`);
      }
      return;
    }

    // ── OTROS ──
    if (mensaje.audioMessage || mensaje.videoMessage || mensaje.stickerMessage) {
      await enviarTexto(telefono, `Solo puedo leer texto e imágenes 😊 ¿Te interesa el Mega Pack ICFES?`);
    }

  } catch (e) {
    console.error('❌ Webhook error:', e.message);
  }
});

// ══════════════════════════════════════════════
// 🔧 ADMIN
// ══════════════════════════════════════════════
app.get('/health', (_req, res) => {
  res.json({
    status  : '✅ Bot activo',
    sesiones: sesiones.size,
    ventas  : transaccionesUsadas.size,
  });
});

app.post('/admin/entregar', async (req, res) => {
  const { telefono, adminKey } = req.body;
  if (adminKey !== CONFIG.ADMIN_KEY) return res.status(401).json({ error: 'No autorizado' });
  await entregarProducto(telefono);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════
// 🚀 ARRANCAR
// ══════════════════════════════════════════════
app.listen(CONFIG.PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║  🤖 BOT ICFES 2026 — ACTIVO              ║
║  Precio   : $15.000 COP                  ║
║  Cobro    : Nequi / Bre-B                ║
║  Imágenes : configurar IDs en IMAGENES   ║
╚══════════════════════════════════════════╝
  `);
});
