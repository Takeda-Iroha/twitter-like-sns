//mypage.vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUser } from '~/composables/useUser'
import type { UserProfile, UserPost } from '~/composables/useUser'

const isMenuOpen = ref(false)
const { fetchUserProfile, updateProfile, fetchUserPosts } = useUser()

// ----------------------------------------
// CookieからログインユーザーのIDを取得
// login.vueで保存したuserIdをここで使う
// ----------------------------------------
const loggedInUsername = useCookie('username').value

// 自分のページか他人のページかの判定
// 今はとりあえず自分のページとして固定
const isMyPage = ref(true)

// ----------------------------------------
// プロフィール情報の状態管理
// ----------------------------------------
const profile = ref<UserProfile | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

// ----------------------------------------
// 投稿一覧の状態管理
// ----------------------------------------
const userPosts = ref<UserPost[]>([])
const isPostsLoading = ref(false)
const postsError = ref('')

// ----------------------------------------
// 編集モーダルの状態管理
// ----------------------------------------
const isEditModalOpen = ref(false)
const editDisplayName = ref('')
const editBio = ref('')
const editProfileImageUrl = ref('')
const isUpdating = ref(false)
const updateError = ref('')

// ----------------------------------------
// プロフィール取得
// CookieのuserIdを使って /api/users/{userId} を呼ぶ
// ----------------------------------------
const loadProfile = async () => {
  isLoading.value = true
  errorMessage.value = ''

  // userIdがない場合はログインページへ
  if (!loggedInUsername) {
  navigateTo('/login')
  return
}

  try {
    profile.value = await fetchUserProfile(loggedInUsername)
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

// ----------------------------------------
// 投稿一覧取得
// ----------------------------------------
const loadUserPosts = async () => {
  if (!loggedInUsername) return

  isPostsLoading.value = true
  postsError.value = ''

  try {
    const result = await fetchUserPosts(loggedInUsername!)
    userPosts.value = result.posts
  } catch (error: any) {
    postsError.value = '投稿を読み込めませんでした'
  } finally {
    isPostsLoading.value = false
  }
}

// ----------------------------------------
// 投稿日時のフォーマット
// 「2019-08-24T14:15:22.123Z」→「2019/08/24 14:15」
// ----------------------------------------
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
// 編集モーダルを開く
// ----------------------------------------
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

// ----------------------------------------
// プロフィール更新処理
// ----------------------------------------
const handleUpdateProfile = async () => {
  isUpdating.value = true
  updateError.value = ''

  try {
    profile.value = await updateProfile({
      displayName: editDisplayName.value,
      bio: editBio.value,
      // 空文字の場合はundefinedにして送らない
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

const goToPostForm = () => { navigateTo('/postForm') }
const goToHome = () => { navigateTo('/') }
const goToMypage = () => { navigateTo('/mypage') }
</script>

<template>
  <div class="mypage-content">
    <header class="header">
      <div class="menu_icon" @click="isMenuOpen = true">
        <img src="/images/icon_menu.svg" alt="メニューを表示" class="menu-icon" />
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

    <div class="mypage-wrapper">

      <p v-if="isLoading" class="status-text">読み込み中...</p>
      <p v-else-if="errorMessage" class="status-text error">{{ errorMessage }}</p>

      <template v-else-if="profile">

        <section class="profile-header">
          <div class="cover-image">
            <img
              v-if="profile.profileImageUrl"
              :src="profile.profileImageUrl"
              class="cover-img"
              alt="カバー画像"
            />
            <span v-else class="cover-placeholder">ヘッダー画像</span>
          </div>

          <div class="profile-main">
            <div class="avatar-wrapper">
              <img
                v-if="profile.profileImageUrl"
                :src="profile.profileImageUrl"
                class="avatar"
                alt="アイコン"
              />
              <div v-else class="avatar avatar--empty" />
            </div>

            <div class="profile-action">
              <button v-if="isMyPage" class="edit-btn" @click="openEditModal">
                プロフィールを編集
              </button>
              <button v-else class="follow-btn">
                フォローする
              </button>
            </div>

            <h2 class="user-name">
              {{ profile.displayName || profile.username }}
            </h2>
            <p class="user-id">@{{ profile.username }}</p>
            <p class="bio">{{ profile.bio || '自己紹介はまだありません' }}</p>

            <!-- フォロー数・フォロワー数 -->
            <div class="follow-stats">
              <span class="follow-stat">
                <strong>{{ profile.followingCount }}</strong> フォロー中
              </span>
              <span class="follow-stat">
                <strong>{{ profile.followersCount }}</strong> フォロワー
              </span>
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

          <article
            v-else
            v-for="post in userPosts"
            :key="post.id"
            class="post-card"
          >
            <div class="post-inner">
              <div class="post-header">
                <img
                  v-if="post.author.profileImageUrl"
                  :src="post.author.profileImageUrl"
                  class="post-user-icon"
                  alt=""
                />
                <div v-else class="post-user-icon post-user-icon--empty" />

                <div class="post-user-info">
                  <span class="p-user-name">
                    {{ post.author.displayName || post.author.username }}
                  </span>
                  <span class="p-user-id">@{{ post.author.username }}</span>
                </div>

                <div v-if="isMyPage" class="post-menu">
                  <span class="menu-text">編集</span>
                  <span class="menu-text delete">削除</span>
                </div>
              </div>

              <div class="post-body">
                <p>{{ post.content }}</p>
              </div>

              <div class="post-footer">
                <span class="post-time">{{ formatDate(post.createdAt) }}に投稿</span>
                <div class="like-area">
                  <span v-if="post.likeCount > 0" class="like-num">{{ post.likeCount }}</span>
                  <button class="heart-button">
                    <img
                      v-if="post.isLiked"
                      src="/images/icon_heart_fill.svg"
                      class="heart-icon liked"
                      alt="いいね済み"
                    />
                    <img
                      v-else
                      src="/images/icon_heart.svg"
                      class="heart-icon"
                      alt="いいね"
                    />
                  </button>
                </div>
              </div>
            </div>
          </article>
        </main>
      </template>
    </div>

    <!-- 編集モーダル -->
    <div v-if="isEditModalOpen" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">プロフィールを編集</h3>
          <button class="modal-close-btn" @click="closeEditModal">×</button>
        </div>

        <div class="modal-body">

          <!-- アイコン画像URL -->
          <div class="input-group">
            <label class="input-label">アイコン画像URL</label>
            <input
              v-model="editProfileImageUrl"
              type="text"
              class="modal-input"
              placeholder="https://example.com/image.jpg"
            />
            <!-- URLが入力されているときだけプレビューを表示 -->
            <div v-if="editProfileImageUrl" class="image-preview">
              <img
                :src="editProfileImageUrl"
                class="preview-icon"
                alt="プレビュー"
                @error="editProfileImageUrl = ''"
              />
            </div>
          </div>

          <!-- 表示名 -->
          <div class="input-group">
            <label class="input-label">表示名</label>
            <input
              v-model="editDisplayName"
              type="text"
              class="modal-input"
              placeholder="表示名を入力"
            />
          </div>

          <!-- 自己紹介 -->
          <div class="input-group">
            <label class="input-label">自己紹介</label>
            <textarea
              v-model="editBio"
              class="modal-textarea"
              placeholder="自己紹介を入力"
              rows="4"
            ></textarea>
          </div>

          <p v-if="updateError" class="update-error">{{ updateError }}</p>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="closeEditModal">キャンセル</button>
          <button
            class="save-btn"
            @click="handleUpdateProfile"
            :disabled="isUpdating"
          >
            {{ isUpdating ? '保存中...' : '保存する' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

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

.mypage-wrapper {
  max-width: 600px;
  margin: 0 auto;
  background-color: #fff;
  min-height: 100vh;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
}

.cover-image {
  width: 100%;
  height: 160px;
  background-color: #eee;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.cover-img { width: 100%; height: 100%; object-fit: cover; }
.cover-placeholder { color: #999; font-size: 14px; }

.profile-main { padding: 0 20px 20px; }

.avatar-wrapper { margin-top: -45px; margin-bottom: 10px; }
.avatar {
  width: 90px; height: 90px;
  border-radius: 50%;
  border: 4px solid #fff;
  object-fit: cover;
  display: block;
}
.avatar--empty { background-color: #ccc; }

.profile-action {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
.edit-btn {
  background: none;
  border: 1px solid #c65bed;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  color: #c65bed;
  cursor: pointer;
  font-weight: bold;
}
.edit-btn:hover { background-color: #f5e6ff; }
.follow-btn {
  background-color: #c65bed;
  border: none;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  color: white;
  cursor: pointer;
  font-weight: bold;
}

.user-name { margin: 0; font-size: 22px; }
.user-id { margin: 5px 0 10px; color: #888; font-size: 14px; }
.bio { font-size: 14px; line-height: 1.6; color: #333; margin: 0 0 12px; }

.follow-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #333;
}
.follow-stat strong { font-weight: bold; }

.section-divider { border: 0; border-top: 1px solid #eee; margin: 0; }

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  font-size: 14px;
}

.status-text {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 30px 0;
}
.status-text.error { color: #f66; }

.post-list { padding: 0 15px 50px; }
.post-card {
  border: 1px solid #ccc;
  border-radius: 18px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  background-color: #fff;
}
.post-header { display: flex; align-items: center; margin-bottom: 10px; }
.post-user-icon {
  width: 40px; height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  flex-shrink: 0;
  object-fit: cover;
  display: block;
}
.post-user-icon--empty { background-color: #ccc; }
.post-user-info { flex: 1; display: flex; flex-direction: column; }
.p-user-name { font-weight: bold; font-size: 14px; }
.p-user-id { font-size: 12px; color: #999; }
.post-menu { font-size: 12px; color: #999; display: flex; gap: 10px; cursor: pointer; }
.delete { color: #f66; }
.post-body { font-size: 14px; margin-bottom: 15px; line-height: 1.5; }
.post-body p { margin: 0; }
.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #aaa;
}
.like-area { display: flex; align-items: center; color: #333; }
.like-num { margin-right: 5px; font-size: 14px; }
.heart-button {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 50%;
  margin: -8px;
}
.heart-icon { width: 22px; height: 22px; object-fit: contain; }
.heart-icon.liked { animation: heartPop 0.3s ease; }
@keyframes heartPop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.4); }
  100% { transform: scale(1); }
}

/* 編集モーダル */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}
.modal-title { margin: 0; font-size: 16px; font-weight: bold; }
.modal-close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}
.modal-body { padding: 20px; }
.input-group { margin-bottom: 20px; }
.input-label {
  display: block;
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}
.modal-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
}
.modal-input:focus { border-color: #c65bed; }
.modal-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  resize: none;
}
.modal-textarea:focus { border-color: #c65bed; }
.image-preview {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}
.preview-icon {
  width: 80px; height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ddd;
}
.update-error { color: #f66; font-size: 13px; margin: 0; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}
.cancel-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}
.save-btn {
  background-color: #c65bed;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>