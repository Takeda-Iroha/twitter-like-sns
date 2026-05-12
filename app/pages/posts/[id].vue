<!-- app/pages/posts/[id].vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usePost } from '~/composables/usePost'
import type { Post, Reply } from '~/composables/usePost'
import { useUser } from '~/composables/useUser'

const isMenuOpen = ref(false)
const { fetchPostDetail, addLike, removeLike, createQuote, deleteQuote, createPost, fetchReplies } = usePost()
const { fetchUserProfile } = useUser()

const route = useRoute()
const router = useRouter()
const postId = route.params.id as string

const post = ref<Post | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

const isLiked = ref(false)
const likeCount = ref(0)
const isLiking = ref(false)

const isQuoted = ref(false)
const quoteCount = ref(0)
const isQuoting = ref(false)

const showQuoteModal = ref(false)
const quoteContent = ref('')
const quoteError = ref('')

const replies = ref<Reply[]>([])
const isRepliesLoading = ref(false)
const repliesError = ref('')
const replyContent = ref('')
const isReplying = ref(false)
const replyError = ref('')
const replyCount = ref(0)

const myProfileImageUrl = ref('')
const loggedInUsername = useCookie('username').value

// ----------------------------------------
// 自分の投稿かどうか・引用リツイートかどうか
// ----------------------------------------
const isMyPost = computed(() => post.value?.author.username === loggedInUsername)
const isMyQuotePost = computed(() => isMyPost.value && post.value?.quotedMessage != null)

// ----------------------------------------
// 三点リーダーメニューの状態管理
// ----------------------------------------
const showMenu = ref(false)
const isDeleting = ref(false)

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
    replyCount.value = data.replyCount
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

const loadReplies = async () => {
  isRepliesLoading.value = true
  repliesError.value = ''
  try {
    replies.value = await fetchReplies(postId)
  } catch {
    repliesError.value = 'リプライを読み込めませんでした'
  } finally {
    isRepliesLoading.value = false
  }
}

const loadMyProfile = async () => {
  if (!loggedInUsername) return
  try {
    const profile = await fetchUserProfile(loggedInUsername)
    myProfileImageUrl.value = profile.profileImageUrl ?? ''
  } catch { /* 失敗しても問題なし */ }
}

// いいね処理（統計情報のハートアイコンクリックから）
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

// 引用リツイートモーダルを開く（統計情報のリツイートアイコンクリックから）
const openQuoteModal = () => {
  quoteContent.value = ''
  quoteError.value = ''
  showQuoteModal.value = true
}

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

const handleDeleteQuote = async () => {
  isQuoting.value = true
  try {
    await deleteQuote(postId)
    isQuoted.value = false
    quoteCount.value = Math.max(0, quoteCount.value - 1)
  } catch {
    alert('引用リツイートの取り消しに失敗しました')
  } finally {
    isQuoting.value = false
  }
}

// ----------------------------------------
// 三点リーダーから引用リツイート削除
// 自分の引用リツイート投稿を削除する
// 削除後はホームへ遷移
// ----------------------------------------
const handleDeleteQuotePost = async () => {
  if (!post.value?.quotedMessage) return
  showMenu.value = false
  isDeleting.value = true
  try {
    await deleteQuote(post.value.quotedMessage.id)
    router.back()
  } catch {
    alert('削除に失敗しました')
  } finally {
    isDeleting.value = false
  }
}

const handleReply = async () => {
  if (!replyContent.value.trim()) return
  isReplying.value = true
  replyError.value = ''
  try {
    await createPost({
      content: replyContent.value,
      visibility: 'public',
      replyToId: postId
    })
    replyContent.value = ''
    replyCount.value += 1
    await loadReplies()
  } catch (error: any) {
    if (error.status === 401) {
      replyError.value = 'ログインが必要です'
    } else {
      replyError.value = 'リプライに失敗しました'
    }
  } finally {
    isReplying.value = false
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

const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 1000 / 60)
  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}時間前`
  return `${Math.floor(diffMin / 60 / 24)}日前`
}

onMounted(async () => {
  await loadPost()
  await loadReplies()
  await loadMyProfile()
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

        <!-- 投稿者情報：アイコンのみクリックでプロフィールへ -->
        <div class="author-section">
          <!-- アイコンのみクリック可能 -->
          <div
            class="author-icon-wrapper"
            @click="navigateTo(`/users/${post.author.username}`)"
          >
            <img
              v-if="post.author.profileImageUrl"
              :src="post.author.profileImageUrl"
              class="author-icon"
              alt="ユーザーアイコン"
            />
            <div v-else class="author-icon author-icon--empty" />
          </div>
          <div class="author-info">
            <span class="author-name">{{ post.author.displayName || post.author.username }}</span>
            <span class="author-username">@{{ post.author.username }}</span>
          </div>

          <!-- 三点リーダーボタン（自分の引用リツイートのみ） -->
          <div v-if="isMyQuotePost" class="post-menu-btn">
            <button class="menu-dots-btn" @click="showMenu = !showMenu">•••</button>
            <div v-if="showMenu" class="menu-dropdown">
              <div
                class="menu-item delete-item"
                @click="handleDeleteQuotePost"
              >
                🗑 引用リツイートを削除
              </div>
            </div>
          </div>
        </div>

        <!-- 投稿本文 -->
        <div class="post-content">
          <p class="post-text">{{ post.content }}</p>
        </div>

        <!-- 引用元の投稿（引用リツイートの場合のみ） -->
        <div
          v-if="post.quotedMessage"
          class="quoted-post"
          @click="navigateTo(`/posts/${post.quotedMessage.id}`)"
        >
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

        <!-- 投稿日時・編集済みフラグ（右寄せ） -->
        <div class="post-meta">
          <span v-if="post.isEdited" class="edited-badge">✏️ 編集済み</span>
          <span class="post-date">{{ formatDate(post.createdAt) }} に投稿</span>
        </div>

        <hr class="divider" />

        <!-- 統計情報（中央寄せ・アイコンをクリック可能に） -->
        <div class="stats-row">
          <!-- リプライ数（クリックでリプライ入力欄へスクロール） -->
          <div class="stat-item">
            <img src="/images/icon_reply.svg" class="stat-icon" alt="リプライ" />
            <span class="stat-num">{{ replyCount > 0 ? replyCount : '' }}</span>
          </div>

          <!-- 引用数（クリックで引用モーダルを開く） -->
          <div class="stat-item stat-item--clickable" @click="isQuoted ? handleDeleteQuote() : openQuoteModal()">
            <img
              src="/images/icon_retweet.svg"
              class="stat-icon"
              :class="{ 'icon-purple': isQuoted }"
              alt="引用"
            />
            <span class="stat-num" :class="{ 'count-purple': isQuoted }">
              {{ quoteCount > 0 ? quoteCount : '' }}
            </span>
          </div>

          <!-- いいね数（クリックでいいね） -->
          <div class="stat-item stat-item--clickable" @click="handleLike">
            <img
              v-if="isLiked"
              src="/images/icon_heart_fill.svg"
              class="stat-icon icon-purple"
              alt="いいね済み"
            />
            <img
              v-else
              src="/images/icon_heart.svg"
              class="stat-icon"
              alt="いいね"
            />
            <span class="stat-num" :class="{ 'count-purple': isLiked }">
              {{ likeCount > 0 ? likeCount : '' }}
            </span>
          </div>

          <!-- 閲覧数 -->
          <div class="stat-item">
            <img src="/images/icon_views.svg" class="stat-icon" alt="閲覧" />
            <span class="stat-num">{{ post.viewCount > 0 ? post.viewCount : '' }}</span>
          </div>
        </div>

        <hr class="divider" />

        <!-- リプライ入力欄 -->
        <div class="reply-input-section">
          <div class="reply-input-row">
            <img
              v-if="myProfileImageUrl"
              :src="myProfileImageUrl"
              class="reply-my-icon"
              alt="自分のアイコン"
            />
            <div v-else class="reply-my-icon reply-my-icon--empty" />
            <div class="reply-input-area">
              <textarea
                v-model="replyContent"
                class="reply-textarea"
                placeholder="返信を入力..."
                rows="3"
                maxlength="250"
              ></textarea>
              <div class="reply-char-count" :class="{ 'error': replyContent.length > 250 }">
                {{ replyContent.length }} / 250
              </div>
            </div>
          </div>
          <p v-if="replyError" class="reply-error">{{ replyError }}</p>
          <div class="reply-submit-row">
            <button
              class="reply-submit-btn"
              :disabled="!replyContent.trim() || replyContent.length > 250 || isReplying"
              @click="handleReply"
            >
              {{ isReplying ? '送信中...' : '返信する' }}
            </button>
          </div>
        </div>

        <hr class="divider" />

        <!-- リプライ一覧 -->
        <div class="replies-section">
          <p v-if="isRepliesLoading" class="status-text">読み込み中...</p>
          <p v-else-if="repliesError" class="status-text error">{{ repliesError }}</p>
          <p v-else-if="replies.length === 0" class="status-text">まだリプライはありません</p>

          <div
            v-else
            v-for="reply in replies"
            :key="reply.id"
            class="reply-item"
          >
            <div class="reply-content">
              <div class="reply-header">
                <div
                  class="reply-icon-wrapper"
                  @click="navigateTo(`/users/${reply.author.username}`)"
                >
                  <img
                    v-if="reply.author.profileImageUrl"
                    :src="reply.author.profileImageUrl"
                    class="reply-author-icon"
                    alt=""
                  />
                  <div v-else class="reply-author-icon reply-author-icon--empty" />
                </div>
                <div class="reply-author-info">
                  <span class="reply-author-name">
                    {{ reply.author.displayName || reply.author.username }}
                  </span>
                  <span class="reply-author-time">
                    ・{{ formatRelativeTime(new Date(reply.createdAt)) }}
                  </span>
                </div>
              </div>

              <p class="reply-text" @click="navigateTo(`/posts/${reply.id}`)">
                {{ reply.content }}
              </p>

              <div class="reply-actions-row">
                <div class="reply-action-item">
                  <button class="reply-action-btn" @click="navigateTo(`/posts/${reply.id}`)">
                    <img src="/images/icon_reply.svg" class="reply-action-icon" alt="リプライ" />
                  </button>
                  <span class="reply-action-count">
                    {{ reply.replyCount > 0 ? reply.replyCount : '' }}
                  </span>
                </div>
                <div class="reply-action-item">
                  <button class="reply-action-btn" @click="navigateTo(`/posts/${reply.id}`)">
                    <img
                      src="/images/icon_retweet.svg"
                      class="reply-action-icon"
                      :class="{ 'icon-purple': reply.isQuoted }"
                      alt="引用"
                    />
                  </button>
                  <span class="reply-action-count" :class="{ 'count-purple': reply.isQuoted }">
                    {{ reply.quoteCount > 0 ? reply.quoteCount : '' }}
                  </span>
                </div>
                <div class="reply-action-item">
                  <button class="reply-action-btn" @click="navigateTo(`/posts/${reply.id}`)">
                    <img
                      v-if="reply.isLiked"
                      src="/images/icon_heart_fill.svg"
                      class="reply-action-icon icon-purple"
                      alt="いいね済み"
                    />
                    <img
                      v-else
                      src="/images/icon_heart.svg"
                      class="reply-action-icon"
                      alt="いいね"
                    />
                  </button>
                  <span class="reply-action-count" :class="{ 'count-purple': reply.isLiked }">
                    {{ reply.likeCount > 0 ? reply.likeCount : '' }}
                  </span>
                </div>
                <div class="reply-action-item">
                  <img src="/images/icon_views.svg" class="reply-action-icon" alt="閲覧数" />
                  <span class="reply-action-count">
                    {{ reply.viewCount > 0 ? reply.viewCount : '' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
          <div v-if="post" class="quote-preview">
            <div class="quote-preview-author-row">
              <img
                v-if="post.author.profileImageUrl"
                :src="post.author.profileImageUrl"
                class="quote-preview-icon"
                alt=""
              />
              <div v-else class="quote-preview-icon quote-preview-icon--empty" />
              <span class="quote-preview-name">
                {{ post.author.displayName || post.author.username }}
              </span>
              <span class="quote-preview-username">@{{ post.author.username }}</span>
            </div>
            <p class="quote-preview-content">{{ post.content }}</p>
          </div>
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

/* 投稿者情報：アイコンのみクリック可能 */
.author-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  position: relative;
}
.author-icon-wrapper {
  cursor: pointer;
  flex-shrink: 0;
}
.author-icon-wrapper:hover .author-icon { opacity: 0.8; }
.author-icon { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; display: block; }
.author-icon--empty { background-color: #ccc; width: 48px; height: 48px; border-radius: 50%; }
.author-info { display: flex; flex-direction: column; flex: 1; }
.author-name { font-weight: bold; font-size: 16px; color: #333; }
.author-username { font-size: 13px; color: #999; }

/* 三点リーダーボタン */
.post-menu-btn { position: relative; }
.menu-dots-btn {
  background: none; border: none; font-size: 14px;
  color: #aaa; cursor: pointer; padding: 4px 6px;
  border-radius: 50%; letter-spacing: 1px;
}
.menu-dots-btn:hover { background-color: #f0e6fa; color: #6a21aa; }
.menu-dropdown {
  position: absolute;
  top: 28px; right: 0;
  background: white; border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  min-width: 180px; z-index: 100; overflow: hidden;
}
.menu-item { padding: 12px 16px; font-size: 14px; cursor: pointer; }
.menu-item:hover { background-color: #f5f0ff; }
.delete-item { color: #f66; }
.delete-item:hover { background-color: #fff0f0; }

.post-content { padding: 16px; }
.post-text { font-size: 20px; line-height: 1.6; color: #333; margin: 0; white-space: pre-wrap; }

.quoted-post {
  margin: 0 16px 16px; border: 1px solid #e0e0e0;
  border-radius: 12px; padding: 12px; background-color: #f8f8f8; cursor: pointer;
}
.quoted-post:hover { background-color: #f0e6ff; }
.quoted-author { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.quoted-icon { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; display: block; flex-shrink: 0; }
.quoted-icon--empty { background-color: #ccc; width: 20px; height: 20px; border-radius: 50%; }
.quoted-name { font-weight: bold; font-size: 12px; color: #555; }
.quoted-username { font-size: 11px; color: #aaa; }
.quoted-content { margin: 0; font-size: 13px; color: #777; line-height: 1.5; }

.post-meta {
  display: flex; justify-content: flex-end; align-items: center;
  gap: 12px; padding: 0 16px 16px; font-size: 13px; color: #999;
}
.edited-badge { font-size: 12px; color: #aaa; }
.divider { border: 0; border-top: 1px solid #eee; margin: 0; }

/* 統計情報（中央寄せ） */
.stats-row {
  display: flex; justify-content: center;
  gap: 24px; padding: 14px 16px;
}
.stat-item { display: flex; align-items: center; gap: 4px; }
.stat-item--clickable {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background-color 0.2s;
}
.stat-item--clickable:hover { background-color: #f0e6fa; }
.stat-icon { width: 20px; height: 20px; object-fit: contain; }
.stat-num { font-size: 14px; color: #666; min-width: 16px; }
.stat-num.count-purple { color: #6a21aa; }

.icon-purple {
  filter: brightness(0) saturate(100%) invert(27%) sepia(90%) saturate(500%) hue-rotate(250deg) brightness(0.8);
}
.count-purple { color: #6a21aa; }

/* リプライ入力欄 */
.reply-input-section { padding: 16px; }
.reply-input-row { display: flex; gap: 12px; align-items: flex-start; }
.reply-my-icon { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; display: block; }
.reply-my-icon--empty { background-color: #ddd; width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
.reply-input-area { flex: 1; }
.reply-textarea {
  width: 100%; border: 1px solid #ddd; border-radius: 8px;
  padding: 10px 12px; font-size: 14px; resize: none; outline: none;
  box-sizing: border-box; font-family: inherit;
}
.reply-textarea:focus { border-color: #c65bed; }
.reply-char-count { text-align: right; font-size: 11px; color: #999; margin-top: 4px; }
.reply-char-count.error { color: red; }
.reply-error { color: #f66; font-size: 13px; margin: 4px 0; }
.reply-submit-row { display: flex; justify-content: flex-end; margin-top: 10px; }
.reply-submit-btn {
  background-color: #c65bed; color: white; border: none;
  border-radius: 20px; padding: 8px 20px; font-size: 14px;
  font-weight: bold; cursor: pointer;
}
.reply-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* リプライ一覧 */
.replies-section { padding: 0 0 50px; }
.reply-item { padding: 12px 16px; border-bottom: 1px solid #eee; }
.reply-item:hover { background-color: #fdf8ff; }
.reply-content { flex: 1; }
.reply-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.reply-icon-wrapper { cursor: pointer; flex-shrink: 0; }
.reply-author-icon { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; display: block; }
.reply-author-icon--empty { background-color: #ddd; width: 36px; height: 36px; border-radius: 50%; }
.reply-author-info { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.reply-author-name { font-weight: bold; font-size: 13px; color: #333; }
.reply-author-time { font-size: 12px; color: #999; }
.reply-text { margin: 0 0 8px; font-size: 14px; color: #333; line-height: 1.5; cursor: pointer; }
.reply-text:hover { color: #6a21aa; }
.reply-actions-row { display: flex; justify-content: center; gap: 20px; align-items: center; }
.reply-action-item { display: flex; align-items: center; gap: 4px; }
.reply-action-btn {
  background: none; border: none; padding: 4px;
  cursor: pointer; display: flex; align-items: center; border-radius: 50%;
}
.reply-action-btn:hover { background-color: #f0e6fa; }
.reply-action-icon { width: 16px; height: 16px; object-fit: contain; }
.reply-action-count { font-size: 12px; color: #666; min-width: 14px; }

/* モーダル */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 2000; display: flex; justify-content: center; align-items: center; }
.modal { background: white; border-radius: 16px; width: 90%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #eee; }
.modal-title { margin: 0; font-size: 16px; font-weight: bold; }
.modal-close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #999; }
.modal-body { padding: 20px; }
.quote-preview { border: 1px solid #e0e0e0; border-radius: 10px; padding: 12px; margin-bottom: 16px; background-color: #f8f8f8; }
.quote-preview-author-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.quote-preview-icon { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; display: block; flex-shrink: 0; }
.quote-preview-icon--empty { background-color: #ccc; width: 24px; height: 24px; border-radius: 50%; }
.quote-preview-name { font-weight: bold; font-size: 13px; color: #333; }
.quote-preview-username { font-size: 12px; color: #999; }
.quote-preview-content { margin: 0; font-size: 13px; color: #555; line-height: 1.5; }
.quote-textarea { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; outline: none; resize: none; min-height: 100px; font-family: inherit; }
.quote-textarea:focus { border-color: #c65bed; }
.char-count { text-align: right; font-size: 12px; color: #666; margin-top: 4px; }
.char-count.error { color: red; font-weight: bold; }
.quote-error { color: #f66; font-size: 13px; margin: 8px 0 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #eee; }
.cancel-btn { background: none; border: 1px solid #ddd; border-radius: 20px; padding: 8px 16px; font-size: 14px; cursor: pointer; }
.submit-btn { background-color: #c65bed; color: white; border: none; border-radius: 20px; padding: 8px 16px; font-size: 14px; font-weight: bold; cursor: pointer; }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>