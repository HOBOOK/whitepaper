import { listVersions } from '../../../lib/versions'

export default defineEventHandler(async (event) => {
  const { slug } = getQuery(event)
  if(!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  const items = await listVersions(slug)
  return { items }
})
