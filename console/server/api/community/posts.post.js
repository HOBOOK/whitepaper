import { readPosts, writePosts } from '../../lib/db'
import { getClientIp } from '../../lib/auth'
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, body:content, author } = body || {}
  if(!title || !content) throw createError({ statusCode:400, statusMessage:'title and body required' })
  const list = await readPosts()
  const id = Date.now().toString(36)
  list.push({ id, title, body: content, author: author||'anonymous', created: Date.now(), updated: Date.now(), creatorIp: getClientIp(event), comments: [] })
  await writePosts(list)
  return { ok:true, id }
})
