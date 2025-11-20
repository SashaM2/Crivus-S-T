export const getCompletionTone = (value: number) => {
    if (value >= 70) return { text: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-600' }
    if (value >= 40) return { text: 'text-amber-600', chip: 'bg-amber-50 text-amber-700' }
    return { text: 'text-rose-600', chip: 'bg-rose-50 text-rose-600' }
}

export const getDropoffTone = (value: number) => {
    if (value <= 25) return { text: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-600' }
    if (value <= 50) return { text: 'text-amber-600', chip: 'bg-amber-50 text-amber-700' }
    return { text: 'text-rose-600', chip: 'bg-rose-50 text-rose-600' }
}

export const getLeadTone = (value: number) => getCompletionTone(value)

export const getCompletionLabel = (value: number) => {
    if (value >= 70) return 'Bom'
    if (value >= 40) return 'Ajustar'
    return 'Crítico'
}

export const getDropoffLabel = (value: number) => {
    if (value <= 25) return 'Bom'
    if (value <= 50) return 'Ajustar'
    return 'Crítico'
}
