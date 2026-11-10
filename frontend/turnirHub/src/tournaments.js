export const STATUS_LABELS = {
  DRAFT: 'Osnutek',
  REGISTRATION_OPEN: 'Prijave odprte',
  REGISTRATION_CLOSED: 'Prijave zaprte',
  IN_PROGRESS: 'V teku',
  FINISHED: 'Zaključen',
  CANCELLED: 'Preklican',
}

export const FORMAT_LABELS = {
  ROUND_ROBIN: 'Liga (vsak z vsakim)',
  SINGLE_ELIMINATION: 'Izločanje',
}

const pad = (n) => String(n).padStart(2, '0')

// ISO čas iz API-ja -> vrednost za <input type="datetime-local"> (lokalni čas)
export function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Vrednost iz <input type="datetime-local"> -> ISO čas za API
export function fromLocalInput(value) {
  return value ? new Date(value).toISOString() : ''
}

export function formatDate(isoDate) {
  const [y, m, d] = isoDate.split('-')
  return `${Number(d)}. ${Number(m)}. ${y}`
}

export const REGISTRATION_LABELS = {
  PENDING: 'Čaka na potrditev',
  APPROVED: 'Potrjena',
  REJECTED: 'Zavrnjena',
  WAITLISTED: 'Na čakalni listi',
}
