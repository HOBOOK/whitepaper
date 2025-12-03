import { serverQueryContent } from '#content/server'

function toText(node){
  if(!node) return ''
  if(Array.isArray(node)) return node.map(toText).join(' ')
  if(node.type === 'text' && node.value) return String(node.value)
  if(node.children) return toText(node.children)
  return ''
}

export default defineEventHandler(async (event) => {
  const { q } = getQuery(event)
  const query = (q || '').toString().trim().toLowerCase()
  if(!query) return { hits: [] }

  const docs = await serverQueryContent(event, 'whitepaper')
    .only(['title','description','_path','body'])
    .find()

  const hits = []
  for(const d of docs){
    const text = [d.title || '', d.description || '', toText(d.body)].join('\n').toLowerCase()
    if(text.includes(query)){
      hits.push({ title: d.title, description: d.description, _path: d._path })
    }
  }

  return { hits }
})
