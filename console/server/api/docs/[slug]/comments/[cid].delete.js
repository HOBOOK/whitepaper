import { getComments, setComments } from '../../../../lib/docComments'
import { assertOwnerOrAdmin } from '../../../../lib/auth'

export default defineEventHandler(async (event) => {
  const { slug, cid } = event.context.params
  const list = await getComments(slug)
  const idx = list.findIndex(x => x.id === cid)
  if(idx === -1) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertOwnerOrAdmin(list[idx]?.creatorIp, event)
  list.splice(idx,1)
  await setComments(slug, list)
  return { ok: true }
})
