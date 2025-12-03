import { readCats, writeCats } from '../../lib/db'
import { assertAdmin } from '../../lib/auth'
export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const body = await readBody(event)
  const { name } = body || {}
  if(!name) throw createError({ statusCode:400, statusMessage:'name required' })
  const cats = await readCats()
  const id = Date.now().toString(36)
  cats.push({ id, name })
  await writeCats(cats)
  return { ok:true, id }
})
