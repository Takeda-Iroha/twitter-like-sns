<!-- app/pages/postEdit.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const isMenuOpen = ref(false)
const postContent = ref('')
const router = useRouter()

const goBack = () => { router.back() }

const editPost = () => {
  navigateTo('/')
}
</script>

<template>
  <div class="post-edit-page">

    <AppHeader @open-menu="isMenuOpen = true" />
    <AppSideMenu :is-open="isMenuOpen" @close="isMenuOpen = false" />

    <div class="post-content-wrapper">

      <div class="post-btn-group">
        <button @click="goBack" class="cancel-btn">キャンセル</button>
        <div class="post-actions">
          <button
            @click="editPost"
            class="post-btn"
            :disabled="!postContent.trim() || postContent.length > 250"
          >
            再投稿する
          </button>
          <div class="char-count" :class="{ 'error': postContent.length > 250 }">
            {{ postContent.length }} / 250
          </div>
        </div>
      </div>

      <div class="post-form-content">
        <div class="user-icon"></div>
        <textarea v-model="postContent" class="post-textarea" placeholder="既存の投稿表示"></textarea>
      </div>

    </div>
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
.post-content-wrapper {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 12px;
  border-left: 1px solid rgba(198, 91, 237, 0.3);
  border-right: 1px solid rgba(198, 91, 237, 0.3);
  background-color: #fff;
  min-height: calc(100vh - 60px);
}
.post-btn-group { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; }
.cancel-btn { background-color: transparent; border: none; font-size: 16px; cursor: pointer; }
.post-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.post-btn { background-color: #c65bed; color: white; border: none; border-radius: 20px; padding: 8px 16px; font-weight: bold; cursor: pointer; transition: opacity 0.3s; }
.post-btn:disabled { background-color: #979da1; cursor: not-allowed; opacity: 0.6; }
.post-form-content { display: flex; padding: 10px; gap: 12px; }
.user-icon { width: 60px; height: 60px; border-radius: 50%; flex-shrink: 0; background-image: url('/images/user_photo.jpg'); background-size: cover; background-position: center; background-color: #ddd; }
.post-textarea { flex: 1; border: none; outline: none; font-size: 18px; resize: none; min-height: 200px; padding-top: 10px; background-color: transparent; }
.char-count { text-align: right; font-size: 12px; color: #666; }
.char-count.error { color: red; font-weight: bold; }
</style>