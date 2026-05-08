<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUser } from '~/composables/useUser'
import type { UserProfile } from '~/composables/useUser'

const isMenuOpen = ref(false)
const { fetchMyProfile, updateProfile } = useUser()

// ----------------------------------------
// 自分のページか他人のページかの判定
// 今はとりあえず自分のページとして固定
// 将来的にはURLパラメータで判定する
// ----------------------------------------
const isMyPage = ref(true)

// ----------------------------------------
// プロフィール情報の状態管理
// ----------------------------------------
const profile = ref<UserProfile | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

// ----------------------------------------
// 編集モーダルの状態管理
// ----------------------------------------
const isEditModalOpen = ref(false)

// 編集フォームの入力値
// モーダルを開いたときに現在のプロフィール値を入れる
const editDisplayName = ref('')
const editBio = ref('')
const isUpdating = ref(false)
const updateError = ref('')

// ----------------------------------------
// プロフィール取得
// ページが開いたときに実行される
// ----------------------------------------
const loadProfile = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    profile.value = await fetchMyProfile()
  } catch (error: any) {
    if (error.status === 401) {
      navigateTo('/login')
    } else {
      errorMessage.value = 'プロフィールを読み込めませんでした'
    }
  } finally {
    isLoading.value = false
  }
}

// ----------------------------------------
// 編集モーダルを開く
// 現在のプロフィール値をフォームにセットする
// ----------------------------------------
const openEditModal = () => {
  if (!profile.value) return

  // 現在の値をフォームの初期値としてセット
  editDisplayName.value = profile.value.displayName ?? ''
  editBio.value = profile.value.bio ?? ''
  updateError.value = ''
  isEditModalOpen.value = true
}

// 編集モーダルを閉じる
const closeEditModal = () => {
  isEditModalOpen.value = false
}

// ----------------------------------------
// プロフィール更新処理
// 保存ボタンを押したときに実行される
// ----------------------------------------
const handleUpdateProfile = async () => {
  isUpdating.value = true
  updateError.value = ''

  try {
    // 更新後のプロフィールが返ってくるのでprofileに上書きする
    profile.value = await updateProfile({
      displayName: editDisplayName.value,
      bio: editBio.value
    })

    // 成功したらモーダルを閉じる
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

// ページが開いたときにプロフィールを取得
onMounted(() => {
  loadProfile()
})

// 画面遷移
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

      <!-- ローディング中 -->
      <p v-if="isLoading" class="status-text">読み込み中...</p>

      <!-- エラー時 -->
      <p v-else-if="errorMessage" class="status-text error">{{ errorMessage }}</p>

      <!-- プロフィール表示 -->
      <template v-else-if="profile">

        <section class="profile-header">
          <!-- カバー画像 -->
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
            <!-- アバター -->
            <div class="avatar-wrapper">
              <img
                v-if="profile.profileImageUrl"
                :src="profile.profileImageUrl"
                class="avatar"
                alt="アイコン"
              />
              <div v-else class="avatar avatar--empty" />
            </div>

            <!-- 自分のページ → 編集ボタン -->
            <!-- 他人のページ → フォローボタン（処理は未実装） -->
            <div class="profile-action">
              <button
                v-if="isMyPage"
                class="edit-btn"
                @click="openEditModal"
              >
                プロフィールを編集
              </button>
              <button
                v-else
                class="follow-btn"
              >
                フォローする
              </button>
            </div>

            <!-- プロフィール情報 -->
            <!-- displayNameがない場合はusernameを表示 -->
            <h2 class="user-name">
              {{ profile.displayName || profile.username }}
            </h2>
            <p class="user-id">@{{ profile.username }}</p>
            <p class="bio">{{ profile.bio || '自己紹介はまだありません' }}</p>
          </div>
        </section>

        <hr class="section-divider" />

        <div class="status-bar">
          <span class="post-count">投稿一覧</span>
        </div>

        <!-- 投稿一覧（今後APIと繋ぐ） -->
        <main class="post-list">
          <p class="status-text">投稿一覧は今後実装予定</p>
        </main>

      </template>
    </div>

    <!-- =============================
         編集モーダル
         isEditModalOpenがtrueのときだけ表示
         ============================= -->
    <div v-if="isEditModalOpen" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">プロフィールを編集</h3>
          <button class="modal-close-btn" @click="closeEditModal">×</button>
        </div>

        <div class="modal-body">
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

          <!-- エラーメッセージ -->
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

/* プロフィール */
.cover-image {
  width: 100%;
  height: 160px;
  background-color: #eee;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-placeholder { color: #999; font-size: 14px; }

.profile-main { padding: 0 20px 20px; }

.avatar-wrapper {
  margin-top: -45px;
  margin-bottom: 10px;
}
.avatar {
  width: 90px; height: 90px;
  border-radius: 50%;
  border: 4px solid #fff;
  object-fit: cover;
}
.avatar--empty {
  background-color: #ccc;
  display: block;
}

/* 編集・フォローボタン */
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
.bio { font-size: 14px; line-height: 1.6; color: #333; margin: 0; }

.section-divider { border: 0; border-top: 1px solid #eee; margin: 0; }

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  font-size: 14px;
}

.post-list { padding: 0 15px 50px; }

.status-text {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 30px 0;
}
.status-text.error { color: #f66; }

/* =============================
   編集モーダル
   ============================= */
.modal-overlay {
  /* 画面全体を覆う半透明の背景 */
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
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
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

.update-error {
  color: #f66;
  font-size: 13px;
  margin: 0;
}

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
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>