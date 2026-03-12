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
  ANTHROPIC_API_KEY  : process.env.ANTHROPIC_API_KEY,

  EVOLUTION_URL      : 'https://evolution-api-production-905e.up.railway.app',
  EVOLUTION_API_KEY  : 'db25dfe6adad17eeea9555433007cccad3372320ae2f9051ba8a4791694aa3db',
  EVOLUTION_INSTANCE : 'Mi-tienda',

  // Datos de cobro — se muestran PARCIALMENTE hasta confirmar pago
  NEQUI_NUMERO       : '3003843676',
  LLAVE_BREB         : '3003843676',
  // Nombre real para verificar captura — NUNCA se muestra completo al cliente
  NOMBRE_TITULAR_REAL: 'Andrea Hernandez',        // verifica con este
  NOMBRE_TITULAR_REAL2: 'Andrea Hernandez Salcedo', // o con este
  // Nombre parcial que SÍ se muestra al cliente (para no facilitar fraude)
  NOMBRE_PARCIAL     : 'And*** Her***',

  NOMBRE_NEGOCIO     : 'Mega Pack ICFES',
  ADMIN_KEY          : process.env.ADMIN_KEY || 'admin-icfes-2024',
  PORT               : process.env.PORT || 3000,
};

// ══════════════════════════════════════════════
// 📦 PRODUCTO
// ══════════════════════════════════════════════
const PRODUCTO = {
  id           : 'mega-pack-icfes',
  nombre       : 'Mega Pack ICFES 2026',
  precio       : 15000,
  link_entrega : 'https://drive.google.com/drive/folders/187flxW4FjDOnDirhTzjaVyB0yUf7L4w4?usp=sharing',
};

// ══════════════════════════════════════════════
// 💬 MENSAJE DE BIENVENIDA (fijo, no generado por IA)
// ══════════════════════════════════════════════
const SALUDO_INICIAL = `👋 ¡Hola! Qué gusto saludarte 😊 Gracias por interesarte en *Mega Pack ICFES 2026* 💡

📚 ¿Quieres sacar un puntaje alto en el ICFES sin perder tiempo?
Te presento el pack más completo, organizado y fácil de usar para estudiar con estrategia y resultados 💪🎯

💼 *¿Qué incluye este pack?*

🔹 *1. Guía inicial*
📌 "Lee esto antes de empezar" – para sacarle el máximo provecho desde el primer momento.

🔹 *2. Metodología paso a paso*
🎯 Aprende a estudiar de forma estratégica, sin perder tiempo.

🔹 *3. Material por ÁREAS del examen:*
✔ Lectura Crítica
✔ Matemáticas
✔ Ciencias Naturales
✔ Sociales y Ciudadanas
✔ Inglés

Cada área incluye:
📖 Guía clara | 📝 Ejercicios tipo ICFES | 📂 Material de apoyo | 🎯 Simulacros

🔹 *4. Simulacros Generales y Premium*
✅ ¡Simula el examen real y mejora tus resultados!

━━━━━━━━━━━━━━━━━━━━
❌ ANTES: $79.000
✅ *SOLO HOY: $15.000 COP* 🇨🇴✨
━━━━━━━━━━━━━━━━━━━━

⏰ Si confirmas tu pago en menos de 10 minutos, te envío un *REGALO SORPRESA* 🎁✨

🛒 *¿Con qué método prefieres pagar?*
👇 Responde: *Nequi* o *Bre-B*`;

// ══════════════════════════════════════════════
// 💳 MENSAJE DE DATOS DE PAGO (fijo)
// ══════════════════════════════════════════════
const DATOS_PAGO = `💳 *Datos para tu pago de $15.000 COP:*

*Nequi:*
${CONFIG.NEQUI_NUMERO}

*Llave Bre-B:*
${CONFIG.LLAVE_BREB}

A nombre de *${CONFIG.NOMBRE_PARCIAL}*

⚡ Cuando hagas el pago, mándame la *captura de pantalla* del comprobante y te entrego el material al instante 📥

⏰ *¡Tienes 10 minutos para acceder al precio especial!* 🎁`;

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
      estado          : 'nuevo',   // nuevo | esperando_pago | verificando
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
    console.log(`✅ → ${telefono}`);
  } catch (e) {
    console.error(`❌ enviarTexto:`, e.response?.data || e.message);
  }
}

async function entregarProducto(telefono) {
  try {
    await enviarTexto(telefono,
      `🎉 *¡Pago confirmado!* Aquí está tu material:\n\n` +
      `🔗 ${PRODUCTO.link_entrega}\n\n` +
      `Descarga todos los archivos y guárdalos. ¡Mucho éxito en el ICFES! 💪🏆`
    );
    console.log(`📦 Entregado → ${telefono}`);
  } catch (e) {
    console.error(`❌ entregarProducto:`, e.message);
    await enviarTexto(telefono, `😅 Problema enviando el link. Escríbenos y te lo mandamos ahora.`);
  }
}

const esperar = ms => new Promise(r => setTimeout(r, ms));

// ══════════════════════════════════════════════
// 🤖 PROMPT — MUY CONCISO Y AGRESIVO EN VENTAS
// ══════════════════════════════════════════════
function promptVendedor() {
  return `Eres un vendedor conciso y efectivo del *Mega Pack ICFES 2026* en Colombia.
El precio es $15.000 COP. Ya le mostraste al cliente toda la info del producto.

TU ÚNICO OBJETIVO: llevar al cliente a pagar LO MÁS RÁPIDO POSIBLE.

REGLAS ESTRICTAS:
- Máximo 3 líneas por respuesta
- Crea urgencia: "solo por hoy", "quedan pocas unidades", "oferta por tiempo limitado"
- Si preguntan algo del producto, responde en 1 línea y redirige a pagar
- Si dudan del precio, recuerda que era $79.000 y hoy es $15.000
- Si dicen que no tienen plata, diles que es menos de lo que cuesta un almuerzo
- Cuando confirmen que quieren comprar o pregunten cómo pagar, responde SOLO:
  {"accion":"mostrar_pago"}
- Si dicen "ya pagué", "hice la transferencia", "listo" o similar, responde SOLO:
  {"accion":"pedir_captura"}
- NUNCA des el número de cuenta ni el nombre del titular — eso lo maneja el sistema
- NUNCA hagas más de una pregunta
- Habla en español colombiano, energético y directo`;
}

// ══════════════════════════════════════════════
// 👁️  PROMPT VERIFICACIÓN DE CAPTURA
// ══════════════════════════════════════════════
function promptVerificarCaptura() {
  return `Eres un verificador de pagos. Analiza la captura de pantalla.

PAGO VÁLIDO SI:
- Monto: exactamente $15.000 COP (pueden aparecer como 15000, 15.000 o $15,000)
- Nombre del receptor visible: "Andrea Hernandez" O "Andrea Hernandez Salcedo"
- Fecha: hoy o máximo ayer
- Parece una captura real de Nequi, Bancolombia, app bancaria colombiana

RESPONDE SOLO con este JSON (sin texto extra, sin bloques de código):
{
  "valido": true,
  "monto_detectado": 15000,
  "fecha_detectada": "texto o null",
  "numero_transaccion": "código único o null",
  "banco_detectado": "nombre o null",
  "nombre_pagador": "quien envió o null",
  "razon_rechazo": null
}

Si algo no cuadra: valido false con razon_rechazo explicando qué falló.
Si la imagen parece editada o manipulada: valido false.`;
}

// ══════════════════════════════════════════════
// 🧠 CLAUDE — TEXTO
// ══════════════════════════════════════════════
async function claudeChat(mensajes) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model      : 'claude-sonnet-4-20250514',
      max_tokens : 200, // corto y barato
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
// 👁️  CLAUDE — VISIÓN
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
          { type: 'text',  text: 'Analiza este comprobante.' },
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

  // ── PRIMER MENSAJE → saludo completo automático ──
  if (sesion.estado === 'nuevo') {
    sesion.estado = 'esperando_decision';
    sesion.mensajes.push({ role: 'user', content: texto });
    sesion.mensajes.push({ role: 'assistant', content: SALUDO_INICIAL });
    await enviarTexto(telefono, SALUDO_INICIAL);
    return;
  }

  // ── DETECTAR SI DICE QUE YA PAGÓ (antes de llamar a Claude) ──
  const textoBajo = texto.toLowerCase();
  const yaPago = ['ya pagué', 'ya pague', 'ya transferí', 'ya transf', 'hice el pago',
    'te mandé', 'te mande', 'listo pagué', 'listo pague', 'ya lo hice', 'pague', 'pagué'].some(p => textoBajo.includes(p));

  if (yaPago || sesion.estado === 'esperando_pago') {
    await enviarTexto(telefono, `📸 Listo, mándame la *captura de pantalla* del comprobante y verifico al instante.`);
    sesion.estado = 'esperando_pago';
    return;
  }

  // ── RESPUESTA DE CLAUDE ──
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
    await enviarTexto(telefono, `📸 Perfecto, mándame la *captura del comprobante* y te entrego el material al instante.`);
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
    await enviarTexto(telefono, `No pude leer el comprobante. ¿Puedes mandarlo de nuevo? 📸`);
    sesion.estado = 'esperando_pago';
    return;
  }

  console.log(`🔍 Verificación ${telefono}:`, resultado);

  // ── VÁLIDO ──
  if (resultado.valido) {
    const txn = resultado.numero_transaccion;

    if (txn && transaccionesUsadas.has(txn)) {
      await enviarTexto(telefono, `⚠️ Este comprobante ya fue usado. Si es un error escríbenos.`);
      sesion.estado = 'conversando';
      return;
    }
    if (txn) transaccionesUsadas.add(txn);

    await enviarTexto(telefono, `✅ *¡Pago confirmado!* Recibimos $${Number(resultado.monto_detectado).toLocaleString('es-CO')} COP 🎉`);
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
      msg = `El nombre del destinatario no coincide ❌\nVerifica que estés pagando a la cuenta correcta y manda la captura de nuevo.`;
    } else if (razon.includes('edit') || razon.includes('manipul') || razon.includes('falso')) {
      msg = `⚠️ La imagen no parece un comprobante original. Mándala directamente desde tu app bancaria.`;
    } else if (razon.includes('fecha') || razon.includes('antig')) {
      msg = `Comprobante muy antiguo 📅 Solo acepto pagos de hoy o ayer.`;
    } else {
      msg = `No pude confirmar el pago 😅\n${resultado.razon_rechazo || 'Intenta de nuevo o escríbenos.'}\nManda la captura de nuevo.`;
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

    // ── OTROS (audio, video, sticker) ──
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
    status   : '✅ Bot activo',
    producto : PRODUCTO.nombre,
    precio   : '$15.000 COP',
    sesiones : sesiones.size,
    ventas   : transaccionesUsadas.size,
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
║  Precio  : $15.000 COP                   ║
║  Cobro   : Nequi / Bre-B                 ║
║  Titular : And*** Her***                 ║
╚══════════════════════════════════════════╝
  `);
});
