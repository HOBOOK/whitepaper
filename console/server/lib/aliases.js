import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'

const DATA_DIR = resolve(process.cwd(), 'server', 'data')
const FILE = resolve(DATA_DIR, 'slug-aliases.json')

async function ensure(){
  await fs.mkdir(DATA_DIR, { recursive: true })
  try{ await fs.stat(FILE) } catch{ await fs.writeFile(FILE, '{}', 'utf8') }
}

export async function readAliases(){ await ensure(); return JSON.parse(await fs.readFile(FILE,'utf8')) }
export async function writeAliases(obj){ await ensure(); await fs.writeFile(FILE, JSON.stringify(obj,null,2),'utf8') }

export async function setAlias(from, to){
  if(!from || !to || from === to) return
  const map = await readAliases()
  map[from] = to
  // compress chains: if any value points to `from`, update to point to `to`
  for(const [k,v] of Object.entries(map)){
    if(v === from){ map[k] = to }
  }
  await writeAliases(map)
}

export async function resolveCanonical(slug){
  const map = await readAliases()
  let cur = String(slug||'')
  const seen = new Set()
  for(let i=0;i<50;i++){
    if(seen.has(cur)) break
    seen.add(cur)
    if(map[cur]){ cur = map[cur]; continue }
    // prefix match (folder moves) - choose longest matching key
    let bestKey = ''
    for(const k of Object.keys(map)){
      if(cur === k || cur.startsWith(k + '/')){
        if(k.length > bestKey.length){ bestKey = k }
      }
    }
    if(bestKey){
      const to = map[bestKey]
      cur = to + cur.slice(bestKey.length)
      continue
    }
    break
  }
  return cur
}
