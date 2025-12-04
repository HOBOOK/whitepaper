import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { getVersion, listVersions } from '../../../lib/versions'
import { assertAdmin } from '../../../lib/auth'
import { resolveCanonical } from '../../../lib/aliases'
import { extractDocId } from '../../../lib/docId'

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const body = await readBody(event)
  const slug = body?.slug
  const id = body?.id
  if(!slug || !id){ throw createError({ statusCode: 400, statusMessage: 'Invalid payload' }) }

  const keys = []
  try{ const cur = await fs.readFile(resolve(process.cwd(),'content','whitepaper',`${slug}.md`),'utf8'); const d = extractDocId(cur); if(d) keys.push(d) } catch {}
  const canonical = await resolveCanonical(slug); if(!keys.includes(canonical)) keys.push(canonical)
  if(!keys.includes(slug)) keys.push(slug)
  const base = (String(slug).split('/').pop() || ''); if(base && !keys.includes(base)) keys.push(base)

  let raw
  for(const k of keys){ try{ raw = await getVersion(k, id); break } catch {} }
  if(!raw) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const filePath = resolve(process.cwd(), 'content', 'whitepaper', `${slug}.md`)
  await fs.writeFile(filePath, raw, 'utf8')
  return { ok: true }
})
