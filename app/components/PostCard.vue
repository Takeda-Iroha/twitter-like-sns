<!-- app/components/PostCard.vue -->
<script setup lang="ts">
import type { Post } from '~/composables/usePost'
import { usePost } from '~/composables/usePost'
import { useUser } from '~/composables/useUser'

const props = defineProps<{
  post: Post
}>()

const { addLike, removeLike, createPost } = usePost()
const { fetchUserProfile } = useUser()

// いいね状態のローカル管理
const isLiked = ref(props.post.isLiked)
const likeCount = ref(props.post.likeCount)
const isLiking = ref(false)

// 引用リツイート状態のローカル管理
const quoteCount = ref(props.post.quoteCount)
const isQuoted = ref(props.post.isQuoted)

// リプライ数のローカル管理
const replyCount = ref(props.post.replyCount)

// リプライ入力欄の表示・非表示
const showReplyForm = ref(false)
const replyContent = ref('')
const isReplying = ref(false)
const replyError = ref('')

// ログイン中のユーザー情報
const loggedInUsername = useCookie('username').value
const isMyPost = computed(() => props.post.author.username === loggedInUsername)

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

// アイコンクリック → プロフィールページへ
const goToProfile = (event: Event) => {
  event.stopPropagation()
  navigateTo(`/users/${props.post.author.username}`)
}

// カード全体クリック → 投稿詳細ページへ
const goToDetail = () => {
  navigateTo(`/posts/${props.post.id}`)
}

const handleLikeClick = (event: Event) => {
  event.stopPropagation()
  handleLike()
}

// 引用リツイートボタンクリック → 詳細ページへ
const handleQuoteClick = (event: Event) => {
  event.stopPropagation()
  navigateTo(`/posts/${props.post.id}`)
}

// リプライボタンクリック → 入力欄の表示切り替え
const handleReplyClick = (event: Event) => {
  event.stopPropagation()
  showReplyForm.value = !showReplyForm.value
  if (!showReplyForm.value) {
    replyContent.value = ''
    replyError.value = ''
  }
}

// リプライ送信処理
// createPost に replyToId を渡すだけでリプライになる
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

// リプライキャンセル
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

      <!-- リプライ先ラベル（リプライ投稿の場合のみ表示） -->
      <div
        v-if="post.replyToId"
        class="reply-to-label"
        @click.stop="navigateTo(`/posts/${post.replyToId}`)"
      >
        💬 元の投稿を見る
      </div>

      <!-- カードヘッダー -->
      <div class="post-header">
        <!-- 自分の投稿のみ三点リーダーボタンを右上に表示 -->
        <div v-if="isMyPost" class="post-menu-btn" @click.stop>
          <button class="menu-dots-btn">•••</button>
          <!-- 編集・削除は後で実装 -->
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

          <!-- 閲覧数（ボタンなし・表示のみ） -->
          <div class="action-item views-item">
            <img
              src="/images/icon_views.svg"
              class="action-icon"
              alt="閲覧数"
            />
            <span class="action-count">
              {{ post.viewCount > 0 ? post.viewCount : '' }}
            </span>
          </div>

        </div>
      </div>

      <!-- リプライ入力欄（リプライボタンクリックで表示） -->
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

/* リプライ先ラベル */
.reply-to-label {
  font-size: 12px;
  color: #6a21aa;
  margin-bottom: 8px;
  cursor: pointer;
  display: inline-block;
}
.reply-to-label:hover { text-decoration: underline; }

/* カードヘッダー */
.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  position: relative;
}

/* 三点リーダーボタン（自分の投稿のみ） */
.post-menu-btn {
  position: absolute;
  top: -4px;
  right: -4px;
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

/* フッター：アクション群を中央寄せ */
.post-footer { display: flex; justify-content: center; align-items: center; }
.action-area { display: flex; align-items: center; gap: 20px; }
.action-item { display: flex; align-items: center; gap: 4px; }
.views-item { cursor: default; }

/* アクションボタン共通 */
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

/* リアクション済みは紫色に（CSS filterで変換） */
.icon-purple {
  filter: brightness(0) saturate(100%) invert(27%) sepia(90%) saturate(500%) hue-rotate(250deg) brightness(0.8);
}
.count-purple { color: #6a21aa; }

/* リプライ入力欄 */
.reply-form {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}
.reply-form-inner { display: flex; gap: 10px; align-items: flex-start; }
.reply-user-icon { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; display: block; }
.reply-user-icon--empty { background-color: #ddd; }
.reply-input-area { flex: 1; }
.reply-textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  resize: none;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
}
.reply-textarea:focus { border-color: #c65bed; }
.reply-char-count { text-align: right; font-size: 11px; color: #999; margin-top: 2px; }
.reply-char-count.error { color: red; }
.reply-error { color: #f66; font-size: 12px; margin: 4px 0; }
.reply-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.reply-cancel-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 14px;
  padding: 5px 12px;
  font-size: 13px;
  cursor: pointer;
}
.reply-submit-btn {
  background-color: #c65bed;
  color: white;
  border: none;
  border-radius: 14px;
  padding: 5px 12px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
}
.reply-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>