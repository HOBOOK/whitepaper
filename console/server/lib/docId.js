import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

function parseFrontMatter(raw){
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if(!m) return { fm: '', body: raw, has: false }
  return { fm: m[1] || '', body: raw.slice(m[0].length), has: true, header: m[0] }
}

function extractDocIdFromFm(fm){
  const m = fm.match(/(^|\n)docId\s*:\s*([^\n\r#]+)/)
  return m ? String(m[2]).trim() : ''
}

function ensureDocIdInRaw(raw, prefer){
  const nl = /\r\n/.test(raw) ? '\r\n' : '\n'
  const { fm, body, has } = parseFrontMatter(raw)
  const existing = extractDocIdFromFm(fm)
  const id = existing || String(prefer || randomUUID())
  if(existing){ return { id, raw } }
  if(has){
    const fmNew = fm ? (fm.endsWith(nl) ? fm + `docId: ${id}` : fm + `${nl}docId: ${id}`) : `docId: ${id}`
    const head = `---${nl}${fmNew}${nl}---${nl}`
    return { id, raw: head + body }
  }else{
    const head = `---${nl}docId: ${id}${nl}---${nl}`
    return { id, raw: head + raw }
  }
}

async function ensureDocIdForPath(slug){
  const filePath = resolve(process.cwd(), 'content', 'whitepaper', `${slug}.md`)
  const raw = await fs.readFile(filePath, 'utf8')
  const before = raw
  const { id, raw: withId } = ensureDocIdInRaw(raw)
  if(withId !== before){ await fs.writeFile(filePath, withId, 'utf8') }
  return id
}

function extractDocId(raw){
  const { fm } = parseFrontMatter(raw)
  return extractDocIdFromFm(fm)
}

export { ensureDocIdInRaw, ensureDocIdForPath, extractDocId }
