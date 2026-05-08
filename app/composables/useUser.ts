// app/composables/useUser.ts

const BASE_URL = 'https://apg-joetsu.tail02904.ts.net/api'

// ----------------------------------------
// 型定義
// ----------------------------------------

// プロフィール情報の型
// APIのレスポンスのdata部分の形
export interface UserProfile {
  id: string
  username: string
  email: string
  displayName: string | null  // 未設定の場合はnull
  bio: string | null
  profileImageUrl: string | null
  createdAt: string
  updatedAt: string
}

// プロフィール取得レスポンスの型
interface UserProfileResponse {
  data: UserProfile
}

// プロフィール更新リクエストの型
// 全部任意（?）なので一部だけ更新することもできる
interface UpdateProfileRequest {
  displayName?: string
  bio?: string
  profileImageUrl?: string
}

// ----------------------------------------
// useUser関数
// ----------------------------------------
export const useUser = () => {

  // 自分のプロフィール取得
  const fetchMyProfile = async (): Promise<UserProfile> => {
    const token = useCookie('accessToken').value

    if (!token) {
      throw new Error('ログインが必要です')
    }

    const response = await $fetch<UserProfileResponse>(
      `${BASE_URL}/users/me`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    // response.data の中身だけ返す
    return response.data
  }

  // プロフィール更新
  // PATCHメソッド：一部だけ更新するときに使うHTTPメソッド
  const updateProfile = async (params: UpdateProfileRequest): Promise<UserProfile> => {
    const token = useCookie('accessToken').value

    if (!token) {
      throw new Error('ログインが必要です')
    }

    const response = await $fetch<UserProfileResponse>(
      `${BASE_URL}/users/me`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: params
      }
    )
    return response.data
  }

  return { fetchMyProfile, updateProfile }
}