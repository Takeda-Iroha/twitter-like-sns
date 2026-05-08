<!-- app/pages/index.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePost } from '~/composables/usePost'
import type { Post } from '~/composables/usePost'

const isMenuOpen = ref(false)
const { fetchPublicTimeline, fetchHomeTimeline } = usePost()

// タブ管理（初期値は公開タイムライン）
const activeTab = ref<'public' | 'home'>('public')

// 投稿データ・状態管理
const posts = ref<Post[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

// ページネーション管理
const nextCursor = ref<string | null>(null)
const hasMore = ref(false)

// タイムライン取得
const fetchTimeline = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = activeTab.value === 'public'
      ? await fetchPublicTimeline()
      : await fetchHomeTimeline()

    posts.value = response.data
    nextCursor.value = response.meta.pagination.nextCursor
    hasMore.value = response.meta.pagination.hasMore

  } catch (error: any) {
  if (error.status === 401 || error.message === 'ログインが必要です') {
    errorMessage.value = 'ホームタイムラインはログインが必要です'
  } else {
    errorMessage.value = '投稿を読み込めませんでした'
  }
} finally {
    isLoading.value = false
  }
}

// タブ切り替え
const switchTab = (tab: 'public' | 'home') => {
  activeTab.value = tab
  posts.value = []
  nextCursor.value = null
  fetchTimeline()
}

// ページが開いたとき実行
onMounted(() => {
  fetchTimeline()
})

// 画面遷移
const goToPostForm = () => { navigateTo('/postForm') }
const goToHome = () => { navigateTo('/') }
const goToMypage = () => { navigateTo('/mypage') }
</script>

<template>
  <div class="app-container">

    <header class="header">
      <div class="menu_icon" @click="isMenuOpen = true">
        <img src="/images/icon_menu.svg" alt="メニューを表示" />
      </div>
      <h1 class="logo">APG</h1>
      <div class="spacer"></div>
    </header>

    <aside class="side-menu" :class="{ 'is-open': isMenuOpen }">
      <div class="menu-user-info">
        <div class="menu-user-icon"></div>
        <div class="menu-user-text">
          <p class="user-name">UserName</p>
          <p class="user-id">UserID</p>
        </div>
      </div>
      <nav class="menu-links">
        <div class="menu-item" @click="goToHome">
          <img src="/images/icon_home.svg" class="menu-item-icon" alt="">
          <span class="menu-item-text">ホーム</span>
        </div>
        <div class="menu-item" @click="goToPostForm">
          <img src="/images/icon_post.svg" class="menu-item-icon" alt="">
          <span class="menu-item-text">投稿を作成</span>
        </div>
        <div class="menu-item" @click="goToMypage">
          <img src="/images/icon_mypage.svg" class="menu-item-icon" alt="">
          <span class="menu-item-text">マイページ</span>
        </div>
      </nav>
    </aside>

    <div v-if="isMenuOpen" class="menu-overlay" @click="isMenuOpen = false"></div>

    <main class="main-content">

      <!-- タブ -->
      <div class="tab-bar">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'public' }"
          @click="switchTab('public')"
        >
          公開
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'home' }"
          @click="switchTab('home')"
        >
          ホーム
        </button>
      </div>

      <!-- ローディング中 -->
      <p v-if="isLoading" class="status-text">読み込み中...</p>

      <!-- エラー時 -->
      <p v-else-if="errorMessage" class="status-text error">
        {{ errorMessage }}
      </p>

      <!-- 投稿一覧 -->
      <!-- PostCardにpostを1件ずつ渡して表示する -->
      <template v-else>
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
        />
        <p v-if="posts.length === 0" class="status-text">
          投稿がありません
        </p>
      </template>

    </main>

    <button class="add-button" @click="goToPostForm">+</button>

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
.header {
  background: linear-gradient(90deg, #6a21aa, #c65bed, #ecb5f5);
  color: white;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  border-bottom: 1px solid #999;
  position: sticky;
  top: 0;
  z-index: 10;
}
.logo { font-size: 20px; margin: 0; }
.menu_icon img { width: 24px; height: 24px; }
.spacer { width: 25px; }

.side-menu {
  position: fixed;
  top: 0; left: 0;
  width: 280px; height: 100%;
  background-color: #f9f9f9;
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}
.side-menu.is-open { transform: translateX(0); }
.menu-user-info {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}
.menu-user-icon {
  width: 60px; height: 60px;
  border-radius: 50%;
  margin-right: 15px;
  flex-shrink: 0;
  background-image: url('/images/user_photo.jpg');
  background-size: cover;
  background-position: center;
  background-color: #ddd;
}
.menu-user-text { display: flex; flex-direction: column; }
.menu-user-text .user-id { color: #999; font-size: 12px; margin-top: 4px; }
.menu-item-icon { width: 28px; height: 28px; margin: 5px 15px 0 15px; object-fit: contain; }
.menu-item { display: flex; align-items: center; padding: 15px 0; cursor: pointer; }
.menu-item:hover { background-color: #f0e6fa; }
.menu-item-text { font-size: 15px; }
.menu-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.5);
  z-index: 999;
}

.main-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 15px 80px;
}

.tab-bar {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 15px;
  position: sticky;
  top: 60px;
  background: #f5f5f5;
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

.add-button {
  position: fixed;
  bottom: 20px; right: 20px;
  width: 60px; height: 60px;
  background-color: #ddd;
  border: 1px solid #999;
  border-radius: 50%;
  font-size: 30px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  cursor: pointer;
}
</style>