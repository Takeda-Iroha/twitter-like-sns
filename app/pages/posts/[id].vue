<!-- app/pages/posts/[id].vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePost } from '~/composables/usePost'
import type { Post } from '~/composables/usePost'

const isMenuOpen = ref(false)
const { fetchPostDetail, addLike, removeLike, createQuote, deleteQuote } = usePost()

const route = useRoute()
const postId = route.params.id as string

const post = ref<Post | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

// いいね状態のローカル管理
const isLiked = ref(false)
const likeCount = ref(0)
const isLiking = ref(false)

// 引用リツイート状態のローカル管理
const isQuoted = ref(false)
const quoteCount = ref(0)
const isQuoting = ref(false)

// 引用リツイートモーダルの状態管理
const showQuoteModal = ref(false)
const quoteContent = ref('')
const quoteError = ref('')

const loadPost = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await fetchPostDetail(postId)
    post.value = data
    isLiked.value = data.isLiked
    likeCount.value = data.likeCount
    isQuoted.value = data.isQuoted
    quoteCount.value = data.quoteCount
  } catch (error: any) {
    if (error.status === 404) {
      errorMessage.value = '投稿が見つかりません'
    } else if (error.status === 403) {
      errorMessage.value = 'この投稿を見る権限がありません'
    } else {
      errorMessage.value = '投稿を読み込めませんでした'
    }
  } finally {
    isLoading.value = false
  }
}

// いいね処理
const handleLike = async () => {
  if (isLiking.value) return
  isLiking.value = true
  try {
    if (isLiked.value) {
      const newCount = await removeLike(postId)
      isLiked.value = false
      likeCount.value = newCount
    } else {
      const newCount = await addLike(postId)
      isLiked.value = true
      likeCount.value = newCount
    }
  } catch (error: any) {
    if (error.status === 409) isLiked.value = true
  } finally {
    isLiking.value = false
  }
}

// 引用リツイートモーダルを開く
const openQuoteModal = () => {
  quoteContent.value = ''
  quoteError.value = ''
  showQuoteModal.value = true
}

// 引用リツイート送信処理
const handleQuote = async () => {
  if (!quoteContent.value.trim()) return
  isQuoting.value = true
  quoteError.value = ''

  try {
    await createQuote(postId, quoteContent.value)
    isQuoted.value = true
    quoteCount.value += 1
    showQuoteModal.value = false
  } catch (error: any) {
    if (error.status === 401) {
      quoteError.value = 'ログインが必要です'
    } else if (error.status === 400) {
      quoteError.value = '入力内容に誤りがあります'
    } else {
      quoteError.value = '引用リツイートに失敗しました'
    }
  } finally {
    isQuoting.value = false
  }
}

// 引用リツイート取り消し処理
const handleDeleteQuote = async () => {
  isQuoting.value = true
  try {
    await deleteQuote(postId)
    isQuoted.value = false
    quoteCount.value = Math.max(0, quoteCount.value - 1)
  } catch (error: any) {
    alert('引用リツイートの取り消しに失敗しました')
  } finally {
    isQuoting.value = false
  }
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${d} ${h}:${min}`
}

onMounted(() => {
  loadPost()
})
</script>

<template>
  <div class="post-detail-page">

    <AppHeader @open-menu="isMenuOpen = true" />
    <AppSideMenu :is-open="isMenuOpen" @close="isMenuOpen = false" />

    <main class="main-content">

      <div class="back-bar">
        <button class="back-btn" @click="$router.back()">← 戻る</button>
      </div>

      <p v-if="isLoading" class="status-text">読み込み中...</p>
      <p v-else-if="errorMessage" class="status-text error">{{ errorMessage }}</p>

      <template v-else-if="post">

        <!-- 投稿者情報：クリックでプロフィールへ -->
        <div
          class="author-section"
          @click="navigateTo(`/users/${post.author.username}`)"
        >
          <img
            v-if="post.author.profileImageUrl"
            :src="post.author.profileImageUrl"
            class="author-icon"
            alt="ユーザーアイコン"
          />
          <div v-else class="author-icon author-icon--empty" />
          <div class="author-info">
            <span class="author-name">{{ post.author.displayName || post.author.username }}</span>
            <span class="author-username">@{{ post.author.username }}</span>
          </div>
        </div>

        <!-- 投稿本文 -->
        <div class="post-content">
          <p class="post-text">{{ post.content }}</p>
        </div>

        <!-- 引用元の投稿 -->
        <div v-if="post.quotedMessage" class="quoted-post">
          <div class="quoted-author">
            <img
              v-if="post.quotedMessage.author.profileImageUrl"
              :src="post.quotedMessage.author.profileImageUrl"
              class="quoted-icon"
              alt=""
            />
            <div v-else class="quoted-icon quoted-icon--empty" />
            <span class="quoted-name">
              {{ post.quotedMessage.author.displayName || post.quotedMessage.author.username }}
            </span>
            <span class="quoted-username">@{{ post.quotedMessage.author.username }}</span>
          </div>
          <p class="quoted-content">{{ post.quotedMessage.content }}</p>
        </div>

        <!-- 投稿日時・編集済みフラグ -->
        <div class="post-meta">
          <span class="post-date">{{ formatDate(post.createdAt) }} に投稿</span>
          <span v-if="post.isEdited" class="edited-badge">✏️ 編集済み</span>
        </div>

        <hr class="divider" />

        <!-- 統計情報：リプライ数→引用数→いいね数→閲覧数 -->
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-num">{{ post.replyCount }}</span>
            <span class="stat-label">リプライ</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ quoteCount }}</span>
            <span class="stat-label">引用</span>
          </div>
          <div class="stat-item">
            <span class="stat-num" :class="{ 'liked-color': isLiked }">{{ likeCount }}</span>
            <span class="stat-label">いいね</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ post.viewCount }}</span>
            <span class="stat-label">閲覧</span>
          </div>
        </div>

        <hr class="divider" />

        <!-- アクションボタン行 -->
        <div class="action-row">

          <!-- リプライボタン（未実装） -->
          <button class="action-btn disabled-btn" disabled>
            <span>💬</span>
            <span class="coming-soon">リプライ（準備中）</span>
          </button>

          <!-- 引用リツイートボタン -->
          <button
            class="action-btn"
            :class="{ 'quoted': isQuoted }"
            :disabled="isQuoting"
            @click="isQuoted ? handleDeleteQuote() : openQuoteModal()"
          >
            <img src="/images/icon_retweet.svg" class="action-icon" alt="引用リツイート" />
            <span>{{ isQuoted ? '引用済み' : '引用' }}</span>
          </button>

          <!-- いいねボタン -->
          <button
            class="action-btn"
            :class="{ 'liked': isLiked }"
            :disabled="isLiking"
            @click="handleLike"
          >
            <img
              v-if="isLiked"
              src="/images/icon_heart_fill.svg"
              class="action-icon"
              alt="いいね済み"
            />
            <img
              v-else
              src="/images/icon_heart.svg"
              class="action-icon"
              alt="いいね"
            />
            <span>{{ isLiked ? 'いいね済み' : 'いいね' }}</span>
          </button>

        </div>

      </template>
    </main>

    <!-- 引用リツイートモーダル -->
    <div v-if="showQuoteModal" class="modal-overlay" @click.self="showQuoteModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">引用リツイート</h3>
          <button class="modal-close-btn" @click="showQuoteModal = false">×</button>
        </div>
        <div class="modal-body">
          <!-- 引用元の投稿プレビュー -->
          <div v-if="post" class="quote-preview">
            <p class="quote-preview-author">
              {{ post.author.displayName || post.author.username }}
            </p>
            <p class="quote-preview-content">{{ post.content }}</p>
          </div>
          <!-- コメント入力 -->
          <textarea
            v-model="quoteContent"
            class="quote-textarea"
            placeholder="コメントを入力（1〜250文字）"
            maxlength="250"
          ></textarea>
          <div class="char-count" :class="{ 'error': quoteContent.length > 250 }">
            {{ quoteContent.length }} / 250
          </div>
          <p v-if="quoteError" class="quote-error">{{ quoteError }}</p>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showQuoteModal = false">キャンセル</button>
          <button
            class="submit-btn"
            @click="handleQuote"
            :disabled="!quoteContent.trim() || quoteContent.length > 250 || isQuoting"
          >
            {{ isQuoting ? '送信中...' : '引用する' }}
          </button>
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
.main-content {
  max-width: 600px;
  margin: 0 auto;
  background-color: #fff;
  min-height: 100vh;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
}
.back-bar { padding: 12px 16px; border-bottom: 1px solid #eee; }
.back-btn { background: none; border: none; font-size: 15px; cursor: pointer; color: #6a21aa; padding: 0; }
.back-btn:hover { text-decoration: underline; }
.status-text { text-align: center; color: #999; font-size: 14px; padding: 30px 0; }
.status-text.error { color: #f66; }

/* 投稿者情報 */
.author-section { display: flex; align-items: center; gap: 12px; padding: 16px; cursor: pointer; }
.author-section:hover { background-color: #f9f0ff; }
.author-icon { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; display: block; flex-shrink: 0; }
.author-icon--empty { background-color: #ccc; }
.author-info { display: flex; flex-direction: column; }
.author-name { font-weight: bold; font-size: 16px; color: #333; }
.author-username { font-size: 13px; color: #999; }

/* 投稿本文 */
.post-content { padding: 16px; }
.post-text { font-size: 20px; line-height: 1.6; color: #333; margin: 0; white-space: pre-wrap; }

/* 引用元の投稿 */
.quoted-post { margin: 0 16px 16px; border: 1px solid #ddd; border-radius: 12px; padding: 12px; background-color: #fafafa; }
.quoted-author { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.quoted-icon { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; display: block; flex-shrink: 0; }
.quoted-icon--empty { background-color: #ccc; }
.quoted-name { font-weight: bold; font-size: 13px; color: #333; }
.quoted-username { font-size: 12px; color: #999; }
.quoted-content { margin: 0; font-size: 13px; color: #555; line-height: 1.5; }

/* 投稿日時 */
.post-meta { display: flex; align-items: center; gap: 12px; padding: 0 16px 16px; font-size: 13px; color: #999; }
.edited-badge { font-size: 12px; color: #aaa; }
.divider { border: 0; border-top: 1px solid #eee; margin: 0; }

/* 統計情報 */
.stats-row { display: flex; gap: 20px; padding: 14px 16px; flex-wrap: wrap; }
.stat-item { display: flex; align-items: center; gap: 4px; }
.stat-num { font-weight: bold; font-size: 16px; color: #333; }
.stat-num.liked-color { color: #e0245e; }
.stat-label { font-size: 13px; color: #999; }

/* アクションボタン */
.action-row { display: flex; gap: 8px; padding: 14px 16px; flex-wrap: wrap; }
.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid #c65bed;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  color: #c65bed;
  cursor: pointer;
  transition: background-color 0.2s;
}
.action-btn:hover { background-color: #f5e6ff; }
.action-btn.liked { background-color: #fce4f3; border-color: #e0245e; color: #e0245e; }
.action-btn.quoted { background-color: #e6f9f0; border-color: #17bf63; color: #17bf63; }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.action-icon { width: 18px; height: 18px; object-fit: contain; }
.disabled-btn { border-color: #ddd; color: #999; }
.disabled-btn:hover { background-color: transparent; }
.coming-soon { font-size: 11px; color: #bbb; }

/* 引用リツイートモーダル */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 2000; display: flex; justify-content: center; align-items: center; }
.modal { background: white; border-radius: 16px; width: 90%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #eee; }
.modal-title { margin: 0; font-size: 16px; font-weight: bold; }
.modal-close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #999; }
.modal-body { padding: 20px; }
.quote-preview { border: 1px solid #ddd; border-radius: 10px; padding: 12px; margin-bottom: 16px; background-color: #fafafa; }
.quote-preview-author { margin: 0 0 4px; font-size: 13px; font-weight: bold; color: #333; }
.quote-preview-content { margin: 0; font-size: 13px; color: #555; line-height: 1.5; }
.quote-textarea { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; outline: none; resize: none; min-height: 100px; }
.quote-textarea:focus { border-color: #c65bed; }
.char-count { text-align: right; font-size: 12px; color: #666; margin-top: 4px; }
.char-count.error { color: red; font-weight: bold; }
.quote-error { color: #f66; font-size: 13px; margin: 8px 0 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #eee; }
.cancel-btn { background: none; border: 1px solid #ddd; border-radius: 20px; padding: 8px 16px; font-size: 14px; cursor: pointer; }
.submit-btn { background-color: #c65bed; color: white; border: none; border-radius: 20px; padding: 8px 16px; font-size: 14px; font-weight: bold; cursor: pointer; }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>