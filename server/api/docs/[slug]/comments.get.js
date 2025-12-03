import { getComments } from '../../../lib/docComments'

export default defineEventHandler(async (event) => {
  const { slug } = event.context.params
  const comments = await getComments(slug)
  return { comments }
})
