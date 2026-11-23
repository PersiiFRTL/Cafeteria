import { registerSW } from 'virtual:pwa-register'

export const EVENTO_ACTUALIZACION_PWA = 'cafeteria:pwa-update-available'

const actualizarServiceWorker = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new Event(EVENTO_ACTUALIZACION_PWA))
  },

  onRegistered() {
    console.log('PWA registrada correctamente')
  },

  onRegisterError(error: unknown) {
    console.error('Error al registrar la PWA:', error)
  }
})

export async function aplicarActualizacionPwa() {
  await actualizarServiceWorker(true)
}
