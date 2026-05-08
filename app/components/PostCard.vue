<!-- app/components/PostCard.vue -->
<script setup lang="ts">
import type { Post } from '~/composables/usePost'

// 親（index.vue）からpost1件を受け取る
defineProps<{
  post: Post
}>()

// formatRelativeTimeをこのファイルに直接書く
// index.vueにあったものをここに移すだけ
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
  <article class="post-card">
    <div class="post-inner">

      <!-- カードヘッダー -->
      <div class="post-header">
        <!-- APIのprofileImageUrlを直接imgタグのsrcに使う -->
        <img
          :src="post.author.profileImageUrl"
          class="post-user-icon"
          alt="ユーザーアイコン"
        />
        <div class="post-user-info">
          <div class="name-row">
            <span class="p-user-name">{{ post.author.displayName }}</span>
            <!-- createdAtはstring型なのでnew Date()でDate型に変換してから渡す -->
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
      <div class="post-footer">
        <div class="like-area">
          <span v-if="post.likeCount > 0" class="like-num">
            {{ post.likeCount }}
          </span>
          <button class="heart-button">
            <img
              v-if="post.isLiked"
              src="/images/icon_heart_fill.svg"
              class="heart-icon liked"
              alt="いいね済み"
            >
            <img
              v-else
              src="/images/icon_heart.svg"
              class="heart-icon"
              alt="いいね"
            >
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
}
.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.post-user-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  flex-shrink: 0;
  object-fit: cover;
  background-color: #ddd;
}
.post-user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 2px;
}
.p-user-name { font-weight: bold; font-size: 14px; }
.post-time-inline { font-size: 12px; color: #999; }
.p-user-id { font-size: 12px; color: #999; margin-top: 2px; }
.post-body {
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.5;
}
.post-body p { margin: 0 0 8px 0; }
.post-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
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
  justify-content: center;
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
</style>