// app/composables/useAuth.ts

const BASE_URL = 'https://apg-joetsu.tail02904.ts.net/api'

export const useAuth = () => {

  // ログアウト処理
  const logout = async () => {
    const token = useCookie('accessToken').value
    const refreshToken = useCookie('refreshToken').value

    if (!token) {
      throw new Error('ログインが必要です')
    }

    // 204が返ってくるがボディはないので $fetch の型指定はvoid
    await $fetch<void>(
      `${BASE_URL}/auth/logout`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // refreshTokenをボディに含めて送る
        body: { refreshToken: refreshToken ?? '' }
      }
    )

    // ログアウト成功後にCookieを全部削除する
    useCookie('accessToken').value = null
    useCookie('refreshToken').value = null
    useCookie('username').value = null
  }

  return { logout }
}