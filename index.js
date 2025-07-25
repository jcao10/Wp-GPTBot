require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const webhookRouter = require('./src/api/webhook');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.use('/webhook', webhookRouter);

app.get('/', (req, res) => {
  res.send('WhatsApp Chatbot is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 