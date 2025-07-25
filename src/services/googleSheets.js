const { google } = require('googleapis');
const path = require('path');

/**
 * Módulo de Conexión a Google Sheets
 * ---------------------------------
 * Responsabilidad Única: Autenticar y exportar una instancia del cliente
 * de la API de Google Sheets y el ID de la hoja de cálculo.
 * 
 * Otros módulos (sheetsReader, sheetsWriter) importarán 'sheets' y 
 * 'SPREADSHEET_ID' desde aquí para realizar sus operaciones.
 */

// Path to your service account key file
const KEYFILE = path.join(__dirname, '../../config/google-credentials.json');

// Your Google Sheets ID (extracted from the URL)
const SPREADSHEET_ID = '1lVvwN7w8cpWq_iaDzDbmPRVb8_SitA8lf4hspAYCmAw';

// Initialize the Google Sheets API client
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

module.exports = {
  sheets,
  SPREADSHEET_ID,
}; 