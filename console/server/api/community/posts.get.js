import { readPosts } from '../../lib/db'
export default defineEventHandler(async (event) => {
  const { q, page='1', pageSize='10', sort='updated', order='desc' } = getQuery(event)
  const list = await readPosts()
  let filtered = list
  if(q){ const t = String(q).toLowerCase(); filtered = filtered.filter(p => (p.title||'').toLowerCase().includes(t) || (p.body||'').toLowerCase().includes(t)) }
  filtered.sort((a,b) => {
    const dir = String(order).toLowerCase()==='asc' ? 1 : -1
    if(sort==='title') return ((a.title||'').localeCompare(b.title||''))*dir
    if(sort==='created') return ((a.created||0)-(b.created||0))*dir
    return ((a.updated||0)-(b.updated||0))*dir
  })
  const p = Math.max(1, parseInt(String(page),10)||1)
  const ps = Math.max(1, Math.min(100, parseInt(String(pageSize),10)||10))
  const start = (p-1)*ps
  const end = start + ps
  const total = filtered.length
  const items = filtered.slice(start, end)
  return { posts: items, total, page: p, pageSize: ps }
})
