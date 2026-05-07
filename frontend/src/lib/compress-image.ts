import imageCompression from 'browser-image-compression'

export interface CompressOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  /** 0-1, défaut 0.85 */
  initialQuality?: number
}

/**
 * Compresse et redimensionne une image dans le navigateur avant upload.
 * Conserve le mime type d'origine si possible (sinon JPEG).
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1280,
    initialQuality = 0.85,
  } = options

  try {
    return await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      initialQuality,
      useWebWorker: true,
    })
  } catch (err) {
    console.error('Image compression failed, falling back to original:', err)
    return file
  }
}
