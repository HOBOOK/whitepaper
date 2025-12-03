import { readPosts } from '../../../lib/db'
export default defineEventHandler(async (event) => {
  const { id } = event.context.params
  const list = await readPosts()
  const post = list.find(p => p.id === id)
  if(!post) throw createError({ statusCode:404, statusMessage:'not found' })
  return { post }
})
