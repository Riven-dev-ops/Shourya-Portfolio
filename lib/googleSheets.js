import { google } from 'googleapis';

/**
 * Helper to retry a promise-returning function with exponential backoff.
 */
async function callWithRetry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(`Google Sheets API failed. Retrying in ${delay}ms... Error:`, error.message);
    await new Promise(resolve => setTimeout(resolve, delay));
    return callWithRetry(fn, retries - 1, delay * 2);
  }
}

/**
 * Authenticate and get Sheets client.
 */
function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;

  let auth;
  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } catch (err) {
      throw new Error(`Failed to parse GOOGLE_SERVICE_ACCOUNT_CREDENTIALS JSON: ${err.message}`);
    }
  } else if (email && privateKey) {
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  } else {
    throw new Error(
      'Missing Google Service Account credentials. Set GOOGLE_SERVICE_ACCOUNT_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.'
    );
  }

  return google.sheets({ version: 'v4', auth });
}

/**
 * Formats columns I-P (checkboxes) of a specific row in the sheet.
 */
async function formatCheckboxes(sheets, spreadsheetId, rowIndex) {
  // Dynamically lookup the GID (sheetId) of the first sheet
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId ?? 0;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          setDataValidation: {
            range: {
              sheetId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: 8, // Column I (0-indexed)
              endColumnIndex: 16,  // Column P (0-indexed, exclusive)
            },
            rule: {
              condition: {
                type: 'BOOLEAN',
              },
              showCustomUi: true,
            },
          },
        },
      ],
    },
  });
}

/**
 * Appends a new inquiry as a row to the Google Sheet.
 * @param {Object} inquiry The inquiry data
 * @returns {Promise<Object>} Sheets API response data
 */
export async function appendInquiry(inquiry) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is not configured in environment variables.');
  }

  const sheets = getSheetsClient();

  const dateStr = inquiry.createdAt 
    ? new Date(inquiry.createdAt).toLocaleString('en-US') 
    : new Date().toLocaleString('en-US');

  const rowValues = [
    dateStr,
    inquiry.name || '',
    inquiry.email || '',
    inquiry.phone || '',
    inquiry.company || 'N/A',
    inquiry.budget || 'Not Specified',
    inquiry.type || 'QUOTE',
    inquiry.description || inquiry.message || '',
    'FALSE', // Contacted
    'FALSE', // Meeting Scheduled
    'FALSE', // Proposal Sent
    'FALSE', // Contract Signed
    'FALSE', // Project Started
    'FALSE', // Project Completed
    'FALSE', // Payment Received
    'FALSE'  // Follow Up Required
  ];

  const appendFn = () => sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A:P', // Autodetect first sheet range
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [rowValues],
    },
  });

  // Call Sheets API append with retry logic
  const response = await callWithRetry(appendFn);

  // Set checkbox data validation format for the new row columns I-P
  try {
    const updatedRange = response.data.updates?.updatedRange;
    if (updatedRange) {
      // Matches the starting row from the range, e.g., Sheet1!A12:P12
      const match = updatedRange.match(/!A(\d+):P\d+/);
      if (match) {
        const rowIndex = parseInt(match[1]) - 1; // 0-indexed row
        await formatCheckboxes(sheets, spreadsheetId, rowIndex);
      }
    }
  } catch (err) {
    console.error('Failed to format checkboxes in Google Sheet:', err.message);
    // Graceful fallback: do not fail the main call if only checkbox formatting fails
  }

  return response.data;
}
