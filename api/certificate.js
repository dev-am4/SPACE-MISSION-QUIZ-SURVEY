const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yrxnrjyelqyxsdvzcrjy.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function json(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.end(JSON.stringify(payload))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { error: 'method_not_allowed' })
  }

  if (!SERVICE_ROLE_KEY) {
    return json(res, 503, { error: 'supabase_not_configured' })
  }

  const certificateId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id
  if (!certificateId || String(certificateId).length > 120) {
    return json(res, 400, { error: 'invalid_certificate_id' })
  }

  const encodedId = encodeURIComponent(String(certificateId))
  const select = 'certificate_id,participant_name,knowledge_score,knowledge_total,finished_at,created_at'

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/quiz_sessions?certificate_id=eq.${encodedId}&select=${select}&limit=1`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          Accept: 'application/json',
        },
      },
    )

    if (!response.ok) {
      const detail = await response.text()
      console.error('Supabase certificate lookup failed', response.status, detail)
      return json(res, 502, { error: 'supabase_read_failed' })
    }

    const rows = await response.json()
    if (!rows?.length) return json(res, 404, { error: 'certificate_not_found' })

    return json(res, 200, rows[0])
  } catch (error) {
    console.error('Supabase certificate lookup exception', error)
    return json(res, 502, { error: 'supabase_unreachable' })
  }
}
