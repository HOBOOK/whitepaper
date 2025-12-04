import { getComments, setComments } from '../../../lib/docComments'
import { readAll as readAllComments, writeAll as writeAllComments } from '../../../lib/docComments'
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { extractDocId, ensureDocIdInRaw } from '../../../lib/docId'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const explicitId = q?.docId && String(q.docId)
  if(explicitId){
    const list = await getComments(explicitId)
    return { comments: Array.isArray(list) ? list : [] }
  }

  const p = event.context.params?.slug
  const slugRaw = Array.isArray(p) ? p.join('/') : String(p||'')
  const slugFs = slugRaw.split('/').map(s => { try{ return decodeURIComponent(s) } catch{ return s } }).join('/')

  let docId = ''
  try{
    const filePath = resolve(process.cwd(), 'content', 'whitepaper', `${slugFs}.md`)
    let raw = await fs.readFile(filePath, 'utf8')
    let id = extractDocId(raw) || ''
    if(!id){
      const ensured = ensureDocIdInRaw(raw)
      if(ensured.raw !== raw){ await fs.writeFile(filePath, ensured.raw, 'utf8') }
      id = ensured.id
    }
    docId = id
  }catch{};

  const key = docId || slugFs

  // Try current key
  let list = await getComments(key)
  if(list && list.length){ return { comments: list } }

  // If docId exists, migrate from legacy keys into docId
  if(docId){
    try{
      const all = await readAllComments()
      const base = (slugFs.split('/').pop() || '')
      const enc = slugFs.split('/').map(encodeURIComponent).join('/')
      const candidates = Array.from(new Set([
        slugFs, slugRaw, base, enc, slugFs + '.md', base + '.md', 'whitepaper/' + slugFs, '/whitepaper/' + slugFs
      ]))
      for(const k of candidates){
        if(Array.isArray(all[k]) && all[k].length){
          const moved = all[k]
          all[docId] = moved
          delete all[k]
          await writeAllComments(all)
          return { comments: moved }
        }
      }
    }catch{};
  }

  return { comments: [] }
})
