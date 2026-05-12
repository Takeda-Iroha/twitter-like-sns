// app/composables/useUser.ts

const BASE_URL = 'https://apg-joetsu.tail02904.ts.net/api'

// ----------------------------------------
// 型定義
// ----------------------------------------

// プロフィール情報の型
// 自分・他人どちらも同じAPIで取得するので型は1つ
export interface UserProfile {
  id: string
  username: string
  displayName: string | null
  bio: string | null
  profileImageUrl: string | null
  isFollowing: boolean
  followersCount: number   // フォロワー数
  followingCount: number   // フォロー中数
}

interface UserProfileResponse {
  data: UserProfile
}

// プロフィール更新リクエストの型
interface UpdateProfileRequest {
  displayName?: string
  bio?: string
  profileImageUrl?: string
}

interface UpdateProfileResponse {
  data: UserProfile
}

// ユーザー投稿一覧の型
export interface UserPost {
  id: string
  userId: string
  content: string
  visibility: 'public' | 'followers'
  replyToId: string | null
  createdAt: string
  updatedAt: string
  isEdited: boolean
  author: {
    id: string
    username: string
    displayName: string | null
    bio: string | null
    profileImageUrl: string | null
    isFollowing: boolean
    followersCount: number
    followingCount: number
  }
  likeCount: number
  replyCount: number
  isLiked: boolean
  viewCount: number
  quoteCount: number
  isQuoted: boolean
  quotedMessage: {
    id: string
    content: string
    author: {
      id: string
      username: string
      displayName: string | null
      profileImageUrl: string | null
    }
  } | null
}

interface UserPostsResponse {
  data: {
    messages: UserPost[]
    nextCursor: string | null
    hasMore: boolean
  }
}

// ----------------------------------------
// useUser関数
// ----------------------------------------
export const useUser = () => {

  // ----------------------------------------
  // ユーザープロフィール取得
  // 自分・他人どちらも /api/users/{userId} で取得する
  // ----------------------------------------
  const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
    const token = useCookie('accessToken').value

    // トークンがあればヘッダーに付ける・なくてもOK
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await $fetch<UserProfileResponse>(
      `${BASE_URL}/users/${userId}`,
      { method: 'GET', headers }
    )
    return response.data
  }

  // ----------------------------------------
  // プロフィール更新
  // PATCHメソッド：指定した項目だけ上書きする
  // ----------------------------------------
  const updateProfile = async (params: UpdateProfileRequest): Promise<UserProfile> => {
    const token = useCookie('accessToken').value

    if (!token) {
      throw new Error('ログインが必要です')
    }

    const response = await $fetch<UpdateProfileResponse>(
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

  // ----------------------------------------
  // ユーザーの投稿一覧取得
  // userId：誰の投稿を取得するか
  // ----------------------------------------
  const fetchUserPosts = async (
    username: string,
    cursor?: string,
    limit = 20
  ): Promise<{ posts: UserPost[], nextCursor: string | null, hasMore: boolean }> => {
    const token = useCookie('accessToken').value

    if (!token) {
      throw new Error('ログインが必要です')
    }

    const params = new URLSearchParams()
    if (cursor) params.append('cursor', cursor)
    params.append('limit', String(limit))

    const response = await $fetch<UserPostsResponse>(
      `${BASE_URL}/users/${username}/messages?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    return {
      posts: response.data.messages,
      nextCursor: response.data.nextCursor,
      hasMore: response.data.hasMore
    }
  }

  // フォロー申請レスポンスの型
interface FollowRequestResponse {
  data: {
    id: number
    followerId: string
    followingId: string
    status: 'pending' | 'approved' | 'rejected'
    createdAt: string
    updatedAt: string
  }
}

// フォロー申請
// targetUserId：フォローしたいユーザーのID
const requestFollow = async (targetUserId: string): Promise<FollowRequestResponse> => {
  const token = useCookie('accessToken').value
  if (!token) throw new Error('ログインが必要です')

  const response = await $fetch<FollowRequestResponse>(
    `${BASE_URL}/follows/${targetUserId}`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  )
  return response
}

// フォロー解除
const unfollowUser = async (targetUserId: string): Promise<void> => {
  const token = useCookie('accessToken').value
  if (!token) throw new Error('ログインが必要です')

  await $fetch(
    `${BASE_URL}/follows/${targetUserId}`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  )
}

  return { fetchUserProfile, updateProfile, fetchUserPosts, requestFollow, unfollowUser }
}