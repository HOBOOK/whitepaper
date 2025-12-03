import { readCats } from '../../lib/db'
export default defineEventHandler(async () => {
  const cats = await readCats()
  return { cats }
})
