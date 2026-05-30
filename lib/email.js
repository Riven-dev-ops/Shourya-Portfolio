export async function sendEmail({ to, subject, text, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('--- EMAIL NOTIFICATION BYPASSED (RESEND_API_KEY MISSING) ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log('--------------------------------------------------------------');
    return true;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: to,
        subject: subject,
        text: text,
        html: html || text.replace(/\n/g, '<br>')
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log('Email successfully sent via Resend:', data.id);
      return true;
    } else {
      const errData = await res.json();
      console.error('Resend API failure:', errData);
      return false;
    }
  } catch (error) {
    console.error('Email send failure via Resend:', error);
    return false;
  }
}
