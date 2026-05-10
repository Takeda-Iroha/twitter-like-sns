<!-- app/pages/index.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePost } from '~/composables/usePost'
import type { Post } from '~/composables/usePost'

const isMenuOpen = ref(false)
const { fetchPublicTimeline, fetchHomeTimeline } = usePost()

const activeTab = ref<'public' | 'home'>('public')
const posts = ref<Post[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const nextCursor = ref<string | null>(null)
const hasMore = ref(false)

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

const switchTab = (tab: 'public' | 'home') => {
  activeTab.value = tab
  posts.value = []
  nextCursor.value = null
  fetchTimeline()
}

onMounted(() => {
  fetchTimeline()
})

const goToPostForm = () => { navigateTo('/postForm') }
</script>

<template>
  <div class="app-container">

    <AppHeader @open-menu="isMenuOpen = true" />
    <AppSideMenu :is-open="isMenuOpen" @close="isMenuOpen = false" />

    <main class="main-content">

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

      <p v-if="isLoading" class="status-text">読み込み中...</p>
      <p v-else-if="errorMessage" class="status-text error">{{ errorMessage }}</p>

      <template v-else>
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
        />
        <p v-if="posts.length === 0" class="status-text">投稿がありません</p>
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