import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { appendInquiry } from '../lib/googleSheets.js';

// Setup __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local in root
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function runTest() {
  console.log('Starting Google Sheets Integration Test...');
  console.log('Sheet ID:', process.env.GOOGLE_SHEET_ID ? 'Configured' : 'NOT Configured');
  console.log('Service Account Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Configured' : 'NOT Configured');
  console.log('Service Account Key:', process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? 'Configured' : 'NOT Configured');
  console.log('Credentials JSON:', process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS ? 'Configured' : 'NOT Configured');

  const testInquiry = {
    name: 'Testy McTestface',
    email: 'test@example.com',
    phone: '+1 555-0199',
    company: 'Test Corp LLC',
    budget: '$5k - $10k',
    type: 'BUDGET_CONTACT',
    description: 'This is a test message to verify the automated Google Sheets append and checkbox formatting functionality.'
  };

  try {
    const result = await appendInquiry(testInquiry);
    console.log('\nSUCCESS! Row appended to Google Sheet.');
    console.log('API Response Details:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\nERROR: Google Sheets integration test failed!');
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
  }
}

runTest();
