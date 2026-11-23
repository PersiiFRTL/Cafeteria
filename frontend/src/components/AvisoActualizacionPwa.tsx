import { useEffect, useState } from 'react'
import { aplicarActualizacionPwa, EVENTO_ACTUALIZACION_PWA } from '../registerSW'

export function AvisoActualizacionPwa() {
  const [disponible, setDisponible] = useState(false)
  const [actualizando, setActualizando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const mostrarAviso = () => setDisponible(true)
    window.addEventListener(EVENTO_ACTUALIZACION_PWA, mostrarAviso)
    return () => window.removeEventListener(EVENTO_ACTUALIZACION_PWA, mostrarAviso)
  }, [])

  if (!disponible) return null

  const actualizar = async () => {
    setActualizando(true)
    setError('')

    try {
      await aplicarActualizacionPwa()
    } catch {
      setError('No se pudo aplicar la actualización. Intentá nuevamente.')
      setActualizando(false)
    }
  }

  return (
    <aside className="pwa-update-banner" role="status" aria-live="polite">
      <div className="pwa-update-copy">
        <strong>Nueva versión disponible</strong>
        <p>Actualizá la aplicación para usar las últimas mejoras.</p>
        {error && <span className="pwa-update-error" role="alert">{error}</span>}
      </div>
      <div className="pwa-update-actions">
        <button
          className="secondary-button"
          type="button"
          disabled={actualizando}
          onClick={() => setDisponible(false)}
        >
          Más tarde
        </button>
        <button
          className="primary-button"
          type="button"
          disabled={actualizando}
          onClick={() => void actualizar()}
        >
          {actualizando ? 'Actualizando…' : 'Actualizar ahora'}
        </button>
      </div>
    </aside>
  )
}
