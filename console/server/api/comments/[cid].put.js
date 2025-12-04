import { getComments, setComments } from '../../lib/docComments'
import { assertOwnerOrAdmin } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  const { docId } = getQuery(event)
  const cid = event.context.params?.cid
  const body = await readBody(event)
  const text = (body?.text||'').trim()
  if(!docId || !cid || !text){ throw createError({ statusCode: 400, statusMessage: 'Invalid payload' }) }
  const list = await getComments(docId)
  const idx = list.findIndex(x => x.id === cid)
  if(idx===-1) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  assertOwnerOrAdmin(list[idx]?.creatorIp, event)
  list[idx] = { ...list[idx], text }
  await setComments(docId, list)
  return { ok: true }
})
