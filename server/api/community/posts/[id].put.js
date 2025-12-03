import { readPosts, writePosts } from '../../../lib/db'
import { assertOwnerOrAdmin, getClientIp } from '../../../lib/auth'
export default defineEventHandler(async (event) => {
  const { id } = event.context.params
  const body = await readBody(event)
  const list = await readPosts()
  const idx = list.findIndex(p => p.id === id)
  if(idx<0) throw createError({ statusCode:404, statusMessage:'not found' })
  assertOwnerOrAdmin(list[idx].creatorIp, event)
  const p = list[idx]
  list[idx] = { ...p, ...body, updated: Date.now(), editorIp: getClientIp(event) }
  await writePosts(list)
  return { ok:true }
})
