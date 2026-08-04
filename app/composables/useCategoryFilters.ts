export type CategoryFilterValues = {
  gender: string
  belt: string
  age_group: string
  weight_class: string
}

export function useCategoryFilterOptions() {
  const { t } = useI18n()

  const genderOptions = computed(() => [
    { value: '', label: t('filters.allCategories') },
    { value: 'male', label: t('tournaments.categoryMale') },
    { value: 'female', label: t('tournaments.categoryFemale') },
    { value: 'child', label: t('tournaments.categoryChild') },
    { value: 'masters', label: t('tournaments.categoryMasters') },
  ])

  const beltOptions = computed(() => [
    { value: '', label: t('filters.allBelts') },
    { value: 'white', label: t('belt.white') },
    { value: 'blue', label: t('belt.blue') },
    { value: 'purple', label: t('belt.purple') },
    { value: 'brown', label: t('belt.brown') },
    { value: 'black', label: t('belt.black') },
  ])

  const ageGroupOptions = computed(() => [
    { value: '', label: t('filters.allAges') },
    { value: 'kids', label: t('filters.ageKids') },
    { value: 'juvenile', label: t('filters.ageJuvenile') },
    { value: 'adult', label: t('filters.ageAdult') },
    { value: 'master', label: t('filters.ageMaster') },
  ])

  const weightClassOptions = computed(() => [
    { value: '', label: t('filters.allWeights') },
    { value: 'rooster', label: t('filters.weightRooster') },
    { value: 'light', label: t('filters.weightLight') },
    { value: 'middle', label: t('filters.weightMiddle') },
    { value: 'heavy', label: t('filters.weightHeavy') },
    { value: 'absolute', label: t('filters.weightAbsolute') },
  ])

  function filtersFromRoute(query: Record<string, unknown>): CategoryFilterValues {
    return {
      gender: (query.gender as string) || '',
      belt: (query.belt as string) || '',
      age_group: (query.age_group as string) || '',
      weight_class: (query.weight_class as string) || '',
    }
  }

  function filtersToQuery(filters: CategoryFilterValues): Record<string, string> {
    const q: Record<string, string> = {}
    if (filters.gender) q.gender = filters.gender
    if (filters.belt) q.belt = filters.belt
    if (filters.age_group) q.age_group = filters.age_group
    if (filters.weight_class) q.weight_class = filters.weight_class
    return q
  }

  function activeFilterCount(filters: CategoryFilterValues) {
    return [filters.gender, filters.belt, filters.age_group, filters.weight_class].filter(Boolean).length
  }

  return {
    genderOptions,
    beltOptions,
    ageGroupOptions,
    weightClassOptions,
    filtersFromRoute,
    filtersToQuery,
    activeFilterCount,
  }
}
