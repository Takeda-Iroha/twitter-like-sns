<script setup lang="ts">
import { ref } from 'vue'

const isMenuOpen = ref(false)//サイドメニュー


interface Post {
  id: number;
  userName: string;
  postText: string;
  postDate: string;
  isLiked?: boolean; // いいねの状態を追加（任意）
}

const posts = ref<Post[]>([
  {
    id: 1,
    userName: 'takeda',
    postText: 'よろしくお願いしますmm',
    postDate: '1時間前',
    isLiked: false
  },
  {
    id: 2,
    userName: 'takeda',
    postText: 'TypeScript学習中・・・',
    postDate: '2時間前',
    isLiked: false
  },
   {
    id: 3,
    userName: 'takeda',
    postText: '投稿３',
    postDate: '１日前',
    isLiked: false
  },
    {
    id: 4,
    userName: 'takeda',
    postText: '投稿４',
    postDate: '３日前',
    isLiked: false
  }
])

//ーーーーーー画面遷移↓ーーーーーーーー
const goToPostForm = () => {
  navigateTo('/postForm')
}

const goToHome = () => {
  navigateTo('/')
}

const goToMypage = () => {
  navigateTo('/mypage')
}


</script>

<template>
  <div class="app-container">
    
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

    <main class="main-content">
      <p class="section-title">最近の投稿</p>

      <article class="post-card" v-for="post in posts" :key="post.id">
        <div class="user-icon"></div>
        <div class="post-content">
          <div class="user-meta">
            <span class="user-name">{{ post.userName }}</span>
            <span class="post-date">・{{ post.postDate }}</span>
          </div>
          <p class="user-id">takeda_168</p>
          <p class="post-text">{{post.postText}}</p>
          <div class="post-actions">
            <button class="heart-button" @click="post.isLiked = !post.isLiked">
              <img v-if="post.isLiked" src="/images/icon_heart_fill.svg" class="heart-icon liked" alt="いいね済み">
              <img v-else src="/images/icon_heart.svg" class="heart-icon" alt="いいね">
            </button>
          </div>
        </div>
      </article>
      
    </main>

    <button class="add-button" @click="goToPostForm">+</button>

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
/* 画面全体の基本設定 */


/*  ヘッダー　*/
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

.logo {
  font-size: 20px;
  margin: 0;
}

.menu_icon img {
  width: 24px;
  height: 24px;
}

/* サイドメニューの基本設定 */
.side-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100%;
  background-color: #f9f9f9;
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
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
  
  /*画像の切り取り方を指定 */
  background-size: cover;      
  background-position: center; 
  background-repeat: no-repeat; 
  
  /* 画像がない時用のバックアップ色 */
  background-color: #ddd; 
}

.menu-user-text {
  display: flex;
  flex-direction: column; 
  justify-content: center; 
}

.menu-user-text .user-id {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

/* サイドメニューのアイコン*/
.menu-item-icon {
  width: 28px;
  height: 28px;
  margin: 5px 15px 0 15px;
  object-fit: contain; 
}

/* 「is-open」クラスがついたら画面内に戻す */
.side-menu.is-open {
  transform: translateX(0);
}

/* 背景を暗くするレイヤー */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}


.spacer { width: 25px; } 

/* 3. 投稿エリアの幅制限） */
.main-content {
  max-width: 450px;
  margin: 0 auto;
  padding: 10px;
}

.section-title {
  text-align: center;
  font-size: 14px;
  color: #333;
}

/* 4. 投稿カード */
.post-card {
  background-color: white;
  border: 2px solid #000;
  border-radius: 20px;
  padding: 15px;
  margin-bottom: 15px;
  display: flex;
  box-shadow: 0 4px 0px rgba(0,0,0,0.05);
}

/*投稿カード上のユーザーアイコン設定*/
.user-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0; /* アイコンが横に潰れないように固定 */

  background-image: url('/images/user_photo.jpg');
  background-size: cover;
  background-position: center;
  background-color: #ddd;
}

.post-content {
  flex: 1; /* 残りの幅を全部使う */
}

.user-name { font-weight: bold; }
.post-date { color: #666; font-size: 12px; }
.post-card .user-id { color: #999; font-size: 11px; margin: 2px 0 8px 0; }

.post-text {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 10px;
}

/* 添付画像（仮） */
.post-image-placeholder {
  width: 100%;
  height: 180px;
  background-color: #eee;
  border-radius: 8px;
  margin-bottom: 10px;
}

/* ハートボタンを右端に */
.post-actions {
  display: flex;
  justify-content: flex-end;
}

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

/* いいねがはねる */
.heart-icon.liked {
  animation: heartPop 0.3s ease;
}

/* いいねボタンアニメーション */
@keyframes heartPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* 5. 投稿ボタン（フローティング） */
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
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  cursor: pointer;
}
</style>
