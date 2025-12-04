import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'

async function scan(dir, base, out){
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const hasOrder = entries.find(e => e.isFile() && e.name === '.order.json')
  if(hasOrder){
    try{
      const raw = await fs.readFile(resolve(dir, '.order.json'), 'utf8')
      const json = JSON.parse(raw)
      if(Array.isArray(json.children)) out[base] = json.children.filter(s => typeof s === 'string')
      else if(Array.isArray(json.folders)) out[base] = json.folders.filter(s => typeof s === 'string')
    }catch{}
  }
  for(const e of entries){
    if(e.isDirectory()){
      const nextBase = base ? `${base}/${e.name}` : e.name
      await scan(resolve(dir, e.name), nextBase, out)
    }
  }
}

export default defineEventHandler(async () => {
  const root = resolve(process.cwd(), 'content', 'whitepaper')
  const out = {}
  try{ await scan(root, '', out) }catch{}
  return { orders: out }
})
