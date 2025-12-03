import { readPosts, writePosts } from '../../../../../lib/db'
import { assertOwnerOrAdmin } from '../../../../../lib/auth'
export default defineEventHandler(async (event) => {
  const { id, cid } = event.context.params
  const body = await readBody(event)
  const list = await readPosts()
  const pIdx = list.findIndex(p => p.id === id)
  if(pIdx<0) throw createError({ statusCode:404, statusMessage:'not found' })
  const cIdx = list[pIdx].comments.findIndex(c => c.id === cid)
  if(cIdx<0) throw createError({ statusCode:404, statusMessage:'comment not found' })
  assertOwnerOrAdmin(list[pIdx].comments[cIdx].creatorIp, event)
  list[pIdx].comments[cIdx] = { ...list[pIdx].comments[cIdx], ...body }
  await writePosts(list)
  return { ok:true }
})
