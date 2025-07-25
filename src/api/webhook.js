const express = require('express');
const router = express.Router();
const { sendMessage } = require('../services/whatsapp'); // Import the sendMessage function
const { getChatGptResponse } = require('../services/openai'); // Import the AI function

// Store processed message IDs to prevent duplicates
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
  let body = req.body;

  // console.log(JSON.stringify(req.body, null, 2)); // Comentado para limpiar el log

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0] &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      
      // Check if this is a real message (not a status update)
      if (message.type !== 'text') {
        console.log(`Skipping non-text message of type: ${message.type}`);
        res.sendStatus(200);
        return;
      }

      // Check for duplicate messages
      if (processedMessages.has(message.id)) {
        console.log(`Skipping duplicate message: ${message.id}`);
        res.sendStatus(200);
        return;
      }

      // Add message ID to processed set
      processedMessages.add(message.id);
      
      // Clean up old message IDs (keep only last 1000)
      if (processedMessages.size > 1000) {
        const idsArray = Array.from(processedMessages);
        processedMessages.clear();
        idsArray.slice(-500).forEach(id => processedMessages.add(id));
      }

      let from = message.from; // Sender's phone number
      const msg_body = message.text.body; // Message text

      console.log(`Processing message from ${from}: "${msg_body}"`);

      // Normalize the phone number for Argentina cases (remove the '9' after country code '54')
      if (from.startsWith('549')) {
        from = '54' + from.substring(3);
        console.log(`Normalized phone number to: ${from}`);
      }

      // Get AI response and then send it (now passing the phone number)
      const aiResponse = await getChatGptResponse(msg_body, from);
      
      console.log(`🤖 Sending response to ${from}: "${aiResponse}"`); // Log para ver la respuesta del bot
      
      await sendMessage(from, aiResponse);
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

module.exports = router; 