import { getComments, setComments } from '../../../../lib/docComments'
import { assertOwnerOrAdmin, getClientIp } from '../../../../lib/auth'

export default defineEventHandler(async (event) => {
  const { slug, cid } = event.context.params
  const body = await readBody(event)
  const text = (body?.text || '').toString().trim()
  if(!text) throw createError({ statusCode: 400, statusMessage: 'Empty' })
  const list = await getComments(slug)
  const idx = list.findIndex(x => x.id === cid)
  if(idx === -1) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertOwnerOrAdmin(list[idx]?.creatorIp, event)
  list[idx] = { ...list[idx], text }
  await setComments(slug, list)
  return { ok: true }
})
