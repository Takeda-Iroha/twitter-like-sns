<!-- app/pages/notifications.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotification } from '~/composables/useNotification'
import type { Notification } from '~/composables/useNotification'

const isMenuOpen = ref(false)
const { fetchNotifications, markAllAsRead, approveFollow, rejectFollow } = useNotification()

const notifications = ref<Notification[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const newNotificationIds = ref<number[]>([])
const followActionStatus = ref<Record<number, string | null>>({})

// タブ管理
const activeTab = ref<'all' | 'unread'>('all')

const getNotificationText = (type: Notification['type'], actorName: string): string => {
  const name = actorName || '誰か'
  switch (type) {
    case 'follow_request':  return `${name} さんからフォローリクエストが届きました`
    case 'follow_approved': return `${name} さんがフォローリクエストを承認しました`
    case 'like':            return `${name} さんがあなたの投稿にいいねしました`
    case 'reply':           return `${name} さんがあなたの投稿に返信しました`
    case 'quote':           return `${name} さんがあなたの投稿を引用しました`
    case 'follow':          return `${name} さんがあなたをフォローしました`
    case 'mention':         return `${name} さんがあなたをメンションしました`
    default:                return `${name} さんから通知があります`
  }
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${d} ${h}:${min}`
}

// ----------------------------------------
// 通知一覧取得
// unreadOnly：trueのときは未読のみ取得
// ----------------------------------------
const loadNotifications = async (unreadOnly = false) => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetchNotifications(undefined, 20, unreadOnly)

    // actorがない通知もそのまま表示する
    // （actorがない場合はグレーの丸・「誰か」と表示）
    notifications.value = response.data

    // 初回取得時のみ新規通知IDを記録して全既読にする
    if (newNotificationIds.value.length === 0) {
      newNotificationIds.value = response.data
        .filter(n => !n.isRead)
        .map(n => n.id)

      await markAllAsRead()
    }

  } catch (error: any) {
    if (error.status === 401) {
      navigateTo('/login')
    } else {
      errorMessage.value = '通知を読み込めませんでした'
    }
  } finally {
    isLoading.value = false
  }
}

// タブ切り替え
const switchTab = (tab: 'all' | 'unread') => {
  activeTab.value = tab
  notifications.value = []
  loadNotifications(tab === 'unread')
}

const handleApprove = async (notification: Notification) => {
  followActionStatus.value[notification.id] = 'approving'
  try {

    // ↓↓↓ 一時的に追加 ↓↓↓
    console.log('承認するactorId:', notification.actorId)
    // ↑↑↑ ここまで ↑↑↑

    await approveFollow(notification.actorId)
    const target = notifications.value.find(n => n.id === notification.id)
    if (target) target.type = 'follow_approved'
  } catch (error: any) {

    // ↓↓↓ 一時的に追加 ↓↓↓
    console.log('エラー詳細:', error)
    console.log('ステータス:', error.status)
    // ↑↑↑ ここまで ↑↑↑

    alert('承認に失敗しました')
  } finally {
    followActionStatus.value[notification.id] = null
  }
}

const handleReject = async (notification: Notification) => {
  followActionStatus.value[notification.id] = 'rejecting'
  try {
    await rejectFollow(notification.actorId)
    notifications.value = notifications.value.filter(n => n.id !== notification.id)
  } catch (error: any) {
    alert('拒否に失敗しました')
  } finally {
    followActionStatus.value[notification.id] = null
  }
}

const goToActorProfile = (username: string) => {
  navigateTo(`/users/${username}`)
}

onMounted(() => {
  loadNotifications()
})
</script>

<template>
  <div class="notifications-page">

    <AppHeader @open-menu="isMenuOpen = true" />
    <AppSideMenu :is-open="isMenuOpen" @close="isMenuOpen = false" />

    <main class="main-content">
      <h2 class="page-title">通知</h2>

      <!-- タブ切り替え -->
      <div class="tab-bar">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'all' }"
          @click="switchTab('all')"
        >
          すべて
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'unread' }"
          @click="switchTab('unread')"
        >
          未読のみ
        </button>
      </div>

      <p v-if="isLoading" class="status-text">読み込み中...</p>
      <p v-else-if="errorMessage" class="status-text error">{{ errorMessage }}</p>
      <p v-else-if="notifications.length === 0" class="status-text">
        {{ activeTab === 'unread' ? '未読の通知はありません' : '通知はありません' }}
      </p>

      <template v-else>
        <article
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-card"
          :class="{ 'is-new': newNotificationIds.includes(notification.id) }"
        >
          <!-- actorがある場合はクリックでプロフィールへ遷移 -->
          <div
            class="actor-icon-wrapper"
            @click="notification.actor ? goToActorProfile(notification.actor.username) : null"
          >
            <img
              v-if="notification.actor?.profileImageUrl"
              :src="notification.actor.profileImageUrl"
              class="actor-icon"
              alt="ユーザーアイコン"
            />
            <!-- actorがない・画像がない場合はグレーの丸 -->
            <div v-else class="actor-icon actor-icon--empty" />
          </div>

          <div class="notification-body">
            <p class="notification-text">
              <!-- actor?.displayName は「actorがあればdisplayNameを使う」という意味 -->
              {{ getNotificationText(notification.type, notification.actor?.displayName || notification.actor?.username || '') }}
            </p>
            <p class="notification-date">{{ formatDate(notification.createdAt) }}</p>

            <div
              v-if="notification.type === 'follow_request'"
              class="follow-actions"
            >
              <button
                class="approve-btn"
                :disabled="!!followActionStatus[notification.id]"
                @click="handleApprove(notification)"
              >
                {{ followActionStatus[notification.id] === 'approving' ? '承認中...' : '承認する' }}
              </button>
              <button
                class="reject-btn"
                :disabled="!!followActionStatus[notification.id]"
                @click="handleReject(notification)"
              >
                {{ followActionStatus[notification.id] === 'rejecting' ? '拒否中...' : '拒否する' }}
              </button>
            </div>

            <p v-if="notification.type === 'follow_approved'" class="approved-label">
              ✅ 承認済み
            </p>
          </div>
        </article>
      </template>
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  font-family: "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;
}
</style>

<style scoped>
.main-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 15px 80px;
  background-color: #fff;
  min-height: 100vh;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  padding: 20px 0 10px;
  margin: 0;
  border-bottom: 1px solid #eee;
}

/* タブ */
.tab-bar {
  display: flex;
  border-bottom: 1px solid #ddd;
  position: sticky;
  top: 60px;
  background: #fff;
  z-index: 9;
}
.tab-button {
  flex: 1;
  padding: 14px 0;
  background: none;
  border: none;
  font-size: 14px;
  color: #999;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.tab-button.active {
  color: #6a21aa;
  border-bottom: 2px solid #6a21aa;
  font-weight: bold;
}

.status-text {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 30px 0;
}
.status-text.error { color: #f66; }

.notification-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #eee;
}

.notification-card.is-new {
  background-color: #fdf0ff;
  margin: 0 -15px;
  padding: 16px 15px;
}

.actor-icon-wrapper {
  flex-shrink: 0;
  cursor: pointer;
}
.actor-icon {
  width: 48px; height: 48px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}
.actor-icon--empty { background-color: #ddd; }
.actor-icon-wrapper:hover .actor-icon { opacity: 0.8; }

.notification-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notification-text {
  margin: 0;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.notification-date {
  margin: 0;
  font-size: 12px;
  color: #aaa;
}

.follow-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.approve-btn {
  background-color: #c65bed;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
}
.approve-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.reject-btn {
  background: none;
  border: 1px solid #ccc;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  color: #666;
}
.reject-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.approved-label {
  margin: 4px 0 0;
  font-size: 13px;
  color: #888;
}
</style>