import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { saveVersion } from '../../lib/versions'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const slug = body?.slug
  const raw = body?.raw
  if(!slug || typeof raw !== 'string'){
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }
  const filePath = resolve(process.cwd(), 'content', 'whitepaper', `${slug}.md`)
  // Snapshot previous if changed
  try{
    const prev = await fs.readFile(filePath, 'utf8')
    if(prev !== raw){ await saveVersion(slug, prev) }
  }catch{ /* first write */ }
  await fs.writeFile(filePath, raw, 'utf8')
  return { ok: true }
})
