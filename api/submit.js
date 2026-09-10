const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yrxnrjyelqyxsdvzcrjy.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function json(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.end(JSON.stringify(payload))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { error: 'method_not_allowed' })
  }

  if (!SERVICE_ROLE_KEY) {
    return json(res, 503, { error: 'supabase_not_configured' })
  }

  const session = req.body
  if (!session || typeof session !== 'object') {
    return json(res, 400, { error: 'invalid_payload' })
  }

  const required = ['id', 'certificate_id', 'participant_name', 'knowledge_score', 'finished_at', 'answers']
  const missing = required.filter((key) => session[key] === undefined || session[key] === null || session[key] === '')
  if (missing.length) {
    return json(res, 400, { error: 'missing_fields', fields: missing })
  }

  const payload = {
    id: String(session.id).slice(0, 120),
    certificate_id: String(session.certificate_id).slice(0, 120),
    participant_name: String(session.participant_name).slice(0, 120),
    knowledge_score: Number(session.knowledge_score) || 0,
    knowledge_total: Number(session.knowledge_total) || 20,
    started_at: session.started_at || null,
    confirmed_at: session.confirmed_at || null,
    finished_at: session.finished_at,
    answers: Array.isArray(session.answers) ? session.answers : [],
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/quiz_sessions?on_conflict=certificate_id`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('Supabase submit failed', response.status, detail)
      return json(res, 502, { error: 'supabase_write_failed' })
    }

    const rows = await response.json().catch(() => [])
    return json(res, 200, {
      ok: true,
      certificate_id: rows?.[0]?.certificate_id || payload.certificate_id,
    })
  } catch (error) {
    console.error('Supabase submit exception', error)
    return json(res, 502, { error: 'supabase_unreachable' })
  }
}
