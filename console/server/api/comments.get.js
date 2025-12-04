import { getComments } from '../lib/docComments'

export default defineEventHandler(async (event) => {
  const { docId } = getQuery(event)
  if(!docId || typeof docId !== 'string'){
    throw createError({ statusCode: 400, statusMessage: 'Missing docId' })
  }
  const list = await getComments(docId)
  return { comments: Array.isArray(list) ? list : [] }
})
