<!-- app/components/PostCard.vue -->
<script setup lang="ts">
import type { Post } from '~/composables/usePost'
import { usePost } from '~/composables/usePost'
import { useUser } from '~/composables/useUser'

const props = defineProps<{
  post: Post
}>()

const { addLike, removeLike, createPost, createQuote, deleteQuote } = usePost()
const { fetchUserProfile } = useUser()

// いいね状態のローカル管理
const isLiked = ref(props.post.isLiked)
const likeCount = ref(props.post.likeCount)
const isLiking = ref(false)

// 引用リツイート状態のローカル管理
const quoteCount = ref(props.post.quoteCount)
const isQuoted = ref(props.post.isQuoted)
const isQuoting = ref(false)

// リプライ数のローカル管理
const replyCount = ref(props.post.replyCount)

// リプライ入力欄の表示・非表示
const showReplyForm = ref(false)
const replyContent = ref('')
const isReplying = ref(false)
const replyError = ref('')

// ----------------------------------------
// 引用リツイートモーダルの状態管理
// ----------------------------------------
const showQuoteModal = ref(false)
const quoteContent = ref('')
const quoteError = ref('')

// ----------------------------------------
// 三点リーダーメニューの状態管理
// ----------------------------------------
const showMenu = ref(false)
const isDeleting = ref(false)

// ----------------------------------------
// ログイン中のユーザー情報
// ----------------------------------------
const loggedInUsername = useCookie('username').value
const isMyPost = computed(() => props.post.author.username === loggedInUsername)

// ----------------------------------------
// 自分の引用リツイートかどうか
// quotedMessageがあり、かつ自分の投稿の場合
// ----------------------------------------
const isMyQuotePost = computed(() =>
  isMyPost.value && props.post.quotedMessage != null
)

// 自分のアイコン画像（リプライ入力欄用）
const myProfileImageUrl = ref('')
const loadMyProfile = async () => {
  if (!loggedInUsername) return
  try {
    const profile = await fetchUserProfile(loggedInUsername)
    myProfileImageUrl.value = profile.profileImageUrl ?? ''
  } catch { /* 失敗しても問題なし */ }
}

// いいね処理
const handleLike = async () => {
  if (isLiking.value) return
  isLiking.value = true
  try {
    if (isLiked.value) {
      const newCount = await removeLike(props.post.id)
      isLiked.value = false
      likeCount.value = newCount
    } else {
      const newCount = await addLike(props.post.id)
      isLiked.value = true
      likeCount.value = newCount
    }
  } catch (error: any) {
    if (error.status === 409) isLiked.value = true
  } finally {
    isLiking.value = false
  }
}

const goToProfile = (event: Event) => {
  event.stopPropagation()
  navigateTo(`/users/${props.post.author.username}`)
}

const goToDetail = () => {
  navigateTo(`/posts/${props.post.id}`)
}

const handleLikeClick = (event: Event) => {
  event.stopPropagation()
  handleLike()
}

// ----------------------------------------
// 引用リツイートボタンクリック
// → モーダルを開く（詳細ページへは遷移しない）
// ----------------------------------------
const handleQuoteClick = (event: Event) => {
  event.stopPropagation()
  if (isQuoted.value) {
    // 引用済みの場合は取り消し確認
    handleDeleteQuoteFromCard()
  } else {
    quoteContent.value = ''
    quoteError.value = ''
    showQuoteModal.value = true
  }
}

// 引用リツイート送信処理
const handleQuoteSubmit = async (event: Event) => {
  event.stopPropagation()
  if (!quoteContent.value.trim()) return
  isQuoting.value = true
  quoteError.value = ''
  try {
    await createQuote(props.post.id, quoteContent.value)
    isQuoted.value = true
    quoteCount.value += 1
    showQuoteModal.value = false
    quoteContent.value = ''
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

// 引用リツイート取り消し（カードのリツイートボタンから）
const handleDeleteQuoteFromCard = async () => {
  isQuoting.value = true
  try {
    await deleteQuote(props.post.id)
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
// 自分の引用リツイート投稿に対して
// その投稿そのものを削除する（元投稿のIDを使う）
// ----------------------------------------
const handleDeleteQuotePost = async (event: Event) => {
  event.stopPropagation()
  showMenu.value = false
  if (!props.post.quotedMessage) return
  isDeleting.value = true
  try {
    // 引用リツイート削除：元投稿のIDをパスパラメータに使う
    // この投稿自体が「元投稿に対する引用」なので
    // 元投稿のIDではなく、この投稿の replyToId 的な概念として
    // 引用削除は「この投稿のquotedMessage.id」を使う
    await deleteQuote(props.post.quotedMessage.id)
    // 削除後はページをリロードまたは親に通知
    navigateTo('/', { replace: true })
  } catch {
    alert('削除に失敗しました')
  } finally {
    isDeleting.value = false
  }
}

// リプライボタンクリック
const handleReplyClick = (event: Event) => {
  event.stopPropagation()
  showReplyForm.value = !showReplyForm.value
  if (!showReplyForm.value) {
    replyContent.value = ''
    replyError.value = ''
  }
}

// リプライ送信処理
const handleReplySubmit = async (event: Event) => {
  event.stopPropagation()
  if (!replyContent.value.trim()) return
  isReplying.value = true
  replyError.value = ''
  try {
    await createPost({
      content: replyContent.value,
      visibility: 'public',
      replyToId: props.post.id
    })
    replyContent.value = ''
    showReplyForm.value = false
    replyCount.value += 1
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

const handleReplyCancel = (event: Event) => {
  event.stopPropagation()
  showReplyForm.value = false
  replyContent.value = ''
  replyError.value = ''
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

onMounted(() => {
  loadMyProfile()
})
</script>

<template>
  <article class="post-card" @click="goToDetail">
    <div class="post-inner">

      <!-- リプライ先ラベル -->
      <div
        v-if="post.replyToId"
        class="reply-to-label"
        @click.stop="navigateTo(`/posts/${post.replyToId}`)"
      >
        💬 元の投稿を見る
      </div>

      <!-- カードヘッダー -->
      <div class="post-header">
        <!-- 三点リーダーボタン（自分の投稿のみ） -->
        <div v-if="isMyPost" class="post-menu-btn" @click.stop>
          <button class="menu-dots-btn" @click="showMenu = !showMenu">•••</button>
          <!-- ドロップダウンメニュー -->
          <div v-if="showMenu" class="menu-dropdown">
            <div
              v-if="isMyQuotePost"
              class="menu-item delete-item"
              @click="handleDeleteQuotePost"
            >
              引用リツイートを削除
            </div>
            <div v-else class="menu-item disabled-item">
              （編集・削除は準備中）
            </div>
          </div>
        </div>

        <div class="icon-wrapper" @click="goToProfile">
          <img
            v-if="post.author.profileImageUrl"
            :src="post.author.profileImageUrl"
            class="post-user-icon"
            alt="ユーザーアイコン"
          />
          <div v-else class="post-user-icon post-user-icon--empty" />
        </div>

        <div class="post-user-info">
          <div class="name-row">
            <span class="p-user-name">
              {{ post.author.displayName || post.author.username }}
            </span>
            <span class="post-time-inline">
              ・{{ formatRelativeTime(new Date(post.createdAt)) }}
            </span>
          </div>
          <span class="p-user-id">@{{ post.author.username }}</span>
        </div>
      </div>

      <!-- 投稿本文 -->
      <div class="post-body">
        <p>{{ post.content }}</p>
      </div>

      <!-- 引用元の投稿（引用リツイートの場合のみ表示） -->
      <div
        v-if="post.quotedMessage"
        class="quoted-post"
        @click.stop="navigateTo(`/posts/${post.quotedMessage.id}`)"
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

      <!-- カードフッター -->
      <div class="post-footer" @click.stop>
        <div class="action-area">

          <!-- リプライボタン＋リプライ数 -->
          <div class="action-item">
            <button
              class="action-button"
              :class="{ 'is-active': showReplyForm }"
              @click="handleReplyClick"
            >
              <img
                src="/images/icon_reply.svg"
                class="action-icon"
                :class="{ 'icon-purple': showReplyForm }"
                alt="リプライ"
              />
            </button>
            <span class="action-count" :class="{ 'count-purple': showReplyForm }">
              {{ replyCount > 0 ? replyCount : '' }}
            </span>
          </div>

          <!-- 引用リツイートボタン＋引用数 -->
          <div class="action-item">
            <button
              class="action-button"
              :disabled="isQuoting"
              @click="handleQuoteClick"
            >
              <img
                src="/images/icon_retweet.svg"
                class="action-icon"
                :class="{ 'icon-purple': isQuoted }"
                alt="引用リツイート"
              />
            </button>
            <span class="action-count" :class="{ 'count-purple': isQuoted }">
              {{ quoteCount > 0 ? quoteCount : '' }}
            </span>
          </div>

          <!-- いいねボタン＋いいね数 -->
          <div class="action-item">
            <button
              class="action-button"
              :disabled="isLiking"
              @click="handleLikeClick"
            >
              <img
                v-if="isLiked"
                src="/images/icon_heart_fill.svg"
                class="action-icon icon-purple"
                alt="いいね済み"
              />
              <img
                v-else
                src="/images/icon_heart.svg"
                class="action-icon"
                alt="いいね"
              />
            </button>
            <span class="action-count" :class="{ 'count-purple': isLiked }">
              {{ likeCount > 0 ? likeCount : '' }}
            </span>
          </div>

          <!-- 閲覧数 -->
          <div class="action-item views-item">
            <img src="/images/icon_views.svg" class="action-icon" alt="閲覧数" />
            <span class="action-count">
              {{ post.viewCount > 0 ? post.viewCount : '' }}
            </span>
          </div>

        </div>
      </div>

      <!-- リプライ入力欄 -->
      <div v-if="showReplyForm" class="reply-form" @click.stop>
        <div class="reply-form-inner">
          <img
            v-if="myProfileImageUrl"
            :src="myProfileImageUrl"
            class="reply-user-icon"
            alt="自分のアイコン"
          />
          <div v-else class="reply-user-icon reply-user-icon--empty" />
          <div class="reply-input-area">
            <textarea
              v-model="replyContent"
              class="reply-textarea"
              placeholder="返信を入力..."
              rows="3"
              maxlength="250"
              @click.stop
            ></textarea>
            <div class="reply-char-count" :class="{ 'error': replyContent.length > 250 }">
              {{ replyContent.length }} / 250
            </div>
          </div>
        </div>
        <p v-if="replyError" class="reply-error">{{ replyError }}</p>
        <div class="reply-actions">
          <button class="reply-cancel-btn" @click="handleReplyCancel">キャンセル</button>
          <button
            class="reply-submit-btn"
            :disabled="!replyContent.trim() || replyContent.length > 250 || isReplying"
            @click="handleReplySubmit"
          >
            {{ isReplying ? '送信中...' : '返信する' }}
          </button>
        </div>
      </div>

    </div>
  </article>

  <!-- 引用リツイートモーダル（カード外に配置） -->
  <div v-if="showQuoteModal" class="modal-overlay" @click.self="showQuoteModal = false">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">引用リツイート</h3>
        <button class="modal-close-btn" @click="showQuoteModal = false">×</button>
      </div>
      <div class="modal-body">
        <!-- 引用元の投稿プレビュー -->
        <div class="quote-preview">
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
          @click="handleQuoteSubmit"
          :disabled="!quoteContent.trim() || quoteContent.length > 250 || isQuoting"
        >
          {{ isQuoting ? '送信中...' : '引用する' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-card {
  border: 1px solid #ccc;
  border-radius: 18px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  background-color: #fff;
  cursor: pointer;
}
.post-card:hover { background-color: #fdf8ff; }

.reply-to-label {
  font-size: 12px;
  color: #6a21aa;
  margin-bottom: 8px;
  cursor: pointer;
  display: inline-block;
}
.reply-to-label:hover { text-decoration: underline; }

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  position: relative;
}

/* 三点リーダーボタン */
.post-menu-btn {
  position: absolute;
  top: -4px;
  right: -4px;
  z-index: 10;
}
.menu-dots-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: #aaa;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 50%;
  letter-spacing: 1px;
}
.menu-dots-btn:hover { background-color: #f0e6fa; color: #6a21aa; }

/* ドロップダウンメニュー */
.menu-dropdown {
  position: absolute;
  top: 28px;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  min-width: 180px;
  z-index: 100;
  overflow: hidden;
}
.menu-item {
  padding: 12px 16px;
  font-size: 14px;
  cursor: pointer;
}
.menu-item:hover { background-color: #f5f0ff; }
.delete-item { color: #f66; }
.delete-item:hover { background-color: #fff0f0; }
.disabled-item { color: #bbb; cursor: default; font-size: 12px; }

.icon-wrapper { flex-shrink: 0; margin-right: 10px; cursor: pointer; }
.icon-wrapper:hover .post-user-icon { opacity: 0.8; }
.post-user-icon { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; background-color: #ddd; display: block; }
.post-user-icon--empty { background-color: #ccc; }
.post-user-info { flex: 1; display: flex; flex-direction: column; }
.name-row { display: flex; align-items: center; gap: 2px; }
.p-user-name { font-weight: bold; font-size: 14px; }
.post-time-inline { font-size: 12px; color: #999; }
.p-user-id { font-size: 12px; color: #999; margin-top: 2px; }
.post-body { font-size: 14px; margin-bottom: 10px; line-height: 1.5; }
.post-body p { margin: 0; }

/* 引用元の投稿 */
.quoted-post {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 10px;
  background-color: #f8f8f8;
  cursor: pointer;
}
.quoted-post:hover { background-color: #f0e6ff; }
.quoted-author {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.quoted-icon { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; display: block; flex-shrink: 0; }
.quoted-icon--empty { background-color: #ccc; }
.quoted-name { font-weight: bold; font-size: 12px; color: #555; }
.quoted-username { font-size: 11px; color: #aaa; }
.quoted-content { margin: 0; font-size: 13px; color: #777; line-height: 1.5; }

/* フッター */
.post-footer { display: flex; justify-content: center; align-items: center; }
.action-area { display: flex; align-items: center; gap: 20px; }
.action-item { display: flex; align-items: center; gap: 4px; }
.views-item { cursor: default; }

.action-button {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.action-button:disabled { cursor: not-allowed; opacity: 0.7; }
.action-button:hover { background-color: #f0e6fa; }
.action-icon { width: 20px; height: 20px; object-fit: contain; }
.action-count { font-size: 13px; color: #666; min-width: 16px; }

.icon-purple {
  filter: brightness(0) saturate(100%) invert(27%) sepia(90%) saturate(500%) hue-rotate(250deg) brightness(0.8);
}
.count-purple { color: #6a21aa; }

/* リプライ入力欄 */
.reply-form { margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; }
.reply-form-inner { display: flex; gap: 10px; align-items: flex-start; }
.reply-user-icon { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; display: block; }
.reply-user-icon--empty { background-color: #ddd; width: 36px; height: 36px; border-radius: 50%; }
.reply-input-area { flex: 1; }
.reply-textarea {
  width: 100%; border: 1px solid #ddd; border-radius: 8px;
  padding: 8px 10px; font-size: 14px; resize: none; outline: none;
  box-sizing: border-box; font-family: inherit;
}
.reply-textarea:focus { border-color: #c65bed; }
.reply-char-count { text-align: right; font-size: 11px; color: #999; margin-top: 2px; }
.reply-char-count.error { color: red; }
.reply-error { color: #f66; font-size: 12px; margin: 4px 0; }
.reply-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.reply-cancel-btn {
  background: none; border: 1px solid #ddd; border-radius: 14px;
  padding: 5px 12px; font-size: 13px; cursor: pointer;
}
.reply-submit-btn {
  background-color: #c65bed; color: white; border: none;
  border-radius: 14px; padding: 5px 12px; font-size: 13px;
  font-weight: bold; cursor: pointer;
}
.reply-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* 引用リツイートモーダル */
.modal-overlay {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex; justify-content: center; align-items: center;
}
.modal {
  background: white; border-radius: 16px;
  width: 90%; max-width: 480px; max-height: 90vh; overflow-y: auto;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid #eee;
}
.modal-title { margin: 0; font-size: 16px; font-weight: bold; }
.modal-close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #999; }
.modal-body { padding: 20px; }

/* 引用元プレビュー（モーダル内） */
.quote-preview {
  border: 1px solid #e0e0e0; border-radius: 10px;
  padding: 12px; margin-bottom: 16px; background-color: #f8f8f8;
}
.quote-preview-author-row {
  display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
}
.quote-preview-icon {
  width: 24px; height: 24px; border-radius: 50%; object-fit: cover; display: block; flex-shrink: 0;
}
.quote-preview-icon--empty { background-color: #ccc; }
.quote-preview-name { font-weight: bold; font-size: 13px; color: #333; }
.quote-preview-username { font-size: 12px; color: #999; }
.quote-preview-content { margin: 0; font-size: 13px; color: #555; line-height: 1.5; }

.quote-textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #ddd;
  border-radius: 8px; font-size: 14px; box-sizing: border-box;
  outline: none; resize: none; min-height: 100px; font-family: inherit;
}
.quote-textarea:focus { border-color: #c65bed; }
.char-count { text-align: right; font-size: 12px; color: #666; margin-top: 4px; }
.char-count.error { color: red; font-weight: bold; }
.quote-error { color: #f66; font-size: 13px; margin: 8px 0 0; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 20px; border-top: 1px solid #eee;
}
.cancel-btn {
  background: none; border: 1px solid #ddd; border-radius: 20px;
  padding: 8px 16px; font-size: 14px; cursor: pointer;
}
.submit-btn {
  background-color: #c65bed; color: white; border: none;
  border-radius: 20px; padding: 8px 16px; font-size: 14px;
  font-weight: bold; cursor: pointer;
}
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>