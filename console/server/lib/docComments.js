import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'

const DATA_DIR = resolve(process.cwd(), 'server', 'data')
const FILE = resolve(DATA_DIR, 'doc-comments.json')

async function ensure(){
  await fs.mkdir(DATA_DIR, { recursive: true })
  try{ await fs.stat(FILE) } catch{ await fs.writeFile(FILE, '{}', 'utf8') }
}

export async function readAll(){ await ensure(); return JSON.parse(await fs.readFile(FILE,'utf8')) }
export async function writeAll(obj){ await ensure(); await fs.writeFile(FILE, JSON.stringify(obj,null,2),'utf8') }

export async function getComments(slug){
  const all = await readAll()
  return Array.isArray(all[slug]) ? all[slug] : []
}

export async function setComments(slug, list){
  const all = await readAll()
  all[slug] = list
  await writeAll(all)
}
