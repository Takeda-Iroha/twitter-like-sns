<!-- app/pages/postForm.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePost } from '~/composables/usePost'
import { useUser } from '~/composables/useUser'

const isMenuOpen = ref(false)
const { createPost } = usePost()
const { fetchUserProfile } = useUser()
const router = useRouter()

const postContent = ref('')
const visibility = ref<'public' | 'followers' | 'private'>('public')
const showVisibilityMenu = ref(false)
const attachedImages = ref<File[]>([])
const previewUrls = ref<string[]>([])
const isSubmitting = ref(false)
const errorMessage = ref('')

// 自分のアイコン画像を取得
const myProfileImageUrl = ref('')
const loggedInUsername = useCookie('username').value

const loadMyProfile = async () => {
  if (!loggedInUsername) return
  try {
    const profile = await fetchUserProfile(loggedInUsername)
    myProfileImageUrl.value = profile.profileImageUrl ?? ''
  } catch { /* 失敗しても問題なし */ }
}

const visibilityLabel = computed(() => {
  if (visibility.value === 'public') return '🌍 全員'
  if (visibility.value === 'followers') return '👥 フォロワーのみ'
  return '🔒 自分のみ'
})

const handleImageSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files) return
  const files = Array.from(input.files)
  const remaining = 4 - attachedImages.value.length
  const newFiles = files.slice(0, remaining)
  attachedImages.value = [...attachedImages.value, ...newFiles]
  const newUrls = newFiles.map(file => URL.createObjectURL(file))
  previewUrls.value = [...previewUrls.value, ...newUrls]
}

const removeImage = (index: number) => {
  URL.revokeObjectURL(previewUrls.value[index] ?? '')
  attachedImages.value = attachedImages.value.filter((_, i) => i !== index)
  previewUrls.value = previewUrls.value.filter((_, i) => i !== index)
}

const handleCreatePost = async () => {
  if (!postContent.value.trim()) return
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await createPost({
      content: postContent.value,
      visibility: visibility.value,
      imageUrls: []
    })
    navigateTo('/')
  } catch (error: any) {
    if (error.status === 401) {
      errorMessage.value = 'ログインが必要です'
    } else if (error.status === 400) {
      errorMessage.value = '入力内容に誤りがあります'
    } else {
      errorMessage.value = '投稿に失敗しました'
    }
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => { router.back() }

onMounted(() => {
  loadMyProfile()
})
</script>

<template>
  <div class="create-post-page">

    <AppHeader @open-menu="isMenuOpen = true" />
    <AppSideMenu :is-open="isMenuOpen" @close="isMenuOpen = false" />

    <div class="post-content-wrapper">

      <div class="post-btn-group">
        <button @click="goBack" class="cancel-btn">キャンセル</button>
        <div class="post-actions">
          <button
            @click="handleCreatePost"
            class="post-btn"
            :disabled="!postContent.trim() || postContent.length > 250 || isSubmitting"
          >
            {{ isSubmitting ? '投稿中...' : '投稿する' }}
          </button>
          <div class="char-count" :class="{ 'error': postContent.length > 250 }">
            {{ postContent.length }} / 250
          </div>
        </div>
      </div>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <div class="post-form-content">
        <!-- APIから取得したアイコン画像を表示 -->
        <img
          v-if="myProfileImageUrl"
          :src="myProfileImageUrl"
          class="user-icon"
          alt="自分のアイコン"
        />
        <div v-else class="user-icon user-icon--empty" />

        <textarea v-model="postContent" class="post-textarea" placeholder="今なにしてる？"></textarea>
      </div>

      <div v-if="previewUrls.length > 0" class="image-preview-list">
        <div v-for="(url, index) in previewUrls" :key="index" class="image-preview-item">
          <img :src="url" class="preview-image" alt="添付画像" />
          <button class="remove-image-btn" @click="removeImage(index)">×</button>
        </div>
      </div>

      <div class="bottom-actions">
        <label class="action-btn" :class="{ 'disabled': attachedImages.length >= 4 }">
          <input
            type="file"
            accept="image/*"
            multiple
            style="display: none"
            :disabled="attachedImages.length >= 4"
            @change="handleImageSelect"
          />
          🖼 画像
        </label>

        <div class="visibility-wrapper">
          <button class="action-btn" @click="showVisibilityMenu = !showVisibilityMenu">
            {{ visibilityLabel }}
          </button>
          <div v-if="showVisibilityMenu" class="visibility-menu">
            <div
              class="visibility-option"
              :class="{ 'active': visibility === 'public' }"
              @click="visibility = 'public'; showVisibilityMenu = false"
            >🌍 全員</div>
            <div
              class="visibility-option"
              :class="{ 'active': visibility === 'followers' }"
              @click="visibility = 'followers'; showVisibilityMenu = false"
            >👥 フォロワーのみ</div>
            <div
              class="visibility-option"
              :class="{ 'active': visibility === 'private' }"
              @click="visibility = 'private'; showVisibilityMenu = false"
            >🔒 自分のみ</div>
          </div>
        </div>
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
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
  background-color: #fff;
  min-height: calc(100vh - 60px);
}
.post-btn-group { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; }
.cancel-btn { background: none; border: none; font-size: 16px; cursor: pointer; }
.post-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.post-btn { background-color: #c65bed; color: white; border: none; border-radius: 20px; padding: 8px 16px; font-weight: bold; cursor: pointer; transition: opacity 0.3s; }
.post-btn:disabled { background-color: #979da1; cursor: not-allowed; opacity: 0.6; }
.char-count { text-align: right; font-size: 12px; color: #666; }
.char-count.error { color: red; font-weight: bold; }
.error-message { color: #f66; font-size: 13px; text-align: center; margin: 0 0 8px; }
.post-form-content { display: flex; padding: 10px; gap: 12px; }
.user-icon { width: 60px; height: 60px; border-radius: 50%; flex-shrink: 0; object-fit: cover; display: block; }
.user-icon--empty { width: 60px; height: 60px; border-radius: 50%; flex-shrink: 0; background-color: #ddd; }
.post-textarea { flex: 1; border: none; outline: none; font-size: 18px; resize: none; min-height: 200px; padding-top: 10px; background-color: transparent; font-family: inherit; }
.image-preview-list { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 10px 10px; }
.image-preview-item { position: relative; width: calc(50% - 4px); }
.preview-image { width: 100%; height: 150px; object-fit: cover; border-radius: 10px; }
.remove-image-btn { position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.bottom-actions { display: flex; align-items: center; gap: 10px; padding: 10px 15px; border-top: 1px solid #eee; }
.action-btn { background: none; border: 1px solid #c65bed; border-radius: 20px; padding: 6px 14px; font-size: 13px; color: #c65bed; cursor: pointer; }
.action-btn.disabled { opacity: 0.4; cursor: not-allowed; }
.visibility-wrapper { position: relative; }
.visibility-menu { position: absolute; bottom: 40px; left: 0; background: white; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; z-index: 10; min-width: 160px; }
.visibility-option { padding: 12px 16px; font-size: 14px; cursor: pointer; }
.visibility-option:hover { background-color: #f5f0ff; }
.visibility-option.active { color: #c65bed; font-weight: bold; }
</style>