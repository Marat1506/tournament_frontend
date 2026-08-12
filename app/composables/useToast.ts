export type ToastType = 'success' | 'error' | 'info'

export type ToastItem = {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

export function useToast() {
  function remove(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function show(message: string, type: ToastType = 'info', durationMs = 4500) {
    if (!import.meta.client) return
    const id = ++nextId
    toasts.value.push({ id, message, type })
    window.setTimeout(() => remove(id), durationMs)
  }

  function success(message: string) {
    show(message, 'success')
  }

  function error(message: string) {
    show(message, 'error', 6500)
  }

  function info(message: string) {
    show(message, 'info')
  }

  return { toasts, show, success, error, info, remove }
}
