import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'

const DATA_DIR = resolve(process.cwd(), 'server', 'data')
const POSTS_FILE = resolve(DATA_DIR, 'posts.json')
const CATS_FILE = resolve(DATA_DIR, 'categories.json')

async function ensure(){
  await fs.mkdir(DATA_DIR, { recursive: true })
  try{ await fs.stat(POSTS_FILE) } catch{ await fs.writeFile(POSTS_FILE, '[]', 'utf8') }
  try{ await fs.stat(CATS_FILE) } catch{ await fs.writeFile(CATS_FILE, '[]', 'utf8') }
}

export async function readPosts(){ await ensure(); return JSON.parse(await fs.readFile(POSTS_FILE,'utf8')) }
export async function writePosts(list){ await ensure(); await fs.writeFile(POSTS_FILE, JSON.stringify(list,null,2),'utf8') }
export async function readCats(){ await ensure(); return JSON.parse(await fs.readFile(CATS_FILE,'utf8')) }
export async function writeCats(list){ await ensure(); await fs.writeFile(CATS_FILE, JSON.stringify(list,null,2),'utf8') }
