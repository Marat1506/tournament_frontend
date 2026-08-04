const beltKeys = ['white', 'blue', 'purple', 'brown', 'black'] as const

export function useBeltLabel(belt: MaybeRefOrGetter<string | undefined | null>) {
  const { t } = useI18n()
  return computed(() => {
    const b = toValue(belt)
    if (!b) return ''
    const key = `belt.${b}` as const
    return beltKeys.includes(b as typeof beltKeys[number]) ? t(key) : b
  })
}

export function beltOptions() {
  const { t } = useI18n()
  return beltKeys.map(value => ({
    value,
    label: t(`belt.${value}`),
  }))
}
