import { readPosts, writePosts } from '../../../lib/db'
import { assertOwnerOrAdmin } from '../../../lib/auth'
export default defineEventHandler(async (event) => {
  const { id } = event.context.params
  const list = await readPosts()
  const idx = list.findIndex(p => p.id === id)
  if(idx<0) throw createError({ statusCode:404, statusMessage:'not found' })
  assertOwnerOrAdmin(list[idx].creatorIp, event)
  list.splice(idx,1)
  await writePosts(list)
  return { ok:true }
})
