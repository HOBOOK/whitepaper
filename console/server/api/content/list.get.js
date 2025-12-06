import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'

async function walkDocs(dir, prefix = '') {
  const docs = []
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      
      const fullPath = resolve(dir, entry.name)
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name
      
      if (entry.isDirectory()) {
        const subDocs = await walkDocs(fullPath, relPath)
        docs.push(...subDocs)
      } else if (entry.name.endsWith('.md')) {
        try {
          const content = await fs.readFile(fullPath, 'utf8')
          let title = ''
          let position = 999
          
          if (content.startsWith('---')) {
            const endIdx = content.indexOf('---', 3)
            if (endIdx > 0) {
              const frontmatter = content.substring(3, endIdx)
              const titleMatch = frontmatter.match(/title\s*:\s*['"]?([^'\n]+)['"]?/)
              const posMatch = frontmatter.match(/position\s*:\s*(\d+)/)
              if (titleMatch) title = titleMatch[1].trim()
              if (posMatch) position = parseInt(posMatch[1])
            }
          }
          
          const path = relPath.replace(/\.md$/, '')
          const folder = path.split('/').slice(0, -1).join('/') || ''
          
          docs.push({
            path,
            title,
            position,
            folder
          })
        } catch (e) {
          console.error(`Error reading ${fullPath}:`, e.message)
        }
      }
    }
  } catch (e) {
    console.error(`Error walking ${dir}:`, e.message)
  }
  return docs
}

export default defineEventHandler(async () => {
  const whitepaperDir = resolve(process.cwd(), 'content', 'whitepaper')
  const docs = await walkDocs(whitepaperDir)
  return { docs }
})
