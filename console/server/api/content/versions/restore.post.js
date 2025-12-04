import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { getVersion } from '../../../lib/versions'
import { assertAdmin } from '../../../lib/auth'

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const body = await readBody(event)
  const slug = body?.slug
  const id = body?.id
  if(!slug || !id){ throw createError({ statusCode: 400, statusMessage: 'Invalid payload' }) }
  const raw = await getVersion(slug, id)
  const filePath = resolve(process.cwd(), 'content', 'whitepaper', `${slug}.md`)
  await fs.writeFile(filePath, raw, 'utf8')
  return { ok: true }
})
