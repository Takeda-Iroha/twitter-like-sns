<script setup lang="ts">
import { ref } from 'vue'
import type { FetchError } from 'ofetch'

interface UserData {
  data: {
    user: {
      id: string
      username: string
      email: string
      displayName: string | null
    }
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
}

interface SignupErrorResponse {
  error: {
    code: string
    message: string
    details?: Array<{
      field: string
      message: string
    }>
  }
}

const username = ref('')
const email = ref('')
const password = ref('')
const displayName = ref('')

const authToken = useCookie<string | null>('accessToken')
const refreshToken = useCookie<string | null>('refreshToken')

// ----------------------------------------
// エラーメッセージの状態管理
// ----------------------------------------
const errorMessage = ref('')

const goToLogin = () => navigateTo('/login')

const handleSignup = async () => {
  errorMessage.value = ''

  if (!email.value || !password.value || !username.value) {
    errorMessage.value = '未入力の項目があります。すべての必須項目を入力してください。'
    return
  }

  try {
    const response = await $fetch<UserData>('https://apg-joetsu.tail02904.ts.net/api/auth/register', {
      method: 'POST',
      body: {
        username: username.value,
        email: email.value,
        password: password.value,
        displayName: displayName.value || null
      }
    })

    authToken.value = response.data.accessToken
    refreshToken.value = response.data.refreshToken
    navigateTo('/login')

  } catch (e: unknown) {
    const fetchError = e as FetchError<SignupErrorResponse>
    const status = fetchError.response?.status
    const errorData = fetchError.response?._data?.error

    if (status === 409) {
      errorMessage.value = 'このユーザー名またはメールアドレスはすでに使用されています。別の情報でお試しください。'
    } else if (status === 400) {
      const detail = errorData?.details?.[0]?.message
      errorMessage.value = detail
        ? `入力内容に誤りがあります。${detail}`
        : '入力内容に誤りがあります。もう一度ご確認ください。'
    } else {
      errorMessage.value = '登録に失敗しました。しばらく経ってからもう一度お試しください。'
    }
  }
}
</script>

<template>
  <div class="signup-page">
    <main class="main-content">
      <div class="form-container">
        <h2 class="signup-title">Sign up</h2>

        <p class="instruction">以下の項目へ入力してください</p>
        <p class="login-link">
          ※アカウントをお持ちの方は<span @click="goToLogin" class="link-blue">こちら</span>から
        </p>

        <div class="input-list">
          <div class="input-group">
            <label>E-mail</label>
            <input v-model="email" type="email" placeholder="xxx@xxx.com" class="custom-input" />
          </div>

          <div class="input-group">
            <label>Password</label>
            <input v-model="password" type="password" placeholder="8文字以上、英数字" class="custom-input" />
          </div>

          <div class="input-group">
            <label>UserName</label>
            <input v-model="username" type="text" placeholder="Enter your name" class="custom-input" />
          </div>

          <div class="input-group">
            <label>DisplayName<span class="optional-tag">（任意・未入力時はUserNameを表示）</span></label>
            <input v-model="displayName" type="text" placeholder="Enter your display name" class="custom-input" />
          </div>
        </div>

        <!-- エラーメッセージ（ボタンの上に表示） -->
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <button class="signup-button" @click="handleSignup">Sign up</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.signup-page {
  min-height: 100vh;
  background-color: #fff;
  display: flex;
  justify-content: center;
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
.signup-title { font-size: 32px; margin-bottom: 20px; font-weight: normal; }
.instruction, .login-link { font-size: 14px; margin-bottom: 8px; color: #333; }
.link-blue { color: #007bff; cursor: pointer; text-decoration: underline; }
.input-list { margin-top: 40px; text-align: left; }
.input-group { margin-bottom: 25px; }
.input-group label { display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px; }
.optional-tag { font-weight: normal; font-size: 12px; color: #999; margin-left: 4px; }
.custom-input {
  width: 100%; padding: 14px 16px; border: 2px solid #000;
  border-radius: 12px; font-size: 16px; box-sizing: border-box; outline: none;
}
.custom-input:focus { border-color: #555; }

/* エラーメッセージ */
.error-message {
  color: #e53935;
  font-size: 13px;
  margin: 0 0 16px;
  line-height: 1.6;
  text-align: left;
  background-color: #fff5f5;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  padding: 10px 12px;
}

.signup-button {
  margin-top: 0;
  width: 100%; max-width: 240px; padding: 16px;
  background-color: #000; color: #fff; border: none;
  border-radius: 15px; font-size: 18px; font-weight: bold;
  cursor: pointer; transition: opacity 0.2s;
}
.signup-button:active { opacity: 0.8; }

@media (max-width: 480px) {
  .signup-page { padding-top: 5vh; }
  .signup-title { font-size: 28px; }
}
</style>