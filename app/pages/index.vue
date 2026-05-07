<script setup lang="ts">
import { ref } from 'vue'

const isMenuOpen = ref(false)

interface Post {
  id: number
  userName: string
  userId: string
  postText: string
  postDate: Date
  isLiked?: boolean
  likes: number
  hasImage?: boolean
}

// ----------------------------------------
// 投稿データ
// postDateはnew Date(Date.now() - ミリ秒)で「現在から◯秒前」を表現
// 1000ms = 1秒 / 60秒 = 1分 / 60分 = 1時間 / 24時間 = 1日
// ----------------------------------------
const posts = ref<Post[]>([
  {
    id: 1,
    userName: 'takeda',
    userId: 'takeda_168',
    postText: 'よろしくお願いしますmm',
    postDate: new Date(Date.now() - 1000 * 60 * 60),
    isLiked: false,
    likes: 3,
    hasImage: true  // 画像ありのダミー表示
  },
  {
    id: 2,
    userName: 'takeda',
    userId: 'takeda_168',
    postText: 'TypeScript学習中・・・',
    postDate: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isLiked: false,
    likes: 0
  },
  {
    id: 3,
    userName: 'takeda',
    userId: 'takeda_168',
    postText: '投稿３',
    postDate: new Date(Date.now() - 1000 * 60 * 60 * 25),
    isLiked: false,
    likes: 1
  },
  {
    id: 4,
    userName: 'takeda',
    userId: 'takeda_168',
    postText: '投稿４',
    postDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    isLiked: false,
    likes: 0
  }
])

// ----------------------------------------
// 投稿時刻を「◯分前 / ◯時間前 / ◯日前」に変換する関数
// Dateオブジェクトを受け取り、現在時刻との差を文字列で返す
// ----------------------------------------
const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime() 
  const diffMin = Math.floor(diffMs / 1000 / 60)

  if (diffMin < 1) {
    return 'たった今'
  } else if (diffMin < 60) {
    return `${diffMin}分前`
  } else if (diffMin < 60 * 24) {
    return `${Math.floor(diffMin / 60)}時間前`
  } else {
    return `${Math.floor(diffMin / 60 / 24)}日前`
  }
}

// 画面遷移
const goToPostForm = () => { navigateTo('/postForm') }
const goToHome = () => { navigateTo('/') }
const goToMypage = () => { navigateTo('/mypage') }
</script>

<template>
  <div class="app-container">

    <!-- ヘッダー -->
    <header class="header">
      <div class="menu_icon" @click="isMenuOpen = true">
        <img src="/images/icon_menu.svg" alt="メニューを表示" class="menu-icon" />
      </div>
      <h1 class="logo">APG</h1>
      <div class="spacer"></div>
    </header>

    <!-- サイドメニュー -->
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

    <!-- サイドメニューを閉じるための背景オーバーレイ -->
    <div v-if="isMenuOpen" class="menu-overlay" @click="isMenuOpen = false"></div>

    <!-- メインコンテンツ -->
    <main class="main-content">
      <p class="section-title">最近の投稿</p>

      <!-- 投稿カード一覧 -->
      <article class="post-card" v-for="post in posts" :key="post.id">
        <div class="post-inner">

          <!-- カードヘッダー：アイコン・ユーザー名・投稿時刻・ユーザーID -->
          <div class="post-header">
            <div class="post-user-icon"></div>
            <div class="post-user-info">
              <div class="name-row">
                <span class="p-user-name">{{ post.userName }}</span>
                <!-- formatRelativeTime()でDateを「◯時間前」に変換して表示 -->
                <span class="post-time-inline">・{{ formatRelativeTime(post.postDate) }}</span>
              </div>
              <span class="p-user-id">{{ post.userId }}</span>
            </div>
          </div>

          <!-- 投稿本文 -->
          <div class="post-body">
            <p>{{ post.postText }}</p>

            <!-- 画像ありの投稿のみダミープレースホルダーを表示 -->
            <!-- 今後<img :src="post.imageUrl"> に置き換える -->
            <div v-if="post.hasImage" class="post-image-placeholder">
              <span class="placeholder-text">画像プレビュー（未実装）</span>
            </div>
          </div>

          <!-- カードフッター：いいねボタン -->
          <div class="post-footer">
            <div class="like-area">
              <!-- likes が1以上の時だけ数字を表示 -->
              <span v-if="post.likes > 0" class="like-num">{{ post.likes }}</span>
              <!-- いいねボタン：画像アイコンを使用 -->
              <!-- クリックでisLikedを反転、likesのカウントも増減 -->
              <button
                class="heart-button"
                @click="post.isLiked = !post.isLiked; post.likes += post.isLiked ? 1 : -1"
              >
                <img v-if="post.isLiked" src="/images/icon_heart_fill.svg" class="heart-icon liked" alt="いいね済み">
                <img v-else src="/images/icon_heart.svg" class="heart-icon" alt="いいね">
              </button>
            </div>
          </div>

        </div>
      </article>

    </main>

    <!-- 投稿作成フローティングボタン -->
    <button class="add-button" @click="goToPostForm">+</button>

  </div>
</template>


<style>
/* グローバルスタイル（全ページ共通） */
body {
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  font-family: "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;
}
</style>

<style scoped>
/* =============================
   ヘッダー
   ============================= */
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

/* =============================
   サイドメニュー
   ============================= */
.side-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100%;
  background-color: #f9f9f9;
  z-index: 1000;
  transform: translateX(-100%);   /* 初期状態は画面外に隠す */
  transition: transform 0.3s ease;
}
.side-menu.is-open {
  transform: translateX(0);       /* is-openがつくと画面内にスライドイン */
}
.menu-user-info {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}
.menu-user-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 15px;
  flex-shrink: 0;
  background-image: url('/images/user_photo.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #ddd;
}
.menu-user-text { display: flex; flex-direction: column; justify-content: center; }
.menu-user-text .user-id { color: #999; font-size: 12px; margin-top: 4px; }
.menu-item-icon { width: 28px; height: 28px; margin: 5px 15px 0 15px; object-fit: contain; }
.menu-item { display: flex; align-items: center; padding: 15px 0; cursor: pointer; }
.menu-item:hover { background-color: #f0e6fa; }
.menu-item-text { font-size: 15px; }

/* サイドメニュー背景オーバーレイ */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* =============================
   メインコンテンツ
   ============================= */
.main-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 10px 15px 80px; 
}
.section-title {
  text-align: center;
  font-size: 14px;
  color: #333;
}

/* =============================
   投稿カード（マイページと共通デザイン）
   ============================= */
.post-card {
  border: 1px solid #ccc;
  border-radius: 18px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  background-color: #fff;
}

/* カードヘッダー */
.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.post-user-icon {
  width: 40px;
  height: 40px;
  background-color: #ccc;
  border-radius: 50%;
  margin-right: 10px;
  flex-shrink: 0;
  background-image: url('/images/user_photo.jpg');
  background-size: cover;
  background-position: center;
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

/* 投稿本文 */
.post-body {
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.5;
}
.post-body p { margin: 0 0 8px 0; }

/* 画像プレースホルダー（未実装期間のダミー） */
.post-image-placeholder {
  width: 100%;
  height: 200px;
  background-color: #eee;
  border-radius: 10px;
  margin-top: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.placeholder-text {
  font-size: 12px;
  color: #aaa;
}

/* カードフッター */
.post-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.like-area { display: flex; align-items: center; color: #333; }
.like-num { margin-right: 5px; font-size: 14px; }

/* いいねボタン（画像アイコン使用） */
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
.heart-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
}
.heart-icon.liked {
  animation: heartPop 0.3s ease;
}
@keyframes heartPop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.4); }
  100% { transform: scale(1); }
}

/* =============================
   フローティング投稿ボタン
   ============================= */
.add-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  background-color: #ddd;
  border: 1px solid #999;
  border-radius: 50%;
  font-size: 30px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}
</style>