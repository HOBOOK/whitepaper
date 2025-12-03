import { readPosts, writePosts } from '../../../../../lib/db'
import { getClientIp } from '../../../../../lib/auth'
export default defineEventHandler(async (event) => {
  const { id } = event.context.params
  const body = await readBody(event)
  const { text, author } = body || {}
  if(!text) throw createError({ statusCode:400, statusMessage:'text required' })
  const list = await readPosts()
  const idx = list.findIndex(p => p.id === id)
  if(idx<0) throw createError({ statusCode:404, statusMessage:'not found' })
  const c = { id: Date.now().toString(36), text, author: author||'anonymous', created: Date.now(), creatorIp: getClientIp(event) }
  list[idx].comments.push(c)
  list[idx].updated = Date.now()
  await writePosts(list)
  return { ok:true, comment: c }
})
