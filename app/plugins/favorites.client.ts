export default defineNuxtPlugin(() => {
  useFavoritesStore().load()
})
