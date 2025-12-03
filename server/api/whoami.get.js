import { getClientIp } from '../lib/auth'
export default defineEventHandler((event) => {
  return { ip: getClientIp(event) }
})
