export function getClientIp(event){
  const xf = getHeader(event, 'x-forwarded-for')
  if(xf) return xf.split(',')[0].trim()
  // @ts-ignore
  return event?.node?.req?.socket?.remoteAddress || 'unknown'
}

export function isAdmin(event){
  const cfg = useRuntimeConfig()
  const headerPass = getHeader(event, 'x-admin-pass')
  return !!(cfg.adminPassword && headerPass === cfg.adminPassword)
}

export function assertAdmin(event){
  if(!isAdmin(event)){
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

export function assertOwnerOrAdmin(resourceIp, event){
  if(isAdmin(event)) return
  const ip = getClientIp(event)
  if(!resourceIp || resourceIp !== ip){
    throw createError({ statusCode: 401, statusMessage: 'Not allowed' })
  }
}
