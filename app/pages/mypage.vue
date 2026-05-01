<script setup lang="ts">
import { ref } from 'vue';

const isMenuOpen = ref(false)
interface Post {
  id: number;
  userName: string;
  postText: string;
  postDate: string;
  isLiked?: boolean; 
  likes: number;
}

const posts = ref<Post[]>([
  {
    id: 1,
    userName: 'takeda',
    postText: 'よろしくお願いいたします！',
    postDate: '1時間前',
    isLiked: false,
    likes: 0
  },
  {
    id: 2,
    userName: 'takeda',
    postText: 'TypeScript学習中です・・・',
    postDate: '2時間前',
    isLiked: false,
    likes: 0
  },
   {
    id: 3,
    userName: 'takeda',
    postText: '毎朝猫に起こされる',
    postDate: '１日前',
    isLiked: false,
    likes: 0
  },
    {
    id: 4,
    userName: 'takeda',
    postText: '来世は猫になりたい',
    postDate: '３日前',
    isLiked: false,
    likes: 0
  }
]);

//ーーーーーー画面遷移↓↓↓ーーーーーーーー
const goToPostForm = () => {
  navigateTo('/postForm')
}

const goToHome = () => {
  navigateTo('/')
}

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
            <div class="menu-item">
              <img src="/images/icon_mypage.svg" class="menu-item-icon" alt="">
              <span class="menu-item-text">マイページ</span>
            </div>
          </nav>
        </aside>

      <div v-if="isMenuOpen" class="menu-overlay" @click="isMenuOpen = false"></div>


  <div class="mypage-wrapper">
      <section class="profile-header">
        <div class="cover-image">ヘッダー画像</div>
        <div class="profile-main">
          <div class="avatar"></div>
          <h2 class="user-name">UserName</h2>
          <p class="user-id">UserID</p>
          <p class="bio">
            プロフ文
          </p>
        </div>
      </section>

      <hr class="section-divider" />

      <div class="status-bar">
        <span class="post-count">{{ posts.length }}件の投稿</span>
        <button class="sort-button">↑↓ 並び替え</button>
      </div>

      <main class="post-list">
        <article class="post-card" v-for="post in posts" :key="post.id">
          <div class="post-inner">
            <div class="post-header">
              <div class="post-user-icon"></div>
              <div class="post-user-info">
                <span class="p-user-name">{{ post.userName }}</span>
                <span class="p-user-id">UserID</span>
              </div>
              <div class="post-menu">
                <span class="menu-text">編集</span>
                <span class="menu-text delete">削除</span>
              </div>
            </div>
            
            <div class="post-body">
              <p>テキストが入ります。テキストが入ります。テキストが入ります。</p>
            </div>

            <div class="post-footer">
              <span class="post-time">yyyy/MM/dd HH:mmに投稿</span>
              <div class="like-area">
                <span v-if="post.likes > 0" class="like-num">{{ post.likes }}</span>
                <span class="heart-icon">♡</span>
              </div>
            </div>
          </div>
        </article>
      </main>
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
  border-bottom: 1px solid #ddd; /* 下線 */
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

.mypage-wrapper {
  max-width: 600px;
  margin: 0 auto;
  background-color: #fff;
  min-height: 100vh;
  font-family: sans-serif;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
}

/* プロフィール部分 */
.cover-image {
  width: 100%;
  height: 160px;
  background-color: #eee;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
}

.profile-main {
  padding: 0 20px 20px;
}

.avatar {
  width: 90px;
  height: 90px;
  background-color: #ccc;
  border-radius: 50%;
  border: 4px solid #fff;
  margin-top: -45px;
  margin-bottom: 10px;
}

.user-name { margin: 0; font-size: 22px; }
.user-id { margin: 5px 0 15px; color: #888; font-size: 14px; }
.bio { font-size: 14px; line-height: 1.6; color: #333; }

.section-divider { border: 0; border-top: 1px solid #eee; margin: 0; }

/* ステータスバー */
.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  font-size: 14px;
}

.sort-button { background: none; border: none; cursor: pointer; color: #666; }

/* 投稿カード（画像のデザインを忠実に再現） */
.post-list { padding: 0 15px 50px; }

.post-card {
  border: 1px solid #ccc;
  border-radius: 18px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.post-header { display: flex; align-items: center; margin-bottom: 10px; }
.post-user-icon { width: 40px; height: 40px; background-color: #ccc; border-radius: 50%; margin-right: 10px; }
.post-user-info { flex: 1; display: flex; flex-direction: column; }
.p-user-name { font-weight: bold; font-size: 14px; }
.p-user-id { font-size: 12px; color: #999; }

.post-menu { font-size: 12px; color: #999; display: flex; gap: 10px; }
.delete { color: #f66; }

.post-body { font-size: 14px; margin-bottom: 15px; line-height: 1.5; }

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #aaa;
}

.like-area { display: flex; align-items: center; color: #333; }
.like-num { margin-right: 5px; font-size: 14px; }
.heart-icon { font-size: 18px; cursor: pointer; }
</style>