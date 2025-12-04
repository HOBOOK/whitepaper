import { promises as fs } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { assertAdmin } from '../../lib/auth'
import { readAll as readDocCommentsAll, writeAll as writeDocCommentsAll } from '../../lib/docComments'
import { setAlias } from '../../lib/aliases'

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const body = await readBody(event)
  const from = typeof body?.from === 'string' ? body.from.trim().replace(/^\/+|\/+$/g,'') : ''
  const toFolder = typeof body?.toFolder === 'string' ? body.toFolder.trim().replace(/^\/+|\/+$/g,'') : ''

  if(!from){
    throw createError({ statusCode: 400, statusMessage: 'Missing from path' })
  }
  // prevent moving folder into itself or its descendant
  if(toFolder && (toFolder === from || toFolder.startsWith(from + '/'))){
    throw createError({ statusCode: 400, statusMessage: 'Invalid target (self/descendant)' })
  }

  const src = resolve(process.cwd(), 'content', 'whitepaper', from)
  const seg = from.split('/').pop()
  const destRel = toFolder ? `${toFolder}/${seg}` : seg
  const dest = resolve(process.cwd(), 'content', 'whitepaper', destRel)

  // Ensure destination directory exists
  await fs.mkdir(dirname(dest), { recursive: true })

  // Prevent overwrite
  try {
    await fs.access(dest)
    throw createError({ statusCode: 409, statusMessage: 'Destination exists' })
  } catch {}

  await fs.rename(src, dest)

  // Record alias for the folder path
  try{ await setAlias(from, destRel) } catch {}

  // Move versions subtree if exists
  try {
    const VROOT = resolve(process.cwd(), 'server', 'data', 'versions')
    const srcV = resolve(VROOT, from)
    const dstV = resolve(VROOT, destRel)
    await fs.mkdir(dirname(dstV), { recursive: true })
    await fs.rename(srcV, dstV)
  } catch {}

  // Migrate comments keys within this folder subtree
  try {
    const all = await readDocCommentsAll()
    const updated = {}
    let changed = false
    for(const [k, v] of Object.entries(all)){
      if(k === from || k.startsWith(from + '/')){
        const newKey = destRel + k.slice(from.length)
        updated[newKey] = v
        changed = true
      } else {
        updated[k] = v
      }
    }
    if(changed){ await writeDocCommentsAll(updated) }
  } catch {}

  return { ok: true, to: destRel }
})
