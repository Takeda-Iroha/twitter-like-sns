<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUser } from '~/composables/useUser'
import { useAuth } from '~/composables/useAuth'
import { useNotification } from '~/composables/useNotification'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { fetchUserProfile } = useUser()
const { logout } = useAuth()
const { fetchUnreadCount } = useNotification()

const loggedInUsername = useCookie('username')

const displayName = ref('')
const username = ref('')
const profileImageUrl = ref('')
const unreadCount = ref(0)
const showLogoutModal = ref(false)
const isLoggingOut = ref(false)
const logoutError = ref('')

const loadUserInfo = async () => {
  if (!loggedInUsername.value) return
  try {
    const profile = await fetchUserProfile(loggedInUsername.value)
    displayName.value = profile.displayName || profile.username
    username.value = profile.username
    profileImageUrl.value = profile.profileImageUrl ?? ''
  } catch { /* 失敗しても問題なし */ }
}

const loadUnreadCount = async () => {
  if (!loggedInUsername.value) return
  try {
    unreadCount.value = await fetchUnreadCount()
  } catch { /* 失敗しても問題なし */ }
}

const handleLogout = async () => {
  isLoggingOut.value = true
  logoutError.value = ''
  try {
    await logout()
    showLogoutModal.value = false
    navigateTo('/login')
  } catch (error: any) {
    if (error.status === 401) {
      logoutError.value = '認証エラーが発生しました'
    } else {
      logoutError.value = 'ログアウトに失敗しました'
    }
  } finally {
    isLoggingOut.value = false
  }
}

const goTo = (path: string) => {
  emit('close')
  navigateTo(path)
}

onMounted(() => {
  loadUserInfo()
  loadUnreadCount()
})
</script>

<template>
  <aside class="side-menu" :class="{ 'is-open': props.isOpen }">

    <div class="menu-user-info" @click="goTo('/mypage')">
      <div class="menu-user-icon-wrapper">
        <UserAvatar :profile-image-url="profileImageUrl" :size="60" />
      </div>
      <div class="menu-user-text">
        <p class="menu-display-name">{{ loggedInUsername ? displayName : 'ゲスト' }}</p>
        <p class="menu-username">{{ loggedInUsername ? `@${username}` : '' }}</p>
      </div>
    </div>

    <nav class="menu-links">

      <div class="menu-item" @click="goTo('/')">
        <img src="/images/icon_home.svg" class="menu-item-icon" alt="" />
        <span class="menu-item-text">ホーム</span>
      </div>

      <div class="menu-item" @click="goTo('/postForm')">
        <img src="/images/icon_post.svg" class="menu-item-icon" alt="" />
        <span class="menu-item-text">投稿を作成</span>
      </div>

      <div class="menu-item" @click="goTo('/mypage')">
        <img src="/images/icon_mypage.svg" class="menu-item-icon" alt="" />
        <span class="menu-item-text">マイページ</span>
      </div>

      <div v-if="loggedInUsername" class="menu-item" @click="goTo('/notifications')">
        <div class="menu-item-icon-wrapper">
          <img src="/images/icon_bell.svg" class="menu-item-icon" alt="" />
          <span v-if="unreadCount > 0" class="unread-badge">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </div>
        <span class="menu-item-text">通知</span>
      </div>

      <div v-if="loggedInUsername" class="menu-item" @click="showLogoutModal = true">
        <img src="/images/icon_logout.svg" class="menu-item-icon" alt="" />
        <span class="menu-item-text">ログアウト</span>
      </div>

      <div v-else class="menu-item" @click="goTo('/login')">
        <img src="/images/icon_login.svg" class="menu-item-icon" alt="" />
        <span class="menu-item-text">ログイン</span>
      </div>

    </nav>
  </aside>

  <div v-if="props.isOpen" class="menu-overlay" @click="emit('close')" />

  <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
    <div class="modal">
      <p class="modal-message">ログアウトしますか？</p>
      <p v-if="logoutError" class="logout-error">{{ logoutError }}</p>
      <div class="modal-buttons">
        <button class="modal-cancel-btn" @click="showLogoutModal = false">キャンセル</button>
        <button class="modal-logout-btn" @click="handleLogout" :disabled="isLoggingOut">
          {{ isLoggingOut ? 'ログアウト中...' : 'ログアウト' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.side-menu {
  position: fixed;
  top: 0; left: 0;
  width: 280px; height: 100%;
  background-color: #f9f9f9;
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
}
.side-menu.is-open { transform: translateX(0); }

.menu-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.5);
  z-index: 999;
}

.menu-user-info {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
}
.menu-user-info:hover { background-color: #f0e6fa; }
.menu-user-icon-wrapper { flex-shrink: 0; margin-right: 12px; }
.menu-user-text { display: flex; flex-direction: column; justify-content: center; }
.menu-display-name { margin: 0; font-size: 15px; font-weight: bold; color: #333; }
.menu-username { margin: 4px 0 0; font-size: 12px; color: #999; }

.menu-links { padding: 8px 0; }
.menu-item { display: flex; align-items: center; padding: 15px 0; cursor: pointer; }
.menu-item:hover { background-color: #f0e6fa; }
.menu-item-text { font-size: 15px; }
.menu-item-icon { width: 28px; height: 28px; margin: 5px 15px 0 15px; object-fit: contain; }

.menu-item-icon-wrapper {
  position: relative;
  width: 28px; height: 28px;
  margin: 5px 15px 0 15px;
  flex-shrink: 0;
}
.menu-item-icon-wrapper .menu-item-icon { margin: 0; width: 100%; height: 100%; }

.unread-badge {
  position: absolute;
  top: -4px; right: -6px;
  background-color: #e0245e;
  color: white;
  border-radius: 10px;
  font-size: 10px;
  font-weight: bold;
  padding: 1px 4px;
  min-width: 16px;
  text-align: center;
  line-height: 1.4;
}

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 2000; display: flex; justify-content: center; align-items: center; }
.modal { background: white; border-radius: 16px; padding: 30px 24px 20px; width: 80%; max-width: 320px; text-align: center; }
.modal-message { font-size: 16px; font-weight: bold; margin: 0 0 20px; color: #333; }
.logout-error { color: #f66; font-size: 13px; margin: 0 0 12px; }
.modal-buttons { display: flex; gap: 10px; justify-content: center; }
.modal-cancel-btn { flex: 1; background: none; border: 1px solid #ddd; border-radius: 20px; padding: 10px; font-size: 14px; cursor: pointer; }
.modal-logout-btn { flex: 1; background-color: #f66; color: white; border: none; border-radius: 20px; padding: 10px; font-size: 14px; font-weight: bold; cursor: pointer; }
.modal-logout-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>