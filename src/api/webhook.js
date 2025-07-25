const express = require('express');
const bodyParser = require('body-parser');
const { sendMessage } = require('../services/whatsapp');
const { orchestrateResponse } = require('../bot/orchestrator'); // Importamos desde el orquestador

const router = express.Router();
router.use(bodyParser.json());

// Almacenamiento en memoria para IDs de mensajes procesados para evitar duplicados.
const processedMessages = new Set();

// Webhook verification endpoint
router.get('/', (req, res) => {
  const verify_token = process.env.VERIFY_TOKEN;

  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verify_token) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Webhook to receive messages
router.post('/', async (req, res) => {
    try {
        const entry = req.body.entry && req.body.entry[0];
        const change = entry && entry.changes && entry.changes[0];
        const message = change && change.value && change.value.messages && change.value.messages[0];

        if (message) {
            // ---- INICIO: Lógica de control de duplicados ----
            if (processedMessages.has(message.id)) {
                console.log(`[Webhook] Skipping duplicate message ID: ${message.id}`);
                return res.sendStatus(200);
            }
            processedMessages.add(message.id);
            // Limpiamos el set periódicamente para no consumir memoria infinita
            if (processedMessages.size > 1000) {
                const oldestMessages = Array.from(processedMessages).slice(0, 500);
                oldestMessages.forEach(id => processedMessages.delete(id));
            }
            // ---- FIN: Lógica de control de duplicados ----

            let userPhone = message.from; // Se cambia a let para poder modificarlo
            const userMessage = message.text.body;

            // Lógica de normalización reincorporada
            if (userPhone.startsWith('549')) {
                userPhone = '54' + userPhone.substring(3);
                console.log(`Normalized phone number to: ${userPhone}`);
            }

            console.log(`Processing message from ${userPhone}: "${userMessage}"`);

            // Llamamos al orquestador con el número YA normalizado
            const response = await orchestrateResponse(userMessage, userPhone);

            console.log(`🤖 Sending response to ${userPhone}: "${response}"`);
            await sendMessage(userPhone, response);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error en el webhook:', error);
        res.sendStatus(500);
    }
});

module.exports = router; 