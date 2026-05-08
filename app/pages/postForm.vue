<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePost } from '~/composables/usePost'

const isMenuOpen = ref(false)
const { createPost } = usePost()
const router = useRouter()

// ----------------------------------------
// 投稿内容の状態管理
// ----------------------------------------

// 投稿本文
const postContent = ref('')

// 公開範囲（初期値は全員公開）
const visibility = ref<'public' | 'followers'>('public')

// 公開範囲ドロップダウンの表示・非表示
const showVisibilityMenu = ref(false)

// 添付画像ファイルの一覧
const attachedImages = ref<File[]>([])

// 添付画像のプレビューURL一覧
// URL.createObjectURL()でローカルファイルをブラウザ上で表示するURLを作る
const previewUrls = ref<string[]>([])

// ローディング・エラー管理
const isSubmitting = ref(false)
const errorMessage = ref('')

// ----------------------------------------
// 公開範囲ボタンの表示テキスト
// computedはvisibilityが変わると自動で再計算される
// ----------------------------------------
const visibilityLabel = computed(() => {
  return visibility.value === 'public' ? ' 全員' : ' フォロワーのみ'
})

// ----------------------------------------
// 画像添付処理
// inputタグのchangeイベントで呼ばれる
// ----------------------------------------
const handleImageSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files) return

  // 選択されたファイルを配列に変換
  const files = Array.from(input.files)

  // 画像は最大4枚まで
  const remaining = 4 - attachedImages.value.length
  const newFiles = files.slice(0, remaining)

  attachedImages.value = [...attachedImages.value, ...newFiles]

  // プレビュー用URLを生成して追加
  const newUrls = newFiles.map(file => URL.createObjectURL(file))
  previewUrls.value = [...previewUrls.value, ...newUrls]
}

// ----------------------------------------
// 画像削除処理
// プレビューの×ボタンで呼ばれる
// ----------------------------------------
const removeImage = (index: number) => {
  // ?? '' は「undefinedまたはnullの場合は空文字を使う」という意味
  // revokeObjectURLに空文字を渡しても問題なく動く
  URL.revokeObjectURL(previewUrls.value[index] ?? '')
  attachedImages.value = attachedImages.value.filter((_, i) => i !== index)
  previewUrls.value = previewUrls.value.filter((_, i) => i !== index)
}

// ----------------------------------------
// 投稿送信処理
// ----------------------------------------
const handleCreatePost = async () => {
  if (!postContent.value.trim()) return

  isSubmitting.value = true
  errorMessage.value = ''

  // ↓↓↓ 一時的に追加 ↓↓↓
  console.log('トークン確認:', useCookie('accessToken').value)
  // ↑↑↑ ここまで ↑↑↑

  try {
    await createPost({
      content: postContent.value,
      visibility: visibility.value,
      // 画像URLは画像アップロードAPI実装後に差し替える
      imageUrls: []
    })

    // 投稿成功したらホームに戻る
    navigateTo('/')

  } catch (error: any) {
  console.log('エラー詳細:', error)
  console.log('ステータス:', error.status)
  console.log('メッセージ:', error.message)
  if (error.status === 401) {
    errorMessage.value = 'ログインが必要です'
  } else if (error.status === 400) {
    errorMessage.value = '入力内容に誤りがあります'
  } else {
    errorMessage.value = '投稿に失敗しました'
  }
}
}

// キャンセルボタン
const goBack = () => { router.back() }

// 画面遷移
const goToPostForm = () => { navigateTo('/postForm') }
const goToHome = () => { navigateTo('/') }
const goToMypage = () => { navigateTo('/mypage') }
</script>

<template>
  <div class="create-post-page">
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

    <div class="post-content-wrapper">

      <!-- 上部ボタン行 -->
      <div class="post-btn-group">
        <button @click="goBack" class="cancel-btn">キャンセル</button>
        <div class="post-actions">
          <button
            @click="handleCreatePost"
            class="post-btn"
            :disabled="!postContent.trim() || postContent.length > 250 || isSubmitting"
          >
            <!-- isSubmittingがtrueの間は「投稿中...」と表示 -->
            {{ isSubmitting ? '投稿中...' : '投稿する' }}
          </button>
          <div class="char-count" :class="{ 'error': postContent.length > 250 }">
            {{ postContent.length }} / 250
          </div>
        </div>
      </div>

      <!-- エラーメッセージ -->
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <!-- 投稿入力エリア -->
      <div class="post-form-content">
        <div class="user-icon"></div>
        <textarea
          v-model="postContent"
          class="post-textarea"
          placeholder="今なにしてる？"
        ></textarea>
      </div>

      <!-- 画像プレビュー -->
      <!-- previewUrlsに画像があるときだけ表示 -->
      <div v-if="previewUrls.length > 0" class="image-preview-list">
        <div
          v-for="(url, index) in previewUrls"
          :key="index"
          class="image-preview-item"
        >
          <img :src="url" class="preview-image" alt="添付画像" />
          <!-- ×ボタンで画像を削除 -->
          <button class="remove-image-btn" @click="removeImage(index)">×</button>
        </div>
      </div>

      <!-- 下部アクションバー -->
      <div class="bottom-actions">

        <!-- 画像添付ボタン -->
        <!-- inputを隠してlabelでクリックを受け取る -->
        <!-- 4枚以上のときはdisabledにする -->
        <label
          class="action-btn"
          :class="{ 'disabled': attachedImages.length >= 4 }"
        >
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

        <!-- 公開範囲選択ボタン -->
        <div class="visibility-wrapper">
          <button
            class="action-btn"
            @click="showVisibilityMenu = !showVisibilityMenu"
          >
            {{ visibilityLabel }}
          </button>

          <!-- ドロップダウンメニュー -->
          <!-- showVisibilityMenuがtrueのときだけ表示 -->
          <div v-if="showVisibilityMenu" class="visibility-menu">
            <div
              class="visibility-option"
              :class="{ 'active': visibility === 'public' }"
              @click="visibility = 'public'; showVisibilityMenu = false"
            >
              🌍 全員
            </div>
            <div
              class="visibility-option"
              :class="{ 'active': visibility === 'followers' }"
              @click="visibility = 'followers'; showVisibilityMenu = false"
            >
              👥 フォロワーのみ
            </div>
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

.post-content-wrapper {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 12px;
  border-left: 1px solid rgba(198, 91, 237, 0.3);
  border-right: 1px solid rgba(198, 91, 237, 0.3);
  background-color: #fff;
  min-height: calc(100vh - 60px);
}

.post-btn-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
}

.cancel-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
}

.post-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.post-btn {
  background-color: #c65bed;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.3s;
}
.post-btn:disabled {
  background-color: #979da1;
  cursor: not-allowed;
  opacity: 0.6;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #666;
}
.char-count.error { color: red; font-weight: bold; }

.error-message {
  color: #f66;
  font-size: 13px;
  text-align: center;
  margin: 0 0 8px;
}

.post-form-content {
  display: flex;
  padding: 10px;
  gap: 12px;
}

.user-icon {
  width: 60px; height: 60px;
  border-radius: 50%;
  flex-shrink: 0;
  background-image: url('/images/user_photo.jpg');
  background-size: cover;
  background-position: center;
  background-color: #ddd;
}

.post-textarea {
  flex: 1;
  border: none;
  outline: none;
  font-size: 18px;
  resize: none;
  min-height: 200px;
  padding-top: 10px;
  background-color: transparent;
}

/* 画像プレビュー */
.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 10px 10px;
}

.image-preview-item {
  position: relative;
  width: calc(50% - 4px);
}

.preview-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 10px;
}

.remove-image-btn {
  /* ×ボタンを画像の右上に重ねて表示 */
  position: absolute;
  top: 6px; right: 6px;
  width: 24px; height: 24px;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 下部アクションバー */
.bottom-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  border-top: 1px solid #eee;
}

.action-btn {
  background: none;
  border: 1px solid #c65bed;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px;
  color: #c65bed;
  cursor: pointer;
}

.action-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 公開範囲ドロップダウン */
.visibility-wrapper {
  position: relative;
}

.visibility-menu {
  position: absolute;
  bottom: 40px; left: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  z-index: 10;
  min-width: 160px;
}

.visibility-option {
  padding: 12px 16px;
  font-size: 14px;
  cursor: pointer;
}
.visibility-option:hover { background-color: #f5f0ff; }
.visibility-option.active {
  color: #c65bed;
  font-weight: bold;
}
</style>