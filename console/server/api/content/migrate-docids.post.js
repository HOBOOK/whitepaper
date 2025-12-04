import { promises as fs } from 'node:fs'
import { resolve, relative } from 'node:path'
import { assertAdmin } from '../../lib/auth'
import { ensureDocIdInRaw, extractDocId } from '../../lib/docId'
import { readAll as readCommentsAll, writeAll as writeCommentsAll } from '../../lib/docComments'

const CONTENT_ROOT = resolve(process.cwd(), 'content', 'whitepaper')
const VERSIONS_ROOT = resolve(process.cwd(), 'server', 'data', 'versions')

async function walkMarkdown(dir){
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for(const e of entries){
    const p = resolve(dir, e.name)
    if(e.isDirectory()) out.push(...await walkMarkdown(p))
    else if(e.isFile() && e.name.toLowerCase().endsWith('.md')) out.push(p)
  }
  return out
}

async function ensureDocIdOnFile(absPath){
  const raw = await fs.readFile(absPath, 'utf8')
  const ensured = ensureDocIdInRaw(raw)
  if(ensured.raw !== raw){ await fs.writeFile(absPath, ensured.raw, 'utf8') }
  return ensured.id
}

function slugFromAbs(abs){
  const rel = relative(CONTENT_ROOT, abs).replace(/\\/g,'/')
  return rel.replace(/\.md$/i,'')
}

async function migrateVersionsFor(slug, docId){
  const candidates = Array.from(new Set([slug, (slug.split('/').pop()||'')])).filter(k => k && k !== docId)
  const dst = resolve(VERSIONS_ROOT, docId)
  await fs.mkdir(dst, { recursive: true })
  let moved = 0
  for(const key of candidates){
    const src = resolve(VERSIONS_ROOT, key)
    try{
      const files = await fs.readdir(src)
      for(const name of files){
        if(!name.endsWith('.md')) continue
        const s = resolve(src, name)
        const d = resolve(dst, name)
        try{ await fs.access(d); /* exists -> skip */ } catch { await fs.rename(s, d); moved++ }
      }
      // try remove source dir if empty
      try{ const rest = await fs.readdir(src); if(rest.length === 0) await fs.rmdir(src) } catch {}
    }catch{}
  }
  return moved
}

function mergeUniqueById(a = [], b = []){
  const seen = new Set(a.map(x => x.id))
  const out = a.slice()
  for(const c of b){ if(!seen.has(c.id)){ seen.add(c.id); out.push(c) } }
  return out
}

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const summary = { files: 0, docIdsAdded: 0, commentsMigrated: 0, versionsMoved: 0 }

  // gather files
  const files = await walkMarkdown(CONTENT_ROOT)
  let commentsAll = await readCommentsAll()

  for(const abs of files){
    summary.files++
    const slug = slugFromAbs(abs)

    // ensure docId
    const before = await fs.readFile(abs, 'utf8')
    const ensured = ensureDocIdInRaw(before)
    if(ensured.raw !== before){ await fs.writeFile(abs, ensured.raw, 'utf8'); summary.docIdsAdded++ }
    const docId = extractDocId(ensured.raw) || slug

    // migrate comments: from legacy keys to docId
    const base = (slug.split('/').pop() || '')
    const enc = slug.split('/').map(encodeURIComponent).join('/')
    const cand = Array.from(new Set([
      slug, base, enc, slug + '.md', base + '.md', 'whitepaper/' + slug, '/whitepaper/' + slug
    ]))
    let changed = false
    let target = Array.isArray(commentsAll[docId]) ? commentsAll[docId] : []
    for(const k of cand){
      if(k !== docId && Array.isArray(commentsAll[k]) && commentsAll[k].length){
        target = mergeUniqueById(target, commentsAll[k])
        delete commentsAll[k]
        changed = true
      }
    }
    if(changed){ commentsAll[docId] = target; summary.commentsMigrated += target.length }

    // migrate versions buckets to docId
    summary.versionsMoved += await migrateVersionsFor(slug, docId)
  }

  await writeCommentsAll(commentsAll)
  return { ok: true, summary }
})
