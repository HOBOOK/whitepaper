import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'

export default defineEventHandler(async (event) => {
  const { slug } = getQuery(event)
  if(!slug || typeof slug !== 'string'){
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }
  const filePath = resolve(process.cwd(), 'content', 'whitepaper', `${slug}.md`)
  const raw = await fs.readFile(filePath, 'utf8')
  return { raw }
})
