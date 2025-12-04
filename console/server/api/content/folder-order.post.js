import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { assertAdmin } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const body = await readBody(event)
  const folder = typeof body?.folder === 'string' ? body.folder.trim().replace(/^\/+|\/+$/g,'') : ''
  // Accept either `order` (mixed) or legacy `folders`
  const order = Array.isArray(body?.order) ? body.order.filter(s => typeof s === 'string')
               : Array.isArray(body?.folders) ? body.folders.filter(s => typeof s === 'string').map(s => s.endsWith('/') ? s : (s + '/'))
               : null
  if(order === null) throw createError({ statusCode: 400, statusMessage: 'Invalid order' })
  const file = resolve(process.cwd(), 'content', 'whitepaper', folder ? `${folder}/.order.json` : '.order.json')
  await fs.mkdir(resolve(process.cwd(), 'content', 'whitepaper', folder || ''), { recursive: true })
  await fs.writeFile(file, JSON.stringify({ children: order }, null, 2), 'utf8')
  return { ok: true }
})
