const BASE_URL = 'https://apg-joetsu.tail02904.ts.net/api'

// ----------------------------------------
// 型定義
// ----------------------------------------

// 通知を送ってきたユーザーの情報
export interface NotificationActor {
  id: string
  username: string
  displayName: string | null
  bio: string | null
  profileImageUrl: string | null
  isFollowing: boolean
  followersCount: number
  followingCount: number
}

// 通知1件の型
export interface Notification {
  id: number
  userId: string
  actorId: string
  // 通知タイプ：何が起きたかを表す
  type: 'follow_request' | 'follow_approved' | 'like' | 'reply' | 'quote' | 'follow' | 'mention'
  targetId: string   // フォロー申請のID or 投稿のID
  isRead: boolean    // 既読かどうか
  createdAt: string
  actor?: NotificationActor  // 通知を送ってきたユーザー
}

// 通知一覧レスポンスの型
interface NotificationListResponse {
  data: Notification[]
  meta: {
    pagination: {
      nextCursor: string | null
      hasMore: boolean
    }
  }
}

// 未読件数レスポンスの型
interface UnreadCountResponse {
  data: {
    count: number
  }
}

// 全既読レスポンスの型
interface ReadAllResponse {
  data: {
    updatedCount: number
  }
}

// フォロー承認・拒否レスポンスの型
interface FollowActionResponse {
  data: {
    id: number
    followerId: string
    followingId: string
    status: 'pending' | 'approved' | 'rejected'
    createdAt: string
    updatedAt: string
  }
}

// ----------------------------------------
// useNotification関数
// ----------------------------------------
export const useNotification = () => {

  // ----------------------------------------
  // 通知一覧取得
  // cursor：次のページの開始位置
  // limit：1回で取得する件数（デフォルト20）
  // unreadOnly：未読のみ取得するか（デフォルトfalse）
  // ----------------------------------------
  const fetchNotifications = async (
    cursor?: string,
    limit = 20,
    unreadOnly = false
  ): Promise<NotificationListResponse> => {
    const token = useCookie('accessToken').value

    if (!token) {
      throw new Error('ログインが必要です')
    }

    const params = new URLSearchParams()
    if (cursor) params.append('cursor', cursor)
    params.append('limit', String(limit))
    if (unreadOnly) params.append('unreadOnly', 'true')

    const response = await $fetch<NotificationListResponse>(
      `${BASE_URL}/notifications?${params.toString()}`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
    return response
  }

  // ----------------------------------------
  // 未読通知件数取得
  // サイドメニューのバッジ表示に使う
  // ----------------------------------------
  const fetchUnreadCount = async (): Promise<number> => {
    const token = useCookie('accessToken').value

    // 未ログインの場合は0を返す（エラーにしない）
    if (!token) return 0

    const response = await $fetch<UnreadCountResponse>(
      `${BASE_URL}/notifications/unread-count`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
    return response.data.count
  }

  // ----------------------------------------
  // 全通知を既読にする
  // 通知一覧ページを開いたときに呼ぶ
  // ----------------------------------------
  const markAllAsRead = async (): Promise<void> => {
    const token = useCookie('accessToken').value

    if (!token) return

    await $fetch<ReadAllResponse>(
      `${BASE_URL}/notifications/read-all`,
      {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
  }

  // ----------------------------------------
  // フォロー承認
  // actorId：フォローリクエストを送ってきたユーザーのID
  // ----------------------------------------
  const approveFollow = async (actorId: string): Promise<FollowActionResponse> => {
    const token = useCookie('accessToken').value

    if (!token) {
      throw new Error('ログインが必要です')
    }

    const response = await $fetch<FollowActionResponse>(
      `${BASE_URL}/follows/${actorId}/approve`,
      {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
    return response
  }

  // ----------------------------------------
  // フォロー拒否
  // actorId：フォローリクエストを送ってきたユーザーのID
  // ----------------------------------------
  const rejectFollow = async (actorId: string): Promise<FollowActionResponse> => {
    const token = useCookie('accessToken').value

    if (!token) {
      throw new Error('ログインが必要です')
    }

    const response = await $fetch<FollowActionResponse>(
      `${BASE_URL}/follows/${actorId}/reject`,
      {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
    return response
  }

  // 承認待ちフォローリクエスト一覧取得
const fetchPendingFollows = async (): Promise<string[]> => {
  const token = useCookie('accessToken').value
  if (!token) throw new Error('ログインが必要です')

  const response = await $fetch<{
    data: Array<{ follower: { id: string } }>
  }>(`${BASE_URL}/follows/pending`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })

  // 承認待ちユーザーのIDだけ配列で返す
  return response.data.map(item => item.follower.id)
}

  return {
    fetchNotifications,
    fetchUnreadCount,
    markAllAsRead,
    fetchPendingFollows,
    approveFollow,
    rejectFollow
  }
}