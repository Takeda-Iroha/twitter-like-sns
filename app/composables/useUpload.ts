// app/composables/useUpload.ts
export const useUpload = () => {
  const BASE_URL = 'https://apg-joetsu.tail02904.ts.net/api'

  const uploadImage = async (file: File): Promise<string> => {
    const token = useCookie('accessToken').value
    if (!token) throw new Error('ログインが必要です')

    const formData = new FormData()
    formData.append('image', file)

    const response = await $fetch<{ data: { imageUrl: string } }>(
      `${BASE_URL}/upload`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      }
    )

    return response.data.imageUrl
  }

  return { uploadImage }
}