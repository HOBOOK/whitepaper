import { getComments, setComments } from '../../../../lib/docComments'
import { assertOwnerOrAdmin } from '../../../../lib/auth'
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { extractDocId } from '../../../../lib/docId'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const explicitId = q?.docId && String(q.docId)

  const p = event.context.params?.slug
  const slug = Array.isArray(p) ? p.join('/') : String(p||'')
  let key = explicitId || slug
  if(!explicitId){
    try{ const raw = await fs.readFile(resolve(process.cwd(),'content','whitepaper',`${slug}.md`),'utf8'); key = extractDocId(raw) || slug } catch {}
  }

  const cid = event.context.params?.cid
  const list = await getComments(key)
  const idx = list.findIndex(x => x.id === cid)
  if(idx===-1) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  assertOwnerOrAdmin(list[idx]?.creatorIp, event)
  const next = list.filter(x => x.id !== cid)
  await setComments(key, next)
  return { ok: true }
})
