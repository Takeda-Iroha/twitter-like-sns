// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('accessToken')

  const publicPages = ['/login', '/signup']
  if (publicPages.includes(to.path)) return

  if (!token.value) {
    // ログインページへリダイレクトするとき
    // 行こうとしていたURLをクエリパラメータに乗せる
    return navigateTo(`/login?redirect=${to.fullPath}`)
  }
})