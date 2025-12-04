import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { assertAdmin } from '../../lib/auth'

function updateFrontMatterPosition(raw, pos){
  const nl = /\r\n/.test(raw) ? '\r\n' : '\n'
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/) // capture fm body
  if(m){
    let fm = m[1]
    if(/(^|\n)position\s*:/.test(fm)){
      fm = fm.replace(/(^|\n)position\s*:\s*.*?(?=\n|$)/, `$1position: ${pos}`)
    }else{
      fm = fm + `${nl}position: ${pos}`
    }
    return `---${nl}${fm}${nl}---${nl}` + raw.slice(m[0].length)
  }else{
    return `---${nl}position: ${pos}${nl}---${nl}` + raw
  }
}

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const body = await readBody(event)
  const order = body?.order
  if(!Array.isArray(order) || !order.every(s => typeof s === 'string')){
    throw createError({ statusCode: 400, statusMessage: 'Invalid order payload' })
  }
  for(let i=0;i<order.length;i++){
    const slug = order[i]
    const filePath = resolve(process.cwd(), 'content', 'whitepaper', `${slug}.md`)
    const raw = await fs.readFile(filePath, 'utf8')
    const updated = updateFrontMatterPosition(raw, i+1)
    await fs.writeFile(filePath, updated, 'utf8')
  }
  return { ok: true }
})
