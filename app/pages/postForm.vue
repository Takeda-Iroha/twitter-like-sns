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
      

      <div class="post-btn-group">
        <button @click="goBack" class="cancel-btn">キャンセル</button>

        <div class="post-actions">
          <button @click="createPost" class="post-btn" :disabled="!postContent.trim() || postContent.length > 250"
            >投稿する</button>
          <div class="char-count" :class="{'error':postContent.length > 250}">
            {{ postContent.length }} / 250
          </div>
        </div>
      </div>

      <div class="post-form-content">
        <div class="user-icon"></div>
        <textarea v-model="postContent" class="post-textarea" placeholder="今なにしてる？"></textarea>
      </div>
    </div>
  </div>
</template>

<style>
/* 画面全体 */
body {
  margin: 0;
  padding: 0;
  background-color: #f5f5f5; 
  font-family: "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;
}

</style>

<style scoped>


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

/* サイドメニュー */
.side-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100%;
  background-color: #f9f9f9;
  z-index: 1000;
  /* 左側に隠れてる */
  transform: translateX(-100%);
  /*アニメーション*/
  transition: transform 0.3s ease;
}

.menu-user-info {
  display: flex;      /* 横並び */
  align-items: center; /* アイコンと名前の高さを中央で揃える */
  padding: 20px;       
  border-bottom: 1px solid #ddd; 
}

.menu-user-icon {
  width: 60px;          
  height: 60px;
  border-radius: 50%;    
  margin-right: 15px;    
  flex-shrink: 0;        /* アイコンが潰れないようにする */
  
  
  background-image: url('/images/user_photo.jpg'); 
  
  /*画像の切り取り方を指定 */
  background-size: cover;      /* 枠いっぱいに広げ、はみ出た分はカットする */
  background-position: center; /* 画像の中央を基準に表示する */
  background-repeat: no-repeat; /* 画像を繰り返さない */
  
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

.spacer { width: 25px; } /* ロゴを中央にするための隙間 */

/* 投稿作成エリア */

.post-content-wrapper {
  max-width: 600px;
  margin: 0px auto;
  width: auto;/* ヘッダー横の余白修正後に変更100%→auto */
  padding: 0 12px;    /* 端の余白 */

  border-left: 1px solid rgba(198, 91, 237, 0.3);
  border-right: 1px solid rgba(198, 91, 237, 0.3);
  background-color: #fff;

  min-height: calc(100vh - 60px); /* ← ここが重要 */
}

.user-icon {
  width: 60px;      
  height: 60px;
  border-radius: 50%;    
  margin-right: 15px;    
  flex-shrink: 0;        /* アイコンが潰れないようにする */
  
  background-image: url('/images/user_photo.jpg'); 
  
  /*画像の切り取り方を指定 */
  background-size: cover;      /* 枠いっぱいに広げ、はみ出た分はカットする */
  background-position: center; /* 画像の中央を基準に表示する */
  background-repeat: no-repeat; /* 画像を繰り返さない */
  
  /* 画像がない時用のバックアップ色 */
  background-color: #ddd; 
}

.post-btn-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
}

.cancel-btn {
  background-color: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
}

/* 投稿ボタンと文字数表示 */
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

/*投稿ボタン無効*/
.post-btn:disabled {
  background-color: #979da1; 
  cursor: not-allowed; 
  opacity: 0.6;
}

/* ユーザーアイコンと入力欄 */
.post-form-content {
  display: flex;
  padding: 10px;
  gap: 12px; 
}

.post-textarea {
  flex: 1;         
  border: none;        
  outline: none;        /* クリック時の青い枠も消す */
  font-size: 18px;
  resize: none;       /* 右下のサイズ変更ハンドルを消す */
  min-height: 200px;
  padding-top: 10px;     
  background-color: transparent;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #666;
}

.char-count.error {
  color: red;          /* 250文字以上で赤 */
  font-weight: bold;
}


</style>

<script setup lang="ts">
import { ref } from 'vue'

const isMenuOpen = ref(false)
const postContent = ref('')

const router = useRouter()

//キャンセルボタン
const goBack = () => {
  router.back()
}

//投稿作成処理
const createPost = () => {
  navigateTo('/')

}

//ーーーーーー画面遷移↓↓↓ーーーーーーーー
const goToPostForm = () => {
  navigateTo('/postForm')//投稿作成画面へ
}

const goToHome = () => {
  navigateTo('/')//ホームへ
}

const goToMypage = () => {
  navigateTo('/mypage')//マイページへ
}
</script>