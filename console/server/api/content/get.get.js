import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const path = (q?.path && String(q.path)) || (q?.slug && String(q.slug))
  if(!path){
    throw createError({ statusCode: 400, statusMessage: 'Missing path' })
  }
  const filePath = resolve(process.cwd(), 'content', 'whitepaper', `${path}.md`)
  const raw = await fs.readFile(filePath, 'utf8')
  return { raw }
})
