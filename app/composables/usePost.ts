// app/composables/usePost.ts

export interface Author {
  id: string
  username: string
  displayName: string
  bio: string
  profileImageUrl: string
  isFollowing: boolean
  followersCount: number
  followingCount: number
}

export interface Post {
  id: string
  userId: string
  content: string
  visibility: 'public' | 'followers'
  replyToId: string | null
  createdAt: string
  updatedAt: string
  isEdited: boolean
  author: Author
  likeCount: number
  replyCount: number
  isLiked: boolean
  viewCount: number
  quoteCount: number
  isQuoted: boolean
  quotedMessage: {
    id: string
    content: string
    author: Author
  } | null
}

export interface TimelineResponse {
  data: Post[]
  meta: {
    pagination: {
      nextCursor: string | null
      hasMore: boolean
    }
  }
}

const BASE_URL = 'https://apg-joetsu.tail02904.ts.net/api'

export const usePost = () => {

  const fetchPublicTimeline = async (
    cursor?: string,
    limit = 20
  ): Promise<TimelineResponse> => {
    const params = new URLSearchParams()
    if (cursor) params.append('cursor', cursor)
    params.append('limit', String(limit))

    const response = await $fetch<TimelineResponse>(
      `${BASE_URL}/messages/public?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${useCookie('accessToken').value}`
        }
      }
    )
    return response
  }

  const fetchHomeTimeline = async (
    cursor?: string,
    limit = 20
  ): Promise<TimelineResponse> => {
    const params = new URLSearchParams()
    if (cursor) params.append('cursor', cursor)
    params.append('limit', String(limit))

    const token = useCookie('accessToken').value
    if (!token) {
      throw new Error('ログインが必要です')
    }

    const response = await $fetch<TimelineResponse>(
      `${BASE_URL}/messages/timeline?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    return response
  }

  interface CreatePostRequest {
    content: string
    visibility: 'public' | 'followers'
    replyToId?: string
    imageUrls?: string[]
  }

  interface CreatePostResponse {
    data: Post
  }

  const createPost = async (params: CreatePostRequest): Promise<CreatePostResponse> => {
    const token = useCookie('accessToken').value

    if (!token) {
      throw new Error('ログインが必要です')
    }

    const response = await $fetch<CreatePostResponse>(
      `${BASE_URL}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: params
      }
    )
    return response
  }

  // ----------------------------------------
  // いいねレスポンスの型
  // APIは更新後のlikeCountを返してくる
  // ----------------------------------------
  interface LikeResponse {
    data: {
      likeCount: number
    }
  }

  // ----------------------------------------
  // いいねする
  // postId：いいねする投稿のID
  // ----------------------------------------
  const addLike = async (postId: string): Promise<number> => {
    const token = useCookie('accessToken').value

    if (!token) {
      throw new Error('ログインが必要です')
    }

    const response = await $fetch<LikeResponse>(
      `${BASE_URL}/messages/${postId}/like`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    // 更新後のlikeCountだけ返す
    return response.data.likeCount
  }

  // ----------------------------------------
  // いいねを取り消す
  // URLは同じ・メソッドがDELETEになる
  // ----------------------------------------
  const removeLike = async (postId: string): Promise<number> => {
    const token = useCookie('accessToken').value

    if (!token) {
      throw new Error('ログインが必要です')
    }

    const response = await $fetch<LikeResponse>(
      `${BASE_URL}/messages/${postId}/like`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    return response.data.likeCount
  }

  // 投稿詳細レスポンスの型
interface PostDetailResponse {
  data: Post
}

// 投稿詳細取得
const fetchPostDetail = async (postId: string): Promise<Post> => {
  const token = useCookie('accessToken').value

  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await $fetch<PostDetailResponse>(
    `${BASE_URL}/messages/${postId}`,
    { method: 'GET', headers }
  )
  return response.data
}

// 引用リツイートレスポンスの型
interface QuoteResponse {
  data: {
    id: string
    userId: string
    content: string
    visibility: string
    replyToId: string | null
    createdAt: string
    updatedAt: string
    isEdited: boolean
  }
}

// 引用リツイート作成
// postId：引用する投稿のID
// content：引用コメント（1〜250文字）
const createQuote = async (postId: string, content: string): Promise<void> => {
  const token = useCookie('accessToken').value
  if (!token) throw new Error('ログインが必要です')

  await $fetch<QuoteResponse>(
    `${BASE_URL}/messages/${postId}/quote`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: { content }
    }
  )
}

// 引用リツイート削除
const deleteQuote = async (postId: string): Promise<void> => {
  const token = useCookie('accessToken').value
  if (!token) throw new Error('ログインが必要です')

  await $fetch(
    `${BASE_URL}/messages/${postId}/quote`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  )
}

  return { fetchPublicTimeline, fetchHomeTimeline, createPost, addLike, removeLike, fetchPostDetail, createQuote, deleteQuote }
}