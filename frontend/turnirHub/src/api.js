const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Pomožna funkcija za klice API-ja. Piškotek z JWT se pošilja samodejno (credentials: 'include').
export async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(data?.error || 'Napaka pri komunikaciji s strežnikom')
    error.status = response.status
    error.fields = data?.fields || {}
    throw error
  }

  return data
}
