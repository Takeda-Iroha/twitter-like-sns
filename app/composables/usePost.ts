// app/composables/usePost.ts

// ----------------------------------------
// 型定義
// APIのレスポンスの形をTypeScriptに教えるためのもの
// exportをつけて他のファイルでも使えるようにする
// ----------------------------------------

// 投稿者情報の型
export interface Author {
  id: string
  username: string        // @johndoe のID部分
  displayName: string     // John Doe の表示名
  bio: string
  profileImageUrl: string
  isFollowing: boolean
  followersCount: number
  followingCount: number
}

// 投稿1件の型
export interface Post {
  id: string
  userId: string
  content: string                    // 投稿本文
  visibility: 'public' | 'followers' // 公開範囲
  replyToId: string | null
  createdAt: string                  // 日時は文字列で返ってくる
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
  } | null                           // 引用なしの場合はnull
}

// APIレスポンス全体の型
export interface TimelineResponse {
  data: Post[]
  meta: {
    pagination: {
      nextCursor: string | null  // 次のページの開始位置
      hasMore: boolean           // まだデータがあるか
    }
  }
}

// ----------------------------------------
// APIのベースURL
// 1箇所にまとめることで変更時に1行直すだけでいい
// ----------------------------------------
const BASE_URL = 'https://apg-joetsu.tail02904.ts.net/api'

// ----------------------------------------
// usePost関数
// fetchPublicTimelineとfetchHomeTimelineを返す
// ----------------------------------------
export const usePost = () => {

  // 公開タイムライン取得
  const fetchPublicTimeline = async (
    cursor?: string,
    limit = 20
  ): Promise<TimelineResponse> => {

    // クエリパラメータを組み立てる
    // 例: ?limit=20 や ?cursor=abc&limit=20 というURLを作る
    const params = new URLSearchParams()
    if (cursor) params.append('cursor', cursor)
    params.append('limit', String(limit))

    const response = await $fetch<TimelineResponse>(
      `${BASE_URL}/messages/public?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          // ※認証実装後にここを修正する
          'Authorization': `Bearer ${useCookie('accessToken').value}`
        }
      }
    )
    return response
  }

  // ホームタイムライン取得
  // 構造は公開タイムラインとほぼ同じ・URLだけ違う
  const fetchHomeTimeline = async (
  cursor?: string,
  limit = 20
): Promise<TimelineResponse> => {

  const params = new URLSearchParams()
  if (cursor) params.append('cursor', cursor)
  params.append('limit', String(limit))

  // ↓↓↓ この3行を追加する ↓↓↓
  const token = useCookie('accessToken').value
  if (!token) {
    throw new Error('ログインが必要です')
  }
  // ↑↑↑ ここまで ↑↑↑

  const response = await $fetch<TimelineResponse>(
    `${BASE_URL}/messages/timeline?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}` // ← useCookie(...).value から token に変える
      }
    }
  )
  return response
}

// ----------------------------------------
// 投稿作成リクエストの型
// ----------------------------------------
interface CreatePostRequest {
  content: string                    // 投稿本文
  visibility: 'public' | 'followers' // 公開範囲
  replyToId?: string                 // リプライ先（任意）
  imageUrls?: string[]               // 画像URLの配列（任意）
}

interface CreatePostResponse {
  data: Post
}

// 投稿作成
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

  return { fetchPublicTimeline, fetchHomeTimeline, createPost }
}