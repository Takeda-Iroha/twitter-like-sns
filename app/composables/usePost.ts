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
  visibility: 'public' | 'followers' | 'private'
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

// Reply型はPost型と同じ構造なので型エイリアスにする
export type Reply = Post

export interface TimelineResponse {
  data: Post[]
  meta: {
    pagination: {
      nextCursor: string | null
      hasMore: boolean
    }
  }
}

interface CreatePostRequest {
  content: string
  visibility: 'public' | 'followers' | 'private'
  replyToId?: string
  imageUrls?: string[]
}

interface CreatePostResponse {
  data: Post
}

interface LikeResponse {
  data: { likeCount: number }
}

interface PostDetailResponse {
  data: Post
}

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

interface RepliesResponse {
  data: Reply[]
  meta: {
    pagination: {
      nextCursor: string | null
      hasMore: boolean
    }
  }
}

// 投稿編集レスポンスの型
interface UpdatePostResponse {
  data: {
    id: string
    userId: string
    content: string
    visibility: 'public' | 'followers' | 'private'
    replyToId: string | null
    createdAt: string
    updatedAt: string
    isEdited: boolean
  }
}

const BASE_URL = 'https://apg-joetsu.tail02904.ts.net/api'

export const usePost = () => {

  // 公開タイムライン取得
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

  // ホームタイムライン取得
  const fetchHomeTimeline = async (
    cursor?: string,
    limit = 20
  ): Promise<TimelineResponse> => {
    const params = new URLSearchParams()
    if (cursor) params.append('cursor', cursor)
    params.append('limit', String(limit))

    const token = useCookie('accessToken').value
    if (!token) throw new Error('ログインが必要です')

    const response = await $fetch<TimelineResponse>(
      `${BASE_URL}/messages/timeline?${params.toString()}`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
    return response
  }

  // ----------------------------------------
  // 投稿作成・リプライ作成
  // 通常の投稿：replyToId を渡さない
  // リプライ：replyToId に親投稿のIDを渡す
  // ----------------------------------------
  const createPost = async (params: CreatePostRequest): Promise<CreatePostResponse> => {
    const token = useCookie('accessToken').value
    if (!token) throw new Error('ログインが必要です')

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

  // いいね
  const addLike = async (postId: string): Promise<number> => {
    const token = useCookie('accessToken').value
    if (!token) throw new Error('ログインが必要です')

    const response = await $fetch<LikeResponse>(
      `${BASE_URL}/messages/${postId}/like`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
    return response.data.likeCount
  }

  // いいね取り消し
  const removeLike = async (postId: string): Promise<number> => {
    const token = useCookie('accessToken').value
    if (!token) throw new Error('ログインが必要です')

    const response = await $fetch<LikeResponse>(
      `${BASE_URL}/messages/${postId}/like`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
    return response.data.likeCount
  }

  // 投稿詳細取得
  const fetchPostDetail = async (postId: string): Promise<Post> => {
    const token = useCookie('accessToken').value

    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await $fetch<PostDetailResponse>(
      `${BASE_URL}/messages/${postId}`,
      { method: 'GET', headers }
    )
    return response.data
  }

  // 引用リツイート作成
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


  // リプライ一覧取得
  const fetchReplies = async (postId: string): Promise<Reply[]> => {
    const token = useCookie('accessToken').value

    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await $fetch<RepliesResponse>(
      `${BASE_URL}/messages/${postId}/replies`,
      { method: 'GET', headers }
    )
    return response.data
  }

  // 投稿編集
const updatePost = async (
  postId: string,
  content: string,
  visibility: 'public' | 'followers' | 'private'
): Promise<void> => {
  const token = useCookie('accessToken').value
  if (!token) throw new Error('ログインが必要です')

  await $fetch<UpdatePostResponse>(
    `${BASE_URL}/messages/${postId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: { content, visibility }
    }
  )
}

// 投稿削除
const deletePost = async (postId: string): Promise<void> => {
  const token = useCookie('accessToken').value
  if (!token) throw new Error('ログインが必要です')

  await $fetch(
    `${BASE_URL}/messages/${postId}`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  )
}

  return {
    fetchPublicTimeline,
    fetchHomeTimeline,
    createPost,
    addLike,
    removeLike,
    fetchPostDetail,
    createQuote,
    deleteQuote,
    fetchReplies
    ,updatePost,
    deletePost
  }
}