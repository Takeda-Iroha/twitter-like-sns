<!-- app/pages/mypage.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUser } from '~/composables/useUser'
import type { UserProfile, UserPost } from '~/composables/useUser'
import { useUpload } from '~/composables/useUpload'

const isMenuOpen = ref(false)
const { fetchUserProfile, updateProfile, fetchUserPosts } = useUser()
const { uploadImage } = useUpload()
const router = useRouter()

const loggedInUsername = useCookie('username').value

const route = useRoute()
const targetUsername = computed(() => {
  return (route.params.username as string) || loggedInUsername || ''
})

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
const isUpdating = ref(false)
const updateError = ref('')

// アイコン関連
const editIconUrl = ref<string | null>(null)   // アップロード後のURL
const editIconPreview = ref<string | null>(null) // ローカルプレビュー用
const isIconUploading = ref(false)
const iconUploadError = ref('')

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
    if (isMyPage.value) {
      userPosts.value = result.posts
    } else if (profile.value?.isFollowing) {
      userPosts.value = result.posts.filter(
        p => p.visibility === 'public' || p.visibility === 'followers'
      )
    } else {
      userPosts.value = result.posts.filter(p => p.visibility === 'public')
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
  editIconUrl.value = null
  editIconPreview.value = null
  iconUploadError.value = ''
  updateError.value = ''
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  if (editIconPreview.value) URL.revokeObjectURL(editIconPreview.value)
  editIconUrl.value = null
  editIconPreview.value = null
  isEditModalOpen.value = false
}

// 画像選択時に即アップロードしてURLを保存
const handleIconSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  const file = input.files[0]

  // ローカルプレビューを表示
  if (editIconPreview.value) URL.revokeObjectURL(editIconPreview.value)
  editIconPreview.value = URL.createObjectURL(file)

  // 即アップロード
  isIconUploading.value = true
  iconUploadError.value = ''
  try {
    editIconUrl.value = await uploadImage(file)
  } catch {
    iconUploadError.value = 'アイコンのアップロードに失敗しました'
    editIconUrl.value = null
    editIconPreview.value = null
  } finally {
    isIconUploading.value = false
    input.value = ''
  }
}

const handleUpdateProfile = async () => {
  isUpdating.value = true
  updateError.value = ''

  try {
    profile.value = await updateProfile({
      displayName: editDisplayName.value,
      bio: editBio.value,
      // アイコンが更新されていればURLを渡す・なければ渡さない
      ...(editIconUrl.value ? { profileImageUrl: editIconUrl.value } : {})
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

      <div class="cover-image">
        <button class="back-btn" @click="router.back()">← 戻る</button>
      </div>

      <p v-if="isLoading" class="status-text">読み込み中...</p>
      <p v-else-if="errorMessage" class="status-text error">{{ errorMessage }}</p>

      <template v-else-if="profile">

        <section class="profile-header">
          <div class="profile-main">
            <div class="avatar-wrapper">
              <img
                v-if="profile.profileImageUrl"
                :src="profile.profileImageUrl"
                class="avatar"
                alt="アイコン"
              />
              <div v-else class="avatar avatar--default">
                <img src="/images/icon_mypage.svg" class="avatar-default-icon" alt="デフォルトアイコン" />
              </div>
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

    <!-- 編集モーダル -->
    <div v-if="isEditModalOpen && isMyPage" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">プロフィールを編集</h3>
          <button class="modal-close-btn" @click="closeEditModal">×</button>
        </div>
        <div class="modal-body">

          <!-- アイコン画像 -->
          <div class="input-group">
            <label class="input-label">アイコン画像</label>
            <div class="icon-upload-area">
              <!-- プレビュー優先、なければ現在のアイコン、なければデフォルト -->
              <img
                v-if="editIconPreview"
                :src="editIconPreview"
                class="icon-preview"
                alt="プレビュー"
              />
              <img
                v-else-if="profile?.profileImageUrl"
                :src="profile.profileImageUrl"
                class="icon-preview"
                alt="現在のアイコン"
              />
              <div v-else class="icon-preview icon-preview--default">
                <img src="/images/icon_mypage.svg" class="icon-preview-svg" alt="" />
              </div>

              <div class="icon-upload-right">
                <label class="icon-upload-btn" :class="{ 'disabled': isIconUploading }">
                  <input
                    type="file"
                    accept="image/*"
                    style="display: none"
                    :disabled="isIconUploading"
                    @change="handleIconSelect"
                  />
                  {{ isIconUploading ? 'アップロード中...' : '画像を変更' }}
                </label>
                <p v-if="iconUploadError" class="icon-upload-error">{{ iconUploadError }}</p>
                <p v-if="editIconUrl" class="icon-upload-success">✅ アップロード完了</p>
              </div>
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
          <button
            class="save-btn"
            @click="handleUpdateProfile"
            :disabled="isUpdating || isIconUploading"
          >
            {{ isUpdating ? '保存中...' : '保存する' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.mypage-wrapper { max-width: 600px; margin: 0 auto; background-color: #fff; min-height: 100vh; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }

.cover-image { width: 100%; height: 160px; background-color: #e9d5ff; position: relative; }
.back-btn {
  position: absolute; top: 12px; left: 12px;
  background: rgba(255,255,255,0.85); border: none; border-radius: 20px;
  padding: 6px 14px; font-size: 14px; cursor: pointer; color: #6a21aa; font-weight: bold;
}
.back-btn:hover { background: rgba(255,255,255,1); }

.profile-main { padding: 0 20px 20px; }
.avatar-wrapper { margin-top: -45px; margin-bottom: 10px; position: relative; z-index: 1; }
.avatar { width: 90px; height: 90px; border-radius: 50%; border: 4px solid #fff; object-fit: cover; display: block; }
.avatar--default { width: 90px; height: 90px; border-radius: 50%; border: 4px solid #fff; background-color: #ccc; display: flex; align-items: center; justify-content: center; box-sizing: content-box; overflow: hidden; }
.avatar-default-icon { width: 50px; height: 50px; object-fit: contain; filter: brightness(0) invert(1); }

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
.update-error { color: #f66; font-size: 13px; margin: 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #eee; }
.cancel-btn { background: none; border: 1px solid #ddd; border-radius: 20px; padding: 8px 16px; font-size: 14px; cursor: pointer; }
.save-btn { background-color: #c65bed; color: white; border: none; border-radius: 20px; padding: 8px 16px; font-size: 14px; font-weight: bold; cursor: pointer; }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* アイコンアップロード */
.icon-upload-area { display: flex; align-items: center; gap: 16px; }
.icon-preview { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd; display: block; flex-shrink: 0; }
.icon-preview--default { background-color: #ccc; display: flex; align-items: center; justify-content: center; }
.icon-preview-svg { width: 40px; height: 40px; filter: brightness(0) invert(1); }
.icon-upload-right { display: flex; flex-direction: column; gap: 6px; }
.icon-upload-btn {
  background: none; border: 1px solid #c65bed; border-radius: 20px;
  padding: 6px 14px; font-size: 13px; color: #c65bed; cursor: pointer; white-space: nowrap;
}
.icon-upload-btn:hover { background-color: #f5e6ff; }
.icon-upload-btn.disabled { opacity: 0.6; cursor: not-allowed; }
.icon-upload-error { color: #f66; font-size: 12px; margin: 0; }
.icon-upload-success { color: #4caf50; font-size: 12px; margin: 0; }
</style>