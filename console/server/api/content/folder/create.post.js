import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { assertAdmin } from '../../../lib/auth'

function safeSeg(name){
  const n = String(name || '').trim()
  if(!n) return ''
  // remove slashes and control chars, keep unicode letters/numbers/dashes/spaces
  return n.replace(/[\\/\n\r\t]/g,'').replace(/^\.+|\.+$/g,'')
}

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const body = await readBody(event)
  const parent = typeof body?.parent === 'string' ? body.parent.trim().replace(/^\/+|\/+$/g,'') : ''
  const name = safeSeg(body?.name)
  if(!name) throw createError({ statusCode: 400, statusMessage: 'Invalid folder name' })

  const base = resolve(process.cwd(), 'content', 'whitepaper')
  const dir = resolve(base, parent ? `${parent}/${name}` : name)

  // ensure not exists
  try { await fs.access(dir); throw createError({ statusCode: 409, statusMessage: 'Folder exists' }) } catch {}

  await fs.mkdir(dir, { recursive: true })
  // create placeholder page to make folder visible in nav
  const placeholder = resolve(dir, 'untitled.md')
  const fm = `---\ntitle: Untitled\nposition: 999\n---\n\n`;
  await fs.writeFile(placeholder, fm, 'utf8')

  return { ok: true, folder: (parent ? `${parent}/` : '') + name, page: (parent ? `${parent}/` : '') + name + '/untitled' }
})
