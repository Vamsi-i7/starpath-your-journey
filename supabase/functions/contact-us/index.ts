import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/corsHeaders.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'clawzer96@gmail.com';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'StarPath <noreply@starpath.app>';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message, userId } = await req.json();

    // Validate input
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare email content
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .info-box {
      background: white;
      padding: 15px;
      margin: 10px 0;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .label {
      font-weight: bold;
      color: #667eea;
      margin-bottom: 5px;
    }
    .message-box {
      background: white;
      padding: 20px;
      margin: 15px 0;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📧 New Contact Form Submission</h1>
    <p>StarPath Support</p>
  </div>
  <div class="content">
    <div class="info-box">
      <div class="label">From:</div>
      <div>${name}</div>
    </div>
    
    <div class="info-box">
      <div class="label">Email:</div>
      <div><a href="mailto:${email}">${email}</a></div>
    </div>
    
    ${userId ? `
    <div class="info-box">
      <div class="label">User ID:</div>
      <div>${userId}</div>
    </div>
    ` : ''}
    
    <div class="info-box">
      <div class="label">Subject:</div>
      <div>${subject}</div>
    </div>
    
    <div class="message-box">
      <div class="label">Message:</div>
      <div>${message.replace(/\n/g, '<br>')}</div>
    </div>
  </div>
  <div class="footer">
    <p>Received: ${new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'long'
    })}</p>
    <p>This is an automated message from StarPath contact form.</p>
  </div>
</body>
</html>
    `.trim();

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Store submission in database
    const { data: submission, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        user_id: userId || null,
        name,
        email,
        subject,
        message,
        status: 'new',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store contact submission');
    }

    console.log('Contact form stored in database:', submission.id);

    // Send email via Resend if API key is configured
    if (RESEND_API_KEY) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: [ADMIN_EMAIL],
            reply_to: email,
            subject: `📧 Contact Form: ${subject}`,
            html: emailContent,
          }),
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
          console.error('Resend API error:', emailResult);
          // Don't throw error - we still want to return success since DB storage worked
          console.warn('Email sending failed, but submission was stored in database');
        } else {
          console.log('Email sent successfully:', emailResult.id);
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Continue - submission is already in database
      }
    } else {
      console.warn('RESEND_API_KEY not configured - skipping email notification');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Contact form submitted successfully. We\'ll get back to you soon!',
        submissionId: submission.id,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
