<!-- app/pages/mypage.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUser } from '~/composables/useUser'
import type { UserProfile, UserPost } from '~/composables/useUser'

const isMenuOpen = ref(false)
const { fetchUserProfile, updateProfile, fetchUserPosts } = useUser()

// ----------------------------------------
// 自分のusernameをCookieから取得
// ----------------------------------------
const loggedInUsername = useCookie('username').value

// ----------------------------------------
// URLパラメータからusernameを取得
// /users/johndoe にアクセスしたとき
// route.params.username に「johndoe」が入る
// ただし /mypage の場合はパラメータがないので
// loggedInUsername を使う
// ----------------------------------------
const route = useRoute()
const targetUsername = computed(() => {
  return (route.params.username as string) || loggedInUsername || ''
})

// 自分のページかどうかを自動判定
const isMyPage = computed(() => {
  return targetUsername.value === loggedInUsername
})

const profile = ref<UserProfile | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

const userPosts = ref<UserPost[]>([])
const isPostsLoading = ref(false)
const postsError = ref('')

const isEditModalOpen = ref(false)
const editDisplayName = ref('')
const editBio = ref('')
const editProfileImageUrl = ref('')
const isUpdating = ref(false)
const updateError = ref('')

const loadProfile = async () => {
  isLoading.value = true
  errorMessage.value = ''

  if (!targetUsername.value) {
    navigateTo('/login')
    return
  }

  try {
    profile.value = await fetchUserProfile(targetUsername.value)
    await loadUserPosts()
  } catch (error: any) {
    if (error.status === 401) {
      navigateTo('/login')
    } else if (error.status === 404) {
      errorMessage.value = 'ユーザーが見つかりません'
    } else {
      errorMessage.value = 'プロフィールを読み込めませんでした'
    }
  } finally {
    isLoading.value = false
  }
}

const loadUserPosts = async () => {
  if (!targetUsername.value) return
  isPostsLoading.value = true
  postsError.value = ''

  try {
    const result = await fetchUserPosts(targetUsername.value)

    // ----------------------------------------
    // 公開範囲による投稿フィルタリング
    // isMyPage：全投稿表示
    // フォロワーの場合：public + followers を表示
    // 非フォロワーの場合：public のみ表示
    // ----------------------------------------
    if (isMyPage.value) {
      userPosts.value = result.posts
    } else if (profile.value?.isFollowing) {
      // フォロワーはpublic・followersの投稿を表示
      userPosts.value = result.posts.filter(
        p => p.visibility === 'public' || p.visibility === 'followers'
      )
    } else {
      // 非フォロワーはpublicのみ
      userPosts.value = result.posts.filter(
        p => p.visibility === 'public'
      )
    }
  } catch (error: any) {
    postsError.value = '投稿を読み込めませんでした'
  } finally {
    isPostsLoading.value = false
  }
}



const openEditModal = () => {
  if (!profile.value) return
  editDisplayName.value = profile.value.displayName ?? ''
  editBio.value = profile.value.bio ?? ''
  editProfileImageUrl.value = profile.value.profileImageUrl ?? ''
  updateError.value = ''
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
}

const handleUpdateProfile = async () => {
  isUpdating.value = true
  updateError.value = ''

  try {
    profile.value = await updateProfile({
      displayName: editDisplayName.value,
      bio: editBio.value,
      profileImageUrl: editProfileImageUrl.value || undefined
    })
    closeEditModal()
  } catch (error: any) {
    if (error.status === 401) {
      updateError.value = 'ログインが必要です'
    } else if (error.status === 400) {
      updateError.value = '入力内容に誤りがあります'
    } else {
      updateError.value = '更新に失敗しました'
    }
  } finally {
    isUpdating.value = false
  }
}



onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="mypage-content">

    <AppHeader @open-menu="isMenuOpen = true" />
    <AppSideMenu :is-open="isMenuOpen" @close="isMenuOpen = false" />

    <div class="mypage-wrapper">

      <p v-if="isLoading" class="status-text">読み込み中...</p>
      <p v-else-if="errorMessage" class="status-text error">{{ errorMessage }}</p>

      <template v-else-if="profile">

        <section class="profile-header">
          <div class="cover-image">
            <img v-if="profile.profileImageUrl" :src="profile.profileImageUrl" class="cover-img" alt="カバー画像" />
            <span v-else class="cover-placeholder">ヘッダー画像</span>
          </div>

          <div class="profile-main">
            <div class="avatar-wrapper">
              <img v-if="profile.profileImageUrl" :src="profile.profileImageUrl" class="avatar" alt="アイコン" />
              <div v-else class="avatar avatar--empty" />
            </div>

            <div class="profile-action">
              <button v-if="isMyPage" class="edit-btn" @click="openEditModal">プロフィールを編集</button>
              <button v-else class="follow-btn">フォローする</button>
            </div>

            <h2 class="user-name">{{ profile.displayName || profile.username }}</h2>
            <p class="user-id">@{{ profile.username }}</p>
            <p class="bio">{{ profile.bio || '自己紹介はまだありません' }}</p>

            <div class="follow-stats">
              <span class="follow-stat"><strong>{{ profile.followingCount }}</strong> フォロー中</span>
              <span class="follow-stat"><strong>{{ profile.followersCount }}</strong> フォロワー</span>
            </div>
          </div>
        </section>

        <hr class="section-divider" />

        <div class="status-bar">
          <span class="post-count">{{ userPosts.length }}件の投稿</span>
        </div>

        <main class="post-list">
          <p v-if="isPostsLoading" class="status-text">投稿を読み込み中...</p>
          <p v-else-if="postsError" class="status-text error">{{ postsError }}</p>
          <p v-else-if="userPosts.length === 0" class="status-text">投稿がありません</p>

          <PostCard
            v-for="post in userPosts"
            :key="post.id"
            :post="(post as any)"
            @deleted="(postId) => userPosts = userPosts.filter(p => p.id !== postId)"
          />
        </main>
      </template>
    </div>

    <!-- 編集モーダル（自分のページのみ表示） -->
    <div v-if="isEditModalOpen && isMyPage" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">プロフィールを編集</h3>
          <button class="modal-close-btn" @click="closeEditModal">×</button>
        </div>
        <div class="modal-body">
          <div class="input-group">
            <label class="input-label">アイコン画像URL</label>
            <input v-model="editProfileImageUrl" type="text" class="modal-input" placeholder="https://example.com/image.jpg" />
            <div v-if="editProfileImageUrl" class="image-preview">
              <img :src="editProfileImageUrl" class="preview-icon" alt="プレビュー" @error="editProfileImageUrl = ''" />
            </div>
          </div>
          <div class="input-group">
            <label class="input-label">表示名</label>
            <input v-model="editDisplayName" type="text" class="modal-input" placeholder="表示名を入力" />
          </div>
          <div class="input-group">
            <label class="input-label">自己紹介</label>
            <textarea v-model="editBio" class="modal-textarea" placeholder="自己紹介を入力" rows="4"></textarea>
          </div>
          <p v-if="updateError" class="update-error">{{ updateError }}</p>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeEditModal">キャンセル</button>
          <button class="save-btn" @click="handleUpdateProfile" :disabled="isUpdating">
            {{ isUpdating ? '保存中...' : '保存する' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.mypage-wrapper { max-width: 600px; margin: 0 auto; background-color: #fff; min-height: 100vh; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
.cover-image { width: 100%; height: 160px; background-color: #eee; display: flex; justify-content: center; align-items: center; overflow: hidden; }
.cover-img { width: 100%; height: 100%; object-fit: cover; }
.cover-placeholder { color: #999; font-size: 14px; }
.profile-main { padding: 0 20px 20px; }
.avatar-wrapper { margin-top: -45px; margin-bottom: 10px; }
.avatar { width: 90px; height: 90px; border-radius: 50%; border: 4px solid #fff; object-fit: cover; display: block; }
.avatar--empty { background-color: #ccc; }
.profile-action { display: flex; justify-content: flex-end; margin-bottom: 10px; }
.edit-btn { background: none; border: 1px solid #c65bed; border-radius: 20px; padding: 6px 16px; font-size: 13px; color: #c65bed; cursor: pointer; font-weight: bold; }
.edit-btn:hover { background-color: #f5e6ff; }
.follow-btn { background-color: #c65bed; border: none; border-radius: 20px; padding: 6px 16px; font-size: 13px; color: white; cursor: pointer; font-weight: bold; }
.user-name { margin: 0; font-size: 22px; }
.user-id { margin: 5px 0 10px; color: #888; font-size: 14px; }
.bio { font-size: 14px; line-height: 1.6; color: #333; margin: 0 0 12px; }
.follow-stats { display: flex; gap: 20px; font-size: 14px; color: #333; }
.follow-stat strong { font-weight: bold; }
.section-divider { border: 0; border-top: 1px solid #eee; margin: 0; }
.status-bar { display: flex; justify-content: space-between; padding: 15px 20px; font-size: 14px; }
.status-text { text-align: center; color: #999; font-size: 14px; padding: 30px 0; }
.status-text.error { color: #f66; }
.post-list { padding: 0 15px 50px; }

@keyframes heartPop { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 2000; display: flex; justify-content: center; align-items: center; }
.modal { background: white; border-radius: 16px; width: 90%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #eee; position: sticky; top: 0; background: white; z-index: 1; }
.modal-title { margin: 0; font-size: 16px; font-weight: bold; }
.modal-close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #999; }
.modal-body { padding: 20px; }
.input-group { margin-bottom: 20px; }
.input-label { display: block; font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #333; }
.modal-input { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; outline: none; }
.modal-input:focus { border-color: #c65bed; }
.modal-textarea { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; outline: none; resize: none; }
.modal-textarea:focus { border-color: #c65bed; }
.image-preview { margin-top: 10px; display: flex; justify-content: center; }
.preview-icon { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd; }
.update-error { color: #f66; font-size: 13px; margin: 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #eee; }
.cancel-btn { background: none; border: 1px solid #ddd; border-radius: 20px; padding: 8px 16px; font-size: 14px; cursor: pointer; }
.save-btn { background-color: #c65bed; color: white; border: none; border-radius: 20px; padding: 8px 16px; font-size: 14px; font-weight: bold; cursor: pointer; }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>