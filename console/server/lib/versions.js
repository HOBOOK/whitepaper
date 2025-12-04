import { promises as fs } from 'node:fs'
import { resolve, dirname } from 'node:path'

const ROOT = resolve(process.cwd(), 'server', 'data', 'versions')

async function ensureDir(p){ await fs.mkdir(p, { recursive: true }) }

export async function saveVersion(slug, raw){
  const dir = resolve(ROOT, slug)
  await ensureDir(dir)
  const ts = new Date().toISOString().replace(/[:.]/g,'-')
  const file = resolve(dir, `${ts}.md`)
  await fs.writeFile(file, raw, 'utf8')
  return { ok: true, ts }
}

export async function listVersions(slug){
  const dir = resolve(ROOT, slug)
  try{
    const files = await fs.readdir(dir)
    const items = await Promise.all(
      files
        .filter(f => f.endsWith('.md'))
        .map(async (name) => {
          const p = resolve(dir, name)
          const st = await fs.stat(p)
          return { id: name.replace(/\.md$/, ''), name, mtime: st.mtimeMs }
        })
    )
    items.sort((a,b) => (b.mtime||0) - (a.mtime||0))
    return items
  }catch{ return [] }
}

export async function getVersion(slug, id){
  const file = resolve(ROOT, slug, `${id}.md`)
  return await fs.readFile(file, 'utf8')
}
