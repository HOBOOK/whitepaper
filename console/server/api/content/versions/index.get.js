import { listVersions } from '../../../lib/versions'
import { resolveCanonical, setAlias } from '../../../lib/aliases'
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { extractDocId } from '../../../lib/docId'

export default defineEventHandler(async (event) => {
  const { slug } = getQuery(event)
  if(!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

  // Try docId from current file first
  try{
    const filePath = resolve(process.cwd(), 'content', 'whitepaper', `${slug}.md`)
    const raw = await fs.readFile(filePath, 'utf8')
    const docId = extractDocId(raw)
    if(docId){
      const items = await listVersions(docId)
      return { items }
    }
  }catch{};

  // Fallback to canonical/slug/base merge
  const canonical = await resolveCanonical(slug)
  const base = (String(slug).split('/').pop() || '')
  const buckets = new Map()
  async function addBucket(key){ if(!key || buckets.has(key)) return; try{ const items = await listVersions(key); buckets.set(key, items || []) }catch{ buckets.set(key, []) } }
  await addBucket(canonical); if(canonical !== slug) await addBucket(slug); if(base && base !== slug && base !== canonical) await addBucket(base)
  const merged = []; const seen = new Set(); for(const arr of buckets.values()){ for(const it of arr){ if(!seen.has(it.id)){ seen.add(it.id); merged.push(it) } } }
  merged.sort((a,b) => (b.mtime||0) - (a.mtime||0))
  if((buckets.get(canonical)?.length || 0) === 0 && (buckets.get(base)?.length || 0) > 0){ try{ await setAlias(base, canonical) } catch {} }
  return { items: merged }
})
