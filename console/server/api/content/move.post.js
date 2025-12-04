import { promises as fs } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { assertAdmin } from '../../lib/auth'
import { readAll as readDocCommentsAll, writeAll as writeDocCommentsAll } from '../../lib/docComments'
import { setAlias } from '../../lib/aliases'
import { ensureDocIdInRaw } from '../../lib/docId'

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const body = await readBody(event)
  const from = typeof body?.from === 'string' ? body.from.trim().replace(/^\/+|\/+$/g,'') : ''
  const toFolder = typeof body?.toFolder === 'string' ? body.toFolder.trim().replace(/^\/+|\/+$/g,'') : ''
  const newSlug = body?.newSlug && String(body.newSlug).trim().replace(/\/+|\.+/g,'')

  if(!from){
    throw createError({ statusCode: 400, statusMessage: 'Missing from path' })
  }

  const src = resolve(process.cwd(), 'content', 'whitepaper', `${from}.md`)
  const fileName = (newSlug && newSlug.length) ? newSlug : from.split('/').pop()
  const destRel = toFolder ? `${toFolder}/${fileName}` : `${fileName}`
  const dest = resolve(process.cwd(), 'content', 'whitepaper', `${destRel}.md`)

  // Ensure destination directory exists
  await fs.mkdir(dirname(dest), { recursive: true })

  // Prevent overwrite
  try { await fs.access(dest); throw createError({ statusCode: 409, statusMessage: 'Destination exists' }) } catch {}

  await fs.rename(src, dest)

  // Record alias for future lookups
  try{ await setAlias(from, destRel) } catch {}

  // Ensure docId on destination file
  let docId = ''
  try{
    const raw = await fs.readFile(dest, 'utf8')
    const ensured = ensureDocIdInRaw(raw)
    docId = ensured.id
    if(ensured.raw !== raw){ await fs.writeFile(dest, ensured.raw, 'utf8') }
  } catch {}

  // Move versions directory if exists
  try {
    const VROOT = resolve(process.cwd(), 'server', 'data', 'versions')
    const srcV = resolve(VROOT, from)
    const dstV = resolve(VROOT, docId || destRel)
    await fs.mkdir(dirname(dstV), { recursive: true })
    await fs.rename(srcV, dstV)
  } catch {}

  // Migrate comments: from old/new slug keys into docId (preferred) or new slug
  try {
    const all = await readDocCommentsAll()
    const srcKey = from
    const newKey = destRel
    const targetKey = docId || destRel
    let changed = false
    const collect = (key) => (Array.isArray(all[key]) ? all[key] : [])
    const merged = [...collect(targetKey)]
    const pushUnique = (arr) => {
      const existing = new Set(merged.map(x => x.id))
      for(const c of arr){ if(c && !existing.has(c.id)){ existing.add(c.id); merged.push(c) } }
    }
    if(all[srcKey]){ pushUnique(all[srcKey]); delete all[srcKey]; changed = true }
    if(all[newKey]){ pushUnique(all[newKey]); delete all[newKey]; changed = true }
    if(changed){ all[targetKey] = merged; await writeDocCommentsAll(all) }
  } catch {}

  return { ok: true, to: destRel }
})
