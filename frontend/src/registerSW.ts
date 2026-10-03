import { registerSW } from 'virtual:pwa-register'

registerSW({
  onRegistered() {
    console.log('PWA registrada correctamente')
  },

  onRegisterError(error: unknown) {
    console.error('Error al registrar la PWA:', error)
  }
})