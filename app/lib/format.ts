/** "2026-10-11T…" → "11 octobre 2026" */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })

/** "4:12" → 252 */
export const toSeconds = (at: string) => at.split(':').reduce((acc, p) => acc * 60 + Number(p), 0)
