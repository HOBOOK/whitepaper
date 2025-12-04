import { getVersion } from '../../../lib/versions'
import { resolveCanonical } from '../../../lib/aliases'
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { extractDocId } from '../../../lib/docId'

export default defineEventHandler(async (event) => {
  const { slug } = getQuery(event)
  const id = event.context?.params?.id
  if(!slug || !id) throw createError({ statusCode: 400, statusMessage: 'Missing params' })

  const keys = []
  try{
    const filePath = resolve(process.cwd(), 'content', 'whitepaper', `${slug}.md`)
    const raw = await fs.readFile(filePath, 'utf8')
    const docId = extractDocId(raw)
    if(docId) keys.push(docId)
  }catch{}
  const canonical = await resolveCanonical(slug)
  if(!keys.includes(canonical)) keys.push(canonical)
  if(!keys.includes(slug)) keys.push(slug)
  const base = (String(slug).split('/').pop() || '')
  if(base && !keys.includes(base)) keys.push(base)

  for(const k of keys){
    try{ const raw = await getVersion(k, id); return { raw } }catch{}
  }
  throw createError({ statusCode: 404, statusMessage: 'Not found' })
})
