<!-- app/components/PostCard.vue -->
<script setup lang="ts">
import type { Post } from '~/composables/usePost'
import { usePost } from '~/composables/usePost'

const props = defineProps<{
  post: Post
}>()

const { addLike, removeLike } = usePost()

const isLiked = ref(props.post.isLiked)
const likeCount = ref(props.post.likeCount)
const isLiking = ref(false)

// 引用リツイート数のローカル管理
const quoteCount = ref(props.post.quoteCount)
const isQuoted = ref(props.post.isQuoted)

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

// ----------------------------------------
// アイコンクリック → プロフィールページへ
// ----------------------------------------
const goToProfile = (event: Event) => {
  event.stopPropagation()
  navigateTo(`/users/${props.post.author.username}`)
}

// ----------------------------------------
// カード全体クリック → 投稿詳細ページへ
// ----------------------------------------
const goToDetail = () => {
  navigateTo(`/posts/${props.post.id}`)
}

// ----------------------------------------
// いいねボタンクリック（カード全体クリックを止める）
// ----------------------------------------
const handleLikeClick = (event: Event) => {
  event.stopPropagation()
  handleLike()
}

// ----------------------------------------
// 引用リツイートボタンクリック（詳細ページへ遷移）
// 引用リツイートは投稿詳細ページで行う
// ----------------------------------------
const handleQuoteClick = (event: Event) => {
  event.stopPropagation()
  navigateTo(`/posts/${props.post.id}`)
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
</script>

<template>
  <!-- カード全体クリックで詳細ページへ -->
  <article class="post-card" @click="goToDetail">
    <div class="post-inner">

      <!-- カードヘッダー -->
      <div class="post-header">
        <!-- アイコンクリックでプロフィールへ（カード全体クリックを止める） -->
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
      <!-- stopPropagationでカード全体クリックを止める -->
      <div class="post-footer" @click.stop>
        <div class="action-area">

          <!-- いいねボタン＋いいね数 -->
          <div class="action-item">
            <button
              class="action-button"
              :class="{ 'is-liked': isLiked }"
              :disabled="isLiking"
              @click="handleLikeClick"
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
            </button>
            <span class="action-count" :class="{ 'is-liked': isLiked }">
              {{ likeCount > 0 ? likeCount : '' }}
            </span>
          </div>

          <!-- 引用リツイートボタン＋引用数 -->
          <div class="action-item">
            <button
              class="action-button"
              :class="{ 'is-quoted': isQuoted }"
              @click="handleQuoteClick"
            >
              <img
                src="/images/icon_retweet.svg"
                class="action-icon"
                alt="引用リツイート"
              />
            </button>
            <span class="action-count" :class="{ 'is-quoted': isQuoted }">
              {{ quoteCount > 0 ? quoteCount : '' }}
            </span>
          </div>

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
  cursor: pointer;  /* カード全体がクリックできることを示す */
}
.post-card:hover { background-color: #fdf8ff; }

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.icon-wrapper {
  flex-shrink: 0;
  margin-right: 10px;
  cursor: pointer;
}
.icon-wrapper:hover .post-user-icon { opacity: 0.8; }
.post-user-icon {
  width: 40px; height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #ddd;
  display: block;
}
.post-user-icon--empty { background-color: #ccc; }
.post-user-info { flex: 1; display: flex; flex-direction: column; }
.name-row { display: flex; align-items: center; gap: 2px; }
.p-user-name { font-weight: bold; font-size: 14px; }
.post-time-inline { font-size: 12px; color: #999; }
.p-user-id { font-size: 12px; color: #999; margin-top: 2px; }
.post-body { font-size: 14px; margin-bottom: 15px; line-height: 1.5; }
.post-body p { margin: 0 0 8px 0; }

/* フッター：アクションボタン群 */
.post-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.action-area {
  display: flex;
  align-items: center;
  gap: 16px;
}
.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

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

/* いいね済みの色 */
.action-button.is-liked { color: #e0245e; }
.action-count { font-size: 13px; color: #666; min-width: 16px; }
.action-count.is-liked { color: #e0245e; }

/* 引用済みの色 */
.action-button.is-quoted { color: #17bf63; }
.action-count.is-quoted { color: #17bf63; }

/* いいねアニメーション */
.action-button.is-liked .action-icon { animation: heartPop 0.3s ease; }
@keyframes heartPop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.4); }
  100% { transform: scale(1); }
}
</style>