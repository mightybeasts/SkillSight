import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import api from './api'

function safeName(s: string): string {
  return (s || 'resume').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'resume'
}

export async function downloadResumePdf(resumeId: string, title: string) {
  const filename = `${safeName(title)}.pdf`

  if (Platform.OS === 'web') {
    const res = await api.get(`/resumes/${resumeId}/download`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return
  }

  const res = await api.get(`/resumes/${resumeId}/download`, { responseType: 'arraybuffer' })
  const base64 = arrayBufferToBase64(res.data)
  const fileUri = (FileSystem.cacheDirectory || FileSystem.documentDirectory) + filename
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  })
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/pdf',
      dialogTitle: title,
      UTI: 'com.adobe.pdf',
    })
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any)
  }
  if (typeof btoa === 'function') return btoa(binary)
  // Fallback for environments without btoa
  return Buffer.from(binary, 'binary').toString('base64')
}
