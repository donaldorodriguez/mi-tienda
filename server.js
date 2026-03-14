/**
 * BOT WHATSAPP IA — INFOPRODUCTOS COLOMBIA 🇨🇴
 * ─────────────────────────────────────────────
 * Stack:
 *   - Evolution API  → conectar WhatsApp (ya configurado)
 *   - Claude AI      → conversación + verificación de capturas
 *   - Express        → servidor webhook
 *
 * Flujo:
 *   Cliente escribe → IA vende → Bot da datos de pago →
 *   Cliente manda captura → Claude verifica →
 *   Si OK → Bot entrega link del producto
 */

const express = require('express');
const axios   = require('axios');
const app     = express();
app.use(express.json({ limit: '10mb' }));

// ══════════════════════════════════════════════
// ⚙️  CONFIGURACIÓN
// ══════════════════════════════════════════════
const CONFIG = {
  // Claude AI — pon tu API key en las variables de entorno de Railway
  ANTHROPIC_API_KEY  : process.env.ANTHROPIC_API_KEY,

  // Evolution API
  EVOLUTION_URL      : 'https://evolution-api-production-905e.up.railway.app',
  EVOLUTION_API_KEY  : 'db25dfe6adad17eeea9555433007cccad3372320ae2f9051ba8a4791694aa3db',
  EVOLUTION_INSTANCE : 'Mi-tienda',

  // Datos de cobro
  NEQUI_NUMERO        : '3003843676',
  LLAVE_BREB          : '3003843676',
  NOMBRE_PARCIAL      : 'And*** Her***',           // lo que ve el cliente
  NOMBRE_TITULAR_REAL : 'Andrea Hernandez',         // para verificar captura
  NOMBRE_TITULAR_REAL2: 'Andrea Hernandez Salcedo', // variante con apellido
  NOMBRE_NEGOCIO      : 'Academia ICFES',

  // Admin
  ADMIN_KEY          : process.env.ADMIN_KEY || 'admin-icfes-2024',

  PORT               : process.env.PORT || 3000,
};

// ══════════════════════════════════════════════
// 📦 PRODUCTO
// ══════════════════════════════════════════════
const PRODUCTO = {
  id          : 'mega-pack-icfes',
  nombre      : '📚 Mega Pack ICFES 2026',
  descripcion : 'Todo lo que necesitas para prepararte y ganarle al ICFES. Material completo y actualizado para el 2026.',
  precio      : 15000,
  // Link directo a la carpeta de Drive
  link_entrega: 'https://drive.google.com/drive/folders/187flxW4FjDOnDirhTzjaVyB0yUf7L4w4?usp=sharing',
};

// ══════════════════════════════════════════════
// 🗄️  SESIONES EN MEMORIA
// ══════════════════════════════════════════════
const sesiones = new Map();
const transaccionesUsadas = new Set();

// Limpiar sesiones mayores a 24h
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
      estado          : 'conversando', // conversando | esperando_pago | verificando
      ultimaActividad : Date.now(),
    });
  }
  const s = sesiones.get(telefono);
  s.ultimaActividad = Date.now();
  return s;
}

// ══════════════════════════════════════════════
// 📤 ENVIAR POR WHATSAPP (Evolution API)
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
    console.log(`✅ Mensaje → ${telefono}`);
  } catch (e) {
    console.error(`❌ enviarTexto error:`, e.response?.data || e.message);
  }
}

async function entregarProducto(telefono) {
  try {
    const mensaje =
      `🎉 *¡Pago confirmado!*\n\n` +
      `Aquí está tu *${PRODUCTO.nombre}*:\n\n` +
      `🔗 ${PRODUCTO.link_entrega}\n\n` +
      `Accede al link, descarga todos los archivos y guárdalos bien. ¡Mucho éxito en el ICFES! 💪`;

    await enviarTexto(telefono, mensaje);
    console.log(`📦 Producto entregado → ${telefono}`);
  } catch (e) {
    console.error(`❌ entregarProducto error:`, e.message);
    await enviarTexto(
      telefono,
      `😅 Tuve un problema enviando el link. Escríbenos de nuevo y te lo mandamos de inmediato.`
    );
  }
}

const esperar = ms => new Promise(r => setTimeout(r, ms));

// ══════════════════════════════════════════════
// 💬 SALUDO INICIAL (fijo, no consume tokens)
// ══════════════════════════════════════════════
const SALUDO_INICIAL = `👋 ¡Hola! Qué gusto saludarte 😊 Gracias por interesarte en *Mega Pack ICFES 2026* 💡

📚 ¿Quieres sacar un puntaje alto en el ICFES sin perder tiempo?
Te presento el pack más completo, organizado y fácil de usar para estudiar con estrategia y resultados 💪🎯

💼 *¿Qué es Mega Pack ICFES 2026?*
Un súper paquete digital que te ayuda a estudiar lo que realmente importa, con recursos claros, efectivos y listos para usar desde el primer día 🚀

📦 *¿Qué incluye este pack increíble?*

🔹 *1. Guía inicial:*
📌 "Lee esto antes de empezar" – instrucciones para sacarle el máximo provecho desde el primer momento.

🔹 *2. Metodología paso a paso:*
🎯 Aprende a estudiar de forma estratégica, sin perder tiempo en contenido innecesario.

🔹 *3. Material por ÁREAS del examen:*
✔ Lectura Crítica
✔ Matemáticas
✔ Ciencias Naturales
✔ Sociales y Ciudadanas
✔ Inglés

Cada área incluye:
📖 Guía clara | 📝 Ejercicios tipo ICFES | 📂 Material de apoyo | 🎯 Simulacros específicos

🔹 *4. Simulacros Generales y Premium:*
✅ ¡Simula el examen real y mejora tus resultados con práctica inteligente!

━━━━━━━━━━━━━━━━━━━━
❌ ANTES: $79.000
✅ *SOLO HOY: $15.000 COP* 🇨🇴✨
━━━━━━━━━━━━━━━━━━━━

⏰ Si confirmas tu pago en menos de 10 minutos, te envío un *REGALO SORPRESA* 🎁✨

🛒 *¿Con qué método prefieres pagar?*
👇 Responde: *Nequi* o *Bre-B*`;

// ══════════════════════════════════════════════
// 🤖 PROMPTS PARA CLAUDE
// ══════════════════════════════════════════════
function promptVendedor() {
  return `Eres un asistente de ventas amable de "${CONFIG.NOMBRE_NEGOCIO}" en Colombia.
Vendes material de preparación para el ICFES por WhatsApp.

PRODUCTO:
• ${PRODUCTO.nombre} — $${PRODUCTO.precio.toLocaleString('es-CO')} COP
  ${PRODUCTO.descripcion}

INSTRUCCIONES:
- Saluda con calidez al inicio
- Pregunta en qué grado está o cuándo presenta el ICFES
- Explica el valor del Mega Pack según su situación
- Mensajes cortos (máximo 4 líneas), usa negrillas con *asteriscos* para lo importante
- Usa emojis con moderación
- Cuando el cliente confirme que quiere comprar, responde SOLO con este JSON exacto:
  {"accion":"mostrar_pago"}
- Si el cliente dice "ya pagué", "hice la transferencia", "ya te mandé la plata" o similar:
  {"accion":"pedir_captura"}
- Si preguntan por métodos de pago, explica: Nequi, Bancolombia o Bre-B
- Habla en español colombiano natural, como si fuera un amigo que sabe del tema
- No presiones, sé genuinamente útil

IMPORTANTE: Solo responde con el JSON cuando el cliente confirme compra o diga que ya pagó. En cualquier otro caso responde normalmente en texto.`;
}

function promptVerificarCaptura() {
  const ahora = new Date();
  const utc = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
  const col = new Date(utc + (-5 * 60 * 60000));
  const hoy = col.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const ayer = new Date(col); ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  return `Eres un verificador de pagos para Colombia.

FECHA HOY EN COLOMBIA: ${hoy}
FECHAS VÁLIDAS: ${hoy} o ${ayerStr}

PAGO VÁLIDO SI cumple TODO:
1. Monto exacto: $15.000 COP (puede aparecer como 15000, 15.000 o 15.000,00)
2. Nombre receptor: "Andrea Hernandez" O "Andrea Hernandez Salcedo"
3. Fecha: hoy o ayer según Colombia — acepta cualquier formato de fecha
4. Captura real de app bancaria colombiana (Nequi, Daviplata, Bancolombia, etc.)

RESPONDE SOLO con este JSON (sin texto extra, sin bloques de código):
{
  "valido": true,
  "monto_detectado": 15000,
  "fecha_detectada": "texto exacto de la fecha en la imagen",
  "numero_transaccion": "referencia única o null",
  "banco_detectado": "nombre del banco o null",
  "nombre_pagador": "quien envió o null",
  "razon_rechazo": null
}

Si algo no cuadra: valido false con razon_rechazo claro.
Si imagen parece editada: valido false.`;
}


// ══════════════════════════════════════════════
// 🧠 LLAMADAS A CLAUDE
// ══════════════════════════════════════════════
async function claudeChat(mensajes, systemPrompt) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model      : 'claude-sonnet-4-20250514',
      max_tokens : 400,
      system     : systemPrompt,
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

async function claudeVision(imagenBase64, mediaType) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model      : 'claude-sonnet-4-20250514',
      max_tokens : 400,
      system     : promptVerificarCaptura(),
      messages   : [{
        role    : 'user',
        content : [
          {
            type   : 'image',
            source : { type: 'base64', media_type: mediaType, data: imagenBase64 },
          },
          { type: 'text', text: 'Analiza este comprobante y responde con el JSON.' },
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

  // ── PRIMER MENSAJE → saludo fijo sin gastar tokens ──
  if (sesion.mensajes.length === 0) {
    sesion.mensajes.push({ role: 'user', content: texto });
    sesion.mensajes.push({ role: 'assistant', content: SALUDO_INICIAL });
    await enviarTexto(telefono, SALUDO_INICIAL);
    return;
  }

  // ── DETECTAR "YA PAGUÉ" sin llamar a Claude ──
  const textoBajo = texto.toLowerCase();
  const yaPago = ['ya pagué','ya pague','hice el pago','te mandé','te mande',
    'ya lo hice','pague','pagué','ya te mandé','ya te mande','transferí','realize'].some(p => textoBajo.includes(p));
  if (yaPago) {
    await enviarTexto(telefono, `📸 Perfecto, mándame la *captura del comprobante* y verifico al instante.`);
    sesion.estado = 'esperando_pago';
    return;
  }

  sesion.mensajes.push({ role: 'user', content: texto });

  let respuesta;
  try {
    respuesta = await claudeChat(sesion.mensajes.slice(-16), promptVendedor());
  } catch (e) {
    console.error('❌ Claude error:', e.message);
    await enviarTexto(telefono, 'Disculpa, tuve un error. Escríbeme de nuevo en un momento 🙏');
    return;
  }

  sesion.mensajes.push({ role: 'assistant', content: respuesta });

  // Detectar si Claude devolvió una acción JSON
  let accion = null;
  try {
    const match = respuesta.match(/\{[\s\S]*?"accion"[\s\S]*?\}/);
    if (match) accion = JSON.parse(match[0]);
  } catch (_) {}

  // ── ACCIÓN: mostrar datos de pago ──
  if (accion?.accion === 'mostrar_pago') {
    sesion.estado = 'esperando_pago';
    const instrucciones =
      `💳 *Datos para tu pago de $15.000 COP:*\n\n` +
      `*Nequi 📱*\n${CONFIG.NEQUI_NUMERO}\n\n` +
      `*Bre-B 🔑*\n${CONFIG.LLAVE_BREB}\n\n` +
      `A nombre de: *${CONFIG.NOMBRE_PARCIAL}*\n\n` +
      `Cuando hagas el pago, mándame la *captura de pantalla* del comprobante y te envío el material al instante 📥`;
    await enviarTexto(telefono, instrucciones);
    return;
  }

  // ── ACCIÓN: pedir captura ──
  if (accion?.accion === 'pedir_captura') {
    await enviarTexto(
      telefono,
      `📸 Listo, mándame la captura de pantalla del comprobante de pago y lo verifico enseguida.`
    );
    sesion.estado = 'esperando_pago';
    return;
  }

  // ── Respuesta normal de texto ──
  await enviarTexto(telefono, respuesta);
}

// ══════════════════════════════════════════════
// 🧾 VERIFICAR CAPTURA DE PAGO
// ══════════════════════════════════════════════
async function procesarCaptura(telefono, imagenBase64, mediaType) {
  const sesion = getSesion(telefono);

  await enviarTexto(telefono, `Revisando tu comprobante... 🔍`);
  sesion.estado = 'verificando';

  let resultado;
  try {
    const raw = await claudeVision(imagenBase64, mediaType);
    const match = raw.match(/\{[\s\S]*\}/);
    resultado = match ? JSON.parse(match[0]) : null;
  } catch (e) {
    console.error('❌ Error verificando captura:', e.message);
    await enviarTexto(
      telefono,
      `Tuve un problema leyendo la imagen 😅\nMándala de nuevo asegurándote que se vea claro el monto y la referencia.`
    );
    sesion.estado = 'esperando_pago';
    return;
  }

  if (!resultado) {
    await enviarTexto(telefono, `No pude leer el comprobante 🤔 ¿Puedes mandarlo de nuevo con mejor calidad?`);
    sesion.estado = 'esperando_pago';
    return;
  }

  console.log(`🔍 Verificación ${telefono}:`, resultado);

  // ── PAGO VÁLIDO ──
  if (resultado.valido) {
    const txn = resultado.numero_transaccion;

    // Anti-fraude: misma transacción no se usa dos veces
    if (txn && transaccionesUsadas.has(txn)) {
      await enviarTexto(
        telefono,
        `⚠️ Este comprobante ya fue usado antes. Si crees que hay un error escríbenos.`
      );
      sesion.estado = 'conversando';
      return;
    }

    if (txn) transaccionesUsadas.add(txn);

    const nombre = resultado.nombre_pagador ? ` *${resultado.nombre_pagador}*,` : '';
    await enviarTexto(
      telefono,
      `🎉 ¡Pago confirmado!${nombre} recibimos *$${Number(resultado.monto_detectado).toLocaleString('es-CO')} COP*\n\nTe envío el material ahora mismo 📥`
    );

    await esperar(800);
    await entregarProducto(telefono);

    sesion.estado = 'conversando';
    console.log(`💰 VENTA | ${PRODUCTO.nombre} | ${telefono} | Txn: ${txn}`);

  // ── PAGO INVÁLIDO ──
  } else {
    const razon = (resultado.razon_rechazo || '').toLowerCase();
    let msg;

    if (razon.includes('monto') || razon.includes('valor') || razon.includes('15')) {
      msg = `El monto no coincide 🤔\n\nEl valor exacto es *$${PRODUCTO.precio.toLocaleString('es-CO')} COP*. Asegúrate de enviar ese valor y manda la captura de nuevo.`;
    } else if (razon.includes('edit') || razon.includes('manipul') || razon.includes('falso')) {
      msg = `⚠️ La imagen no parece un comprobante original. Manda la captura directamente desde tu app bancaria.`;
    } else if (razon.includes('fecha') || razon.includes('antig')) {
      msg = `La fecha del comprobante parece muy antigua 📅 Solo acepto pagos de hoy o ayer.`;
    } else if (razon.includes('no parece') || razon.includes('comprobante') || razon.includes('no es')) {
      msg = `No reconocí esto como un comprobante 🤔\n\nManda la captura desde Nequi, Bancolombia o tu app bancaria donde diga que la transferencia fue exitosa.`;
    } else {
      msg = `No pude confirmar el pago 😅\n\n${resultado.razon_rechazo || 'Intenta de nuevo o escríbenos para ayudarte.'}`;
    }

    await enviarTexto(telefono, msg);
    sesion.estado = 'esperando_pago';
  }
}

// ══════════════════════════════════════════════
// 📥 WEBHOOK — EVOLUTION API
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
    if (remoteJid.includes('@g.us')) return; // ignorar grupos

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
        const res2 = await axios.post(
          `${CONFIG.EVOLUTION_URL}/chat/getBase64FromMediaMessage/${CONFIG.EVOLUTION_INSTANCE}`,
          { message: { key: data.key, message: mensaje } },
          { headers: EVO_HEADERS }
        );
        const base64 = res2.data?.base64;
        const mime   = mensaje.imageMessage.mimetype || 'image/jpeg';

        if (base64) {
          await procesarCaptura(telefono, base64, mime);
        } else {
          await enviarTexto(telefono, `No pude leer tu imagen 😅 ¿Puedes mandarla de nuevo?`);
        }
      } catch (e) {
        console.error('❌ Error imagen:', e.message);
        await enviarTexto(telefono, `No pude descargar la imagen 😅 Inténtalo de nuevo.`);
      }
      return;
    }

    // ── AUDIO / VIDEO / STICKER ──
    if (mensaje.audioMessage || mensaje.videoMessage || mensaje.stickerMessage) {
      await enviarTexto(telefono, `Solo puedo leer mensajes de texto e imágenes 😊 ¿En qué te puedo ayudar?`);
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
    status    : '✅ Bot activo',
    producto  : PRODUCTO.nombre,
    precio    : `$${PRODUCTO.precio.toLocaleString('es-CO')} COP`,
    sesiones  : sesiones.size,
    ventas    : transaccionesUsadas.size,
  });
});

// Entrega manual si algo falla
app.post('/admin/entregar', async (req, res) => {
  const { telefono, adminKey } = req.body;
  if (adminKey !== CONFIG.ADMIN_KEY) return res.status(401).json({ error: 'No autorizado' });
  await entregarProducto(telefono);
  res.json({ ok: true, mensaje: `Entregado a ${telefono}` });
});

// ══════════════════════════════════════════════
// 🚀 ARRANCAR
// ══════════════════════════════════════════════
app.listen(CONFIG.PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   🤖 BOT WHATSAPP IA — ICFES 2026         ║
║   Puerto    : ${CONFIG.PORT}                        ║
║   Producto  : ${PRODUCTO.nombre}    ║
║   Precio    : $${PRODUCTO.precio.toLocaleString('es-CO')} COP              ║
║   Cobro     : Nequi / Bre-B               ║
╚═══════════════════════════════════════════╝
  `);
});
