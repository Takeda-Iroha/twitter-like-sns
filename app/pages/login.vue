<template>
  <div class="login-page">
    <main class="main-content">
      <div class="form-container">
        <h2 class="login-title">Login</h2>
        <p class="instruction">以下の項目へ入力してください</p>
        <p class="signup-link">
          ※アカウントをお持ちでない方は<span @click="goToSignup" class="link-blue">こちら</span>から
        </p>

        <div class="input-list">
          <div class="input-group">
            <label>Username</label>
            <input v-model="username" type="text" placeholder="Enter your username" class="custom-input" />
          </div>

          <div class="input-group">
            <label>Password</label>
            <input v-model="password" type="password" placeholder="Enter your password" class="custom-input" />
          </div>

        </div>

        

        <button class="login-button" @click="handleLogin">Login</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: #fff;
  display: flex;
  justify-content: center;
  /* align-items: center ではなく、上側に余白を持たせて配置 */
}

.main-content {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 20px;
}

.form-container {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-title {
  font-size: 32px;
  margin-bottom: 20px;
  font-weight: normal;
}

.instruction, .login-link {
  font-size: 14px;
  margin-bottom: 8px;
  color: #333;
}

.link-blue {
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
}

/* 入力リストの設定 */
.input-list {
  margin-top: 40px;
  text-align: left; /* ラベルは左寄せ */
}

.input-group {
  margin-bottom: 25px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  font-size: 14px;
}

.custom-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #000;
  border-radius: 12px;
  font-size: 16px;
  box-sizing: border-box;
  outline: none;
}

.custom-input:focus {
  border-color: #555; /* 入力中少し色を変える */
}

/* ログインボタン */
.login-button {
  margin-top: 20px;
  width: 100%;
  max-width: 240px;
  padding: 16px;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 15px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.login-button:active {
  opacity: 0.8;
}

/* スマホでの微調整 */
@media (max-width: 480px) {
  .login-page {
    padding-top: 5vh; /* スマホでは少し上に */
  }
  .login-title {
    font-size: 28px;
  }
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import type { FetchError } from 'ofetch'

// =========================
// 1. 状態管理
// =========================
const username = ref('')
const password = ref('')

const authToken = useCookie<string | null>('auth_token')

// =========================
// 2. ログイン処理
// =========================
const handleLogin = async () => {
  if (!username.value || !password.value) {
    alert('ユーザー名とパスワードを入力してください。')
    return
  }

  try {
    // 仕様変更の過渡期に対応するため、レスポンスは柔軟に受け取る
    const response = await $fetch<any>('https://apg-joetsu.tail02904.ts.net/api/auth/login', {
      method: 'POST',
      body: {
        username: username.value,
        password: password.value
      }
    })

    // 仕様書(accessToken)と実態(token)の両方をチェック
    const token = response.data?.accessToken || response.data?.token

    if (token) {
      authToken.value = token
      alert('ログインに成功しました。')
      navigateTo('/') // ログイン後の遷移先
    } else {
      console.error('Unexpected response structure:', response)
      alert('認証データが正しく取得できませんでした。')
    }

  } catch (e: unknown) {
    const fetchError = e as FetchError<any>
    const status = fetchError.response?.status
    
    // HTTPステータスコードに基づいたエラーハンドリング
    if (status === 401) {
      alert('ユーザー名またはパスワードが正しくありません。')
    } else if (status === 400) {
      alert('リクエストが不正です。入力内容を確認してください。')
    } else {
      alert(`サーバーエラーが発生しました（Status: ${status}）`)
    }
  }
}

const goToSignup = () => navigateTo('/signup')
</script>