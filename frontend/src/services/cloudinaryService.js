// src/services/cloudinaryService.js
//
// Variables requeridas en .env:
//   VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
//   VITE_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset
//
// El Upload Preset debe estar configurado como "Unsigned" en:
//   Cloudinary Dashboard → Settings → Upload → Upload presets

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/**
 * Sube un archivo (File) a Cloudinary y devuelve la URL segura.
 *
 * @param {File} file  - El objeto File a subir (imagen, pdf, etc.)
 * @param {string} [folder='tickets'] - Carpeta destino en Cloudinary
 * @returns {Promise<string>} URL segura (https) del recurso subido
 */
export async function uploadToCloudinary(file, folder = 'tickets') {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Faltan variables de entorno: VITE_CLOUDINARY_CLOUD_NAME y/o VITE_CLOUDINARY_UPLOAD_PRESET'
    )
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Error al subir la imagen a Cloudinary')
  }

  const result = await response.json()
  return result.secure_url
}
