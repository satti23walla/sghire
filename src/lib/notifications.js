import { supabase } from './supabase'

export async function notify({ userId, type, title, body, link, recipientEmail }) {
  // In-app notification
  const { error: dbErr } = await supabase.from('notifications').insert({
    user_id: userId, type, title,
    body: body || null,
    link: link || null,
  })
  if (dbErr) console.error('Notification insert error:', dbErr.message)

  // Email via Supabase Edge Function
  if (recipientEmail) {
    try {
      console.log('Sending email to:', recipientEmail)
      const { data, error: fnErr } = await supabase.functions.invoke('send-notification-email', {
        body: { to: recipientEmail, subject: title, html: `<p>${title}</p>${body ? `<p>${body}</p>` : ''}` },
      })
      if (fnErr) console.error('Edge function error:', fnErr.message)
      else console.log('Email sent:', data)
    } catch (e) {
      console.log('Email skipped:', e.message)
    }
  }
}

  // Email via Supabase Edge Function (Phase 2 — skips silently if not set up)
  if (recipientEmail) {
    try {
      await supabase.functions.invoke('send-notification-email', {
        body: {
          to: recipientEmail,
          subject: title,
          html: `
            <div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:24px">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
                <div style="width:32px;height:32px;background:#1D9E75;border-radius:8px"></div>
                <span style="font-weight:600;font-size:16px">SG Hire Insight</span>
              </div>
              <h2 style="font-size:18px;font-weight:500;margin-bottom:8px;color:#1a1a1a">${title}</h2>
              ${body ? `<p style="color:#555;line-height:1.6;margin-bottom:16px">${body}</p>` : ''}
              ${link ? `<a href="https://sghire.vercel.app${link}" style="display:inline-block;background:#1D9E75;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:500">View →</a>` : ''}
              <hr style="margin:24px 0;border:none;border-top:1px solid #e0e0dc">
              <p style="font-size:12px;color:#aaa">Singapore's hiring transparency platform · <a href="https://sghire.vercel.app" style="color:#aaa">sghire.vercel.app</a></p>
            </div>
          `,
        },
      })
    } catch (e) {
      // Email not set up yet — silently skip
    }
  }
}
