import { getComments, setComments } from '../../../lib/docComments'
import { getClientIp } from '../../../lib/auth'

export default defineEventHandler(async (event) => {
  const { slug } = event.context.params
  const body = await readBody(event)
  const text = (body?.text || '').toString().trim()
  if(!text) throw createError({ statusCode: 400, statusMessage: 'Empty' })
  const ip = getClientIp(event)
  const list = await getComments(slug)
  const now = Date.now()
  const item = { id: String(now), text, author: 'anonymous', created: now, creatorIp: ip }
  list.push(item)
  await setComments(slug, list)
  return { comment: item }
})
