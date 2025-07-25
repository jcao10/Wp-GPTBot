const axios = require('axios');

/**
 * Sends a WhatsApp message to a specified recipient.
 * @param {string} to The recipient's phone number.
 * @param {string} text The body of the message to be sent.
 */
const sendMessage = async (to, text) => {
  const url = `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`;
  
  const data = {
    messaging_product: 'whatsapp',
    to: to,
    text: { body: text },
  };

  const headers = {
    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    await axios.post(url, data, { headers });
    console.log(`Message sent to ${to}`);
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
  }
};

module.exports = {
  sendMessage,
}; 