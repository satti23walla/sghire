import { supabase } from './supabase'

export async function notify({ userId, type, title, body, link, recipientEmail }) {
  // In-app notification
  const { error: dbErr } = await supabase.from('notifications').insert({
    user_id: userId, type, title,
    body: body || null,
    link: link || null,
  })
  if (dbErr) console.error('Notification insert error:', dbErr.message)

  // Email via Supabase Edge Function (skips silently if not set up)
  if (recipientEmail) {
    try {
      console.log('Sending email to:', recipientEmail)
      const { data, error: fnErr } = await supabase.functions.invoke('send-notification-email', {
        body: {
          to: recipientEmail,
          subject: title,
          html: '<p>' + title + '</p>' + (body ? '<p>' + body + '</p>' : '') +
                (link ? '<a href="https://www.hireitright.com' + link + '">View →</a>' : ''),
        },
      })
      if (fnErr) console.error('Edge function error:', fnErr.message)
      else console.log('Email sent:', data)
    } catch (e) {
      console.log('Email skipped:', e.message)
    }
  }
}
