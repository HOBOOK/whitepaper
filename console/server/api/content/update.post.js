import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { saveVersion } from '../../lib/versions'
import { extractDocId } from '../../lib/docId'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const path = body?.path || body?.slug
  const raw = body?.raw
  if(!path || typeof raw !== 'string'){
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }
  const filePath = resolve(process.cwd(), 'content', 'whitepaper', `${path}.md`)

  // Validate docId presence and immutability
  const incomingDocId = extractDocId(raw)
  if(!incomingDocId){
    throw createError({ statusCode: 400, statusMessage: 'Missing docId in front matter' })
  }
  try{
    const prevRaw = await fs.readFile(filePath, 'utf8')
    const prevDocId = extractDocId(prevRaw)
    if(prevDocId && prevDocId !== incomingDocId){
      throw createError({ statusCode: 400, statusMessage: 'docId cannot be changed' })
    }
  }catch{/* new file or unreadable; allow if docId present */}

  // Snapshot previous if changed
  try{
    const prev = await fs.readFile(filePath, 'utf8')
    if(prev !== raw){ await saveVersion(path, prev) }
  }catch{ /* first write */ }
  await fs.writeFile(filePath, raw, 'utf8')
  return { ok: true }
})
