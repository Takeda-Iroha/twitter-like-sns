<!-- app/pages/users/[username].vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUser } from '~/composables/useUser'
import type { UserProfile, UserPost } from '~/composables/useUser'

const isMenuOpen = ref(false)
const { fetchUserProfile, fetchUserPosts, requestFollow, unfollowUser } = useUser()

const route = useRoute()
const targetUsername = route.params.username as string
const loggedInUsername = useCookie('username').value
const isMyPage = computed(() => targetUsername === loggedInUsername)

const profile = ref<UserProfile | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

const userPosts = ref<UserPost[]>([])
const isPostsLoading = ref(false)
const postsError = ref('')

// フォロー状態の管理
const isFollowRequesting = ref(false)
const followStatus = ref<'none' | 'pending' | 'following'>('none')

// ----------------------------------------
// フォロー解除モーダルの状態管理
// ----------------------------------------
const showUnfollowModal = ref(false)
const isUnfollowing = ref(false)
const unfollowError = ref('')

const loadProfile = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await fetchUserProfile(targetUsername)
    profile.value = data
    followStatus.value = data.isFollowing ? 'following' : 'none'
    await loadUserPosts()
  } catch (error: any) {
    if (error.status === 401) {
      navigateTo('/login')
    } else if (error.status === 404) {
      errorMessage.value = 'ユーザーが見つかりません'
    } else {
      errorMessage.value = 'プロフィールを読み込めませんでした'
    }
  } finally {
    isLoading.value = false
  }
}

const loadUserPosts = async () => {
  if (!profile.value) return
  isPostsLoading.value = true
  postsError.value = ''

  try {
    const result = await fetchUserPosts(targetUsername)
    if (isMyPage.value) {
      userPosts.value = result.posts
    } else if (profile.value.isFollowing) {
      userPosts.value = result.posts.filter(
        p => p.visibility === 'public' || p.visibility === 'followers'
      )
    } else {
      userPosts.value = result.posts.filter(p => p.visibility === 'public')
    }
  } catch (error: any) {
    postsError.value = '投稿を読み込めませんでした'
  } finally {
    isPostsLoading.value = false
  }
}

// ----------------------------------------
// フォローボタンクリック処理
// フォロー中のときはモーダルを開く
// それ以外はフォロー申請する
// ----------------------------------------
const handleFollowButtonClick = () => {
  if (followStatus.value === 'following') {
    // フォロー中 → 解除モーダルを開く
    unfollowError.value = ''
    showUnfollowModal.value = true
  } else if (followStatus.value === 'none') {
    // 未フォロー → フォロー申請する
    handleFollowRequest()
  }
  // pending（申請中）の場合は何もしない
}

// フォロー申請処理
const handleFollowRequest = async () => {
  if (!profile.value) return
  isFollowRequesting.value = true

  try {
    const result = await requestFollow(profile.value.id)
    followStatus.value = result.data.status === 'approved' ? 'following' : 'pending'
  } catch (error: any) {
    if (error.status === 409) {
      followStatus.value = 'pending'
    } else {
      alert('フォロー申請に失敗しました')
    }
  } finally {
    isFollowRequesting.value = false
  }
}

// ----------------------------------------
// フォロー解除処理
// モーダルの「フォロー解除する」ボタンから呼ばれる
// ----------------------------------------
const handleUnfollow = async () => {
  if (!profile.value) return
  isUnfollowing.value = true
  unfollowError.value = ''

  try {
    await unfollowUser(profile.value.id)
    followStatus.value = 'none'
    showUnfollowModal.value = false

    // フォロー解除後は投稿一覧を再取得する
    // （フォロワー向け投稿が見えなくなるため）
    await loadUserPosts()
  } catch (error: any) {
    if (error.status === 401) {
      unfollowError.value = 'ログインが必要です'
    } else {
      unfollowError.value = 'フォロー解除に失敗しました'
    }
  } finally {
    isUnfollowing.value = false
  }
}

// フォローボタンの表示テキスト
const followButtonLabel = computed(() => {
  if (followStatus.value === 'following') return 'フォロー中'
  if (followStatus.value === 'pending') return '申請中'
  return 'フォローする'
})

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${d} ${h}:${min}`
}

const goToPostDetail = (postId: string) => {
  navigateTo(`/posts/${postId}`)
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="userpage-content">

    <AppHeader @open-menu="isMenuOpen = true" />
    <AppSideMenu :is-open="isMenuOpen" @close="isMenuOpen = false" />

    <div class="mypage-wrapper">

      <p v-if="isLoading" class="status-text">読み込み中...</p>
      <p v-else-if="errorMessage" class="status-text error">{{ errorMessage }}</p>

      <template v-else-if="profile">

        <section class="profile-header">
          <div class="cover-image">
            <img v-if="profile.profileImageUrl" :src="profile.profileImageUrl" class="cover-img" alt="カバー画像" />
            <span v-else class="cover-placeholder">ヘッダー画像</span>
          </div>

          <div class="profile-main">
            <div class="avatar-wrapper">
              <img v-if="profile.profileImageUrl" :src="profile.profileImageUrl" class="avatar" alt="アイコン" />
              <div v-else class="avatar avatar--empty" />
            </div>

            <div class="profile-action">
              <button
                v-if="isMyPage"
                class="edit-btn"
                @click="navigateTo('/mypage')"
              >
                プロフィールを編集
              </button>

              <button
                v-else
                class="follow-btn"
                :class="{
                  'following': followStatus === 'following',
                  'pending': followStatus === 'pending'
                }"
                :disabled="isFollowRequesting || followStatus === 'pending'"
                @click="handleFollowButtonClick"
              >
                {{ isFollowRequesting ? '送信中...' : followButtonLabel }}
              </button>
            </div>

            <h2 class="user-name">{{ profile.displayName || profile.username }}</h2>
            <p class="user-id">@{{ profile.username }}</p>
            <p class="bio">{{ profile.bio || '自己紹介はまだありません' }}</p>

            <div class="follow-stats">
              <span class="follow-stat"><strong>{{ profile.followingCount }}</strong> フォロー中</span>
              <span class="follow-stat"><strong>{{ profile.followersCount }}</strong> フォロワー</span>
            </div>
          </div>
        </section>

        <hr class="section-divider" />

        <div class="status-bar">
          <span class="post-count">{{ userPosts.length }}件の投稿</span>
        </div>

        <main class="post-list">
          <p v-if="isPostsLoading" class="status-text">投稿を読み込み中...</p>
          <p v-else-if="postsError" class="status-text error">{{ postsError }}</p>
          <p v-else-if="userPosts.length === 0" class="status-text">投稿がありません</p>

          <article v-else v-for="post in userPosts" :key="post.id" class="post-card" @click="goToPostDetail(post.id)">
            <div class="post-inner">
              <div class="post-header">
                <div class="icon-wrapper" @click.stop="navigateTo(`/users/${post.author.username}`)">
                  <img v-if="post.author.profileImageUrl" :src="post.author.profileImageUrl" class="post-user-icon" alt="" />
                  <div v-else class="post-user-icon post-user-icon--empty" />
                </div>
                <div class="post-user-info">
                  <span class="p-user-name">{{ post.author.displayName || post.author.username }}</span>
                  <span class="p-user-id">@{{ post.author.username }}</span>
                </div>
              </div>

              <div class="post-body"><p>{{ post.content }}</p></div>

              <div class="post-footer" @click.stop>
                <span class="post-time">{{ formatDate(post.createdAt) }}に投稿</span>
                <div class="like-area">
                  <span v-if="post.likeCount > 0" class="like-num">{{ post.likeCount }}</span>
                  <img src="/images/icon_heart.svg" class="heart-icon" alt="いいね" />
                </div>
              </div>
            </div>
          </article>
        </main>
      </template>
    </div>

    <!-- フォロー解除確認モーダル -->
    <div
      v-if="showUnfollowModal"
      class="modal-overlay"
      @click.self="showUnfollowModal = false"
    >
      <div class="modal">
        <p class="modal-message">
          <!-- profile.displayName または username を表示 -->
          {{ profile?.displayName || profile?.username }} さんのフォローを解除しますか？
        </p>
        <p v-if="unfollowError" class="unfollow-error">{{ unfollowError }}</p>
        <div class="modal-buttons">
          <button
            class="modal-cancel-btn"
            @click="showUnfollowModal = false"
          >
            キャンセル
          </button>
          <button
            class="modal-unfollow-btn"
            :disabled="isUnfollowing"
            @click="handleUnfollow"
          >
            {{ isUnfollowing ? '解除中...' : 'フォロー解除する' }}
          </button>
        </div>
      </div>
    </div>

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
.mypage-wrapper { max-width: 600px; margin: 0 auto; background-color: #fff; min-height: 100vh; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
.cover-image { width: 100%; height: 160px; background-color: #eee; display: flex; justify-content: center; align-items: center; overflow: hidden; }
.cover-img { width: 100%; height: 100%; object-fit: cover; }
.cover-placeholder { color: #999; font-size: 14px; }
.profile-main { padding: 0 20px 20px; }
.avatar-wrapper { margin-top: -45px; margin-bottom: 10px; }
.avatar { width: 90px; height: 90px; border-radius: 50%; border: 4px solid #fff; object-fit: cover; display: block; }
.avatar--empty { background-color: #ccc; }
.profile-action { display: flex; justify-content: flex-end; margin-bottom: 10px; }
.edit-btn { background: none; border: 1px solid #c65bed; border-radius: 20px; padding: 6px 16px; font-size: 13px; color: #c65bed; cursor: pointer; font-weight: bold; }
.edit-btn:hover { background-color: #f5e6ff; }

/* フォローボタン */
.follow-btn { background-color: #c65bed; border: none; border-radius: 20px; padding: 6px 16px; font-size: 13px; color: white; cursor: pointer; font-weight: bold; transition: background-color 0.2s; }
.follow-btn:hover { background-color: #a84fd4; }
.follow-btn.following { background-color: #fff; border: 1px solid #ccc; color: #666; }
.follow-btn.following:hover { background-color: #fff0f0; border-color: #f66; color: #f66; }
.follow-btn.pending { background-color: #f0f0f0; border: 1px solid #ccc; color: #999; cursor: default; }
.follow-btn:disabled { opacity: 0.8; }

.user-name { margin: 0; font-size: 22px; }
.user-id { margin: 5px 0 10px; color: #888; font-size: 14px; }
.bio { font-size: 14px; line-height: 1.6; color: #333; margin: 0 0 12px; }
.follow-stats { display: flex; gap: 20px; font-size: 14px; color: #333; }
.follow-stat strong { font-weight: bold; }
.section-divider { border: 0; border-top: 1px solid #eee; margin: 0; }
.status-bar { display: flex; justify-content: space-between; padding: 15px 20px; font-size: 14px; }
.status-text { text-align: center; color: #999; font-size: 14px; padding: 30px 0; }
.status-text.error { color: #f66; }
.post-list { padding: 0 15px 50px; }
.post-card { border: 1px solid #ccc; border-radius: 18px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); background-color: #fff; cursor: pointer; }
.post-card:hover { background-color: #fdf8ff; }
.post-header { display: flex; align-items: center; margin-bottom: 10px; }
.icon-wrapper { flex-shrink: 0; margin-right: 10px; cursor: pointer; }
.icon-wrapper:hover .post-user-icon { opacity: 0.8; }
.post-user-icon { width: 40px; height: 40px; border-radius: 50%; margin-right: 0; flex-shrink: 0; object-fit: cover; display: block; }
.post-user-icon--empty { background-color: #ccc; }
.post-user-info { flex: 1; display: flex; flex-direction: column; }
.p-user-name { font-weight: bold; font-size: 14px; }
.p-user-id { font-size: 12px; color: #999; }
.post-body { font-size: 14px; margin-bottom: 15px; line-height: 1.5; }
.post-body p { margin: 0; }
.post-footer { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #aaa; }
.like-area { display: flex; align-items: center; color: #333; gap: 4px; }
.like-num { font-size: 13px; }
.heart-icon { width: 18px; height: 18px; object-fit: contain; }

/* フォロー解除モーダル */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal {
  background: white;
  border-radius: 16px;
  padding: 30px 24px 20px;
  width: 80%;
  max-width: 320px;
  text-align: center;
}
.modal-message {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 20px;
  color: #333;
  line-height: 1.5;
}
.unfollow-error {
  color: #f66;
  font-size: 13px;
  margin: 0 0 12px;
}
.modal-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}
.modal-cancel-btn {
  flex: 1;
  background: none;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
}
.modal-unfollow-btn {
  flex: 1;
  background-color: #f66;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}
.modal-unfollow-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>