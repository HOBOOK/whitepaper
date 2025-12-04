import { getClientIp } from '../../../lib/auth'
import { getComments, setComments } from '../../../lib/docComments'
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { extractDocId, ensureDocIdInRaw } from '../../../lib/docId'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const explicitId = q?.docId && String(q.docId)

  const p = event.context.params?.slug
  const slugRaw = Array.isArray(p) ? p.join('/') : String(p||'')
  const slugFs = slugRaw.split('/').map(s => { try{ return decodeURIComponent(s) } catch{ return s } }).join('/')

  let docId = explicitId || ''
  if(!docId){
    try{
      const filePath = resolve(process.cwd(), 'content', 'whitepaper', `${slugFs}.md`)
      let raw = await fs.readFile(filePath, 'utf8')
      let id = extractDocId(raw)
      if(!id){
        const ensured = ensureDocIdInRaw(raw)
        raw = ensured.raw
        id = ensured.id
        await fs.writeFile(filePath, raw, 'utf8')
      }
      docId = id
    }catch{};
  }

  const body = await readBody(event)
  const text = (body?.text||'').trim()
  if(!text) throw createError({ statusCode: 400, statusMessage: 'Missing text' })
  const ip = getClientIp(event)
  const key = docId || slugFs
  const list = await getComments(key)
  const now = Date.now()
  const id = Math.random().toString(36).slice(2)
  const comment = { id, text, created: now, author: body?.author||'', creatorIp: ip }
  await setComments(key, [...list, comment])
  return { ok: true, comment }
})
