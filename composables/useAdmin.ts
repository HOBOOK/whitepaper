// @ts-nocheck
export const useAdmin = () => {
  const admin = useState('admin-mode', () => false)
  const token = useState('admin-token', () => '')
  const enable = (t?: string) => { admin.value = true; token.value = t || '' }
  const disable = () => { admin.value = false; token.value = '' }
  return { admin, token, enable, disable }
}
