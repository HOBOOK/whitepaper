import { getClientIp } from '../lib/auth'
import { getComments, setComments } from '../lib/docComments'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const docId = body?.docId && String(body.docId)
  const text = (body?.text||'').trim()
  if(!docId || !text){ throw createError({ statusCode: 400, statusMessage: 'Invalid payload' }) }
  const ip = getClientIp(event)
  const list = await getComments(docId)
  const now = Date.now()
  const id = Math.random().toString(36).slice(2)
  const comment = { id, text, created: now, author: body?.author||'', creatorIp: ip }
  await setComments(docId, [...(Array.isArray(list)?list:[]), comment])
  return { ok: true, comment }
})
