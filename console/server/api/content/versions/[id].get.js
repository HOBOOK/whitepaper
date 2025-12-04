import { getVersion } from '../../../lib/versions'

export default defineEventHandler(async (event) => {
  const { slug } = getQuery(event)
  const id = event.context?.params?.id
  if(!slug || !id) throw createError({ statusCode: 400, statusMessage: 'Missing params' })
  try{
    const raw = await getVersion(slug, id)
    return { raw }
  }catch{
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
})
