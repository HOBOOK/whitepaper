import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const slug = body?.slug
  const raw = body?.raw
  if(!slug || typeof raw !== 'string'){
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }
  const cfg = useRuntimeConfig()
  const headerPass = getHeader(event, 'x-admin-pass')
  if(!cfg.adminPassword || headerPass !== cfg.adminPassword){
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const filePath = resolve(process.cwd(), 'content', 'whitepaper', `${slug}.md`)
  await fs.writeFile(filePath, raw, 'utf8')
  return { ok: true }
})
