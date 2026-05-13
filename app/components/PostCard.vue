<!-- app/components/PostCard.vue -->
<script setup lang="ts">
import type { Post } from '~/composables/usePost'
import { usePost } from '~/composables/usePost'
import { useUser } from '~/composables/useUser'

const props = defineProps<{
  post: Post
}>()

const emit = defineEmits<{
  deleted: [postId: string]
}>()

const { addLike, removeLike, createPost, createQuote, deleteQuote, updatePost, deletePost } = usePost()
const { fetchUserProfile } = useUser()

const isLiked = ref(props.post.isLiked)
const likeCount = ref(props.post.likeCount)
const isLiking = ref(false)
const quoteCount = ref(props.post.quoteCount)
const isQuoted = ref(props.post.isQuoted)
const isQuoting = ref(false)
const replyCount = ref(props.post.replyCount)
const showReplyForm = ref(false)
const replyContent = ref('')
const isReplying = ref(false)
const replyError = ref('')
const showQuoteModal = ref(false)
const quoteContent = ref('')
const quoteError = ref('')
const showMenu = ref(false)
const isDeleting = ref(false)
const loggedInUsername = useCookie('username').value
const isMyPost = computed(() => props.post.author.username === loggedInUsername)
const isMyQuotePost = computed(() => isMyPost.value && props.post.quotedMessage != null)
const myProfileImageUrl = ref('')

const currentContent = ref(props.post.content)
const currentVisibility = ref(props.post.visibility)
const currentIsEdited = ref(props.post.isEdited)

const showEditModal = ref(false)
const editContent = ref('')
const editVisibility = ref<'public' | 'followers' | 'private'>('public')
const isUpdating = ref(false)
const editError = ref('')

const loadMyProfile = async () => {
  if (!loggedInUsername) return
  try {
    const profile = await fetchUserProfile(loggedInUsername)
    myProfileImageUrl.value = profile.profileImageUrl ?? ''
  } catch { /* 失敗しても問題なし */ }
}

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

const goToProfile = (event: Event) => {
  event.stopPropagation()
  navigateTo(`/users/${props.post.author.username}`)
}

const goToDetail = () => {
  navigateTo(`/posts/${props.post.id}`)
}

const handleLikeClick = (event: Event) => {
  event.stopPropagation()
  handleLike()
}

const handleQuoteClick = (event: Event) => {
  event.stopPropagation()
  if (isQuoted.value) {
    handleDeleteQuoteFromCard()
  } else {
    quoteContent.value = ''
    quoteError.value = ''
    showQuoteModal.value = true
  }
}

const handleQuoteSubmit = async (event: Event) => {
  event.stopPropagation()
  if (!quoteContent.value.trim()) return
  isQuoting.value = true
  quoteError.value = ''
  try {
    await createQuote(props.post.id, quoteContent.value)
    isQuoted.value = true
    quoteCount.value += 1
    showQuoteModal.value = false
    quoteContent.value = ''
  } catch (error: any) {
    if (error.status === 401) {
      quoteError.value = 'ログインが必要です'
    } else if (error.status === 400) {
      quoteError.value = '入力内容に誤りがあります'
    } else {
      quoteError.value = '引用リツイートに失敗しました'
    }
  } finally {
    isQuoting.value = false
  }
}

const handleDeleteQuoteFromCard = async () => {
  isQuoting.value = true
  try {
    await deleteQuote(props.post.id)
    isQuoted.value = false
    quoteCount.value = Math.max(0, quoteCount.value - 1)
  } catch {
    alert('引用リツイートの取り消しに失敗しました')
  } finally {
    isQuoting.value = false
  }
}

const handleDeleteQuotePost = async (event: Event) => {
  event.stopPropagation()
  showMenu.value = false
  if (!props.post.quotedMessage) return
  isDeleting.value = true
  try {
    await deleteQuote(props.post.quotedMessage.id)
    emit('deleted', props.post.id)
  } catch {
    alert('削除に失敗しました')
  } finally {
    isDeleting.value = false
  }
}

const openEditModal = (event: Event) => {
  event.stopPropagation()
  showMenu.value = false
  editContent.value = currentContent.value
  editVisibility.value = currentVisibility.value as 'public' | 'followers' | 'private'
  editError.value = ''
  showEditModal.value = true
}

const handleUpdate = async (event: Event) => {
  event.stopPropagation()
  if (!editContent.value.trim()) return
  isUpdating.value = true
  editError.value = ''
  try {
    await updatePost(props.post.id, editContent.value, editVisibility.value)
    currentContent.value = editContent.value
    currentVisibility.value = editVisibility.value
    currentIsEdited.value = true
    showEditModal.value = false
  } catch (error: any) {
    if (error.status === 401) {
      editError.value = 'ログインが必要です'
    } else if (error.status === 403) {
      editError.value = '編集する権限がありません'
    } else if (error.status === 400) {
      editError.value = '入力内容に誤りがあります'
    } else {
      editError.value = '編集に失敗しました'
    }
  } finally {
    isUpdating.value = false
  }
}

const handleDelete = async (event: Event) => {
  event.stopPropagation()
  showMenu.value = false
  isDeleting.value = true
  try {
    await deletePost(props.post.id)
    emit('deleted', props.post.id)
  } catch {
    alert('削除に失敗しました')
  } finally {
    isDeleting.value = false
  }
}

const handleReplyClick = (event: Event) => {
  event.stopPropagation()
  showReplyForm.value = !showReplyForm.value
  if (!showReplyForm.value) {
    replyContent.value = ''
    replyError.value = ''
  }
}

const handleReplySubmit = async (event: Event) => {
  event.stopPropagation()
  if (!replyContent.value.trim()) return
  isReplying.value = true
  replyError.value = ''
  try {
    await createPost({
      content: replyContent.value,
      visibility: 'public',
      replyToId: props.post.id
    })
    replyContent.value = ''
    showReplyForm.value = false
    replyCount.value += 1
  } catch (error: any) {
    if (error.status === 401) {
      replyError.value = 'ログインが必要です'
    } else {
      replyError.value = 'リプライに失敗しました'
    }
  } finally {
    isReplying.value = false
  }
}

const handleReplyCancel = (event: Event) => {
  event.stopPropagation()
  showReplyForm.value = false
  replyContent.value = ''
  replyError.value = ''
}

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 1000 / 60)
  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}時間前`
  return `${Math.floor(diffMin / 60 / 24)}日前`
}

onMounted(() => {
  loadMyProfile()
})
</script>

<template>
  <article class="post-card" @click="goToDetail">
    <div class="post-inner">

      <div
        v-if="post.replyToId"
        class="reply-to-label"
        @click.stop="navigateTo(`/posts/${post.replyToId}`)"
      >
        元の投稿を見る
      </div>

      <div class="post-header">
        <div v-if="isMyPost" class="post-menu-btn" @click.stop>
          <button class="menu-dots-btn" @click="showMenu = !showMenu">•••</button>
          <div v-if="showMenu" class="menu-dropdown">
            <template v-if="isMyQuotePost">
              <div class="menu-item delete-item" @click="handleDeleteQuotePost">
                🗑 引用リツイートを削除
              </div>
            </template>
            <template v-else>
              <div class="menu-item" @click="openEditModal">投稿を編集</div>
              <div class="menu-item delete-item" @click="handleDelete">投稿を削除</div>
            </template>
          </div>
        </div>

        <!-- UserAvatarコンポーネントに置き換え -->
        <div class="icon-wrapper" @click="goToProfile">
          <UserAvatar
            :profile-image-url="post.author.profileImageUrl"
            :size="40"
          />
        </div>

        <div class="post-user-info">
          <div class="name-row">
            <span class="p-user-name">{{ post.author.displayName || post.author.username }}</span>
            <span class="post-time-inline">・{{ formatRelativeTime(post.createdAt) }}</span>
          </div>
          <span class="p-user-id">@{{ post.author.username }}</span>
        </div>
      </div>

      <div class="post-body">
        <p>{{ currentContent }}</p>
      </div>

      <div
        v-if="post.quotedMessage"
        class="quoted-post"
        @click.stop="navigateTo(`/posts/${post.quotedMessage.id}`)"
      >
        <div class="quoted-author">
          <!-- 引用元のアイコンもUserAvatarに -->
          <UserAvatar
            :profile-image-url="post.quotedMessage.author.profileImageUrl"
            :size="20"
          />
          <span class="quoted-name">{{ post.quotedMessage.author.displayName || post.quotedMessage.author.username }}</span>
          <span class="quoted-username">@{{ post.quotedMessage.author.username }}</span>
        </div>
        <p class="quoted-content">{{ post.quotedMessage.content }}</p>
      </div>

      <div class="post-footer" @click.stop>
        <div class="action-area">
          <div class="action-item">
            <button class="action-button" :class="{ 'is-active': showReplyForm }" @click="handleReplyClick">
              <img src="/images/icon_reply.svg" class="action-icon" :class="{ 'icon-purple': showReplyForm }" alt="リプライ" />
            </button>
            <span class="action-count" :class="{ 'count-purple': showReplyForm }">{{ replyCount > 0 ? replyCount : '' }}</span>
          </div>
          <div class="action-item">
            <button class="action-button" :disabled="isQuoting" @click="handleQuoteClick">
              <img src="/images/icon_retweet.svg" class="action-icon" :class="{ 'icon-purple': isQuoted }" alt="引用リツイート" />
            </button>
            <span class="action-count" :class="{ 'count-purple': isQuoted }">{{ quoteCount > 0 ? quoteCount : '' }}</span>
          </div>
          <div class="action-item">
            <button class="action-button" :disabled="isLiking" @click="handleLikeClick">
              <img v-if="isLiked" src="/images/icon_heart_fill.svg" class="action-icon icon-purple" alt="いいね済み" />
              <img v-else src="/images/icon_heart.svg" class="action-icon" alt="いいね" />
            </button>
            <span class="action-count" :class="{ 'count-purple': isLiked }">{{ likeCount > 0 ? likeCount : '' }}</span>
          </div>
          <div class="action-item views-item">
            <img src="/images/icon_views.svg" class="action-icon" alt="閲覧数" />
            <span class="action-count">{{ post.viewCount > 0 ? post.viewCount : '' }}</span>
          </div>
        </div>
      </div>

      <div v-if="showReplyForm" class="reply-form" @click.stop>
        <div class="reply-form-inner">
          <!-- 自分のアイコンもUserAvatarに -->
          <UserAvatar :profile-image-url="myProfileImageUrl" :size="36" />
          <div class="reply-input-area">
            <textarea
              v-model="replyContent"
              class="reply-textarea"
              placeholder="返信を入力..."
              rows="3"
              maxlength="250"
              @click.stop
            ></textarea>
            <div class="reply-char-count" :class="{ 'error': replyContent.length > 250 }">
              {{ replyContent.length }} / 250
            </div>
          </div>
        </div>
        <p v-if="replyError" class="reply-error">{{ replyError }}</p>
        <div class="reply-actions">
          <button class="reply-cancel-btn" @click="handleReplyCancel">キャンセル</button>
          <button
            class="reply-submit-btn"
            :disabled="!replyContent.trim() || replyContent.length > 250 || isReplying"
            @click="handleReplySubmit"
          >
            {{ isReplying ? '送信中...' : '返信する' }}
          </button>
        </div>
      </div>

    </div>
  </article>

  <!-- 引用リツイートモーダル -->
  <div v-if="showQuoteModal" class="modal-overlay" @click.self="showQuoteModal = false">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">引用リツイート</h3>
        <button class="modal-close-btn" @click="showQuoteModal = false">×</button>
      </div>
      <div class="modal-body">
        <div class="quote-preview">
          <div class="quote-preview-author-row">
            <UserAvatar :profile-image-url="post.author.profileImageUrl" :size="24" />
            <span class="quote-preview-name">{{ post.author.displayName || post.author.username }}</span>
            <span class="quote-preview-username">@{{ post.author.username }}</span>
          </div>
          <p class="quote-preview-content">{{ post.content }}</p>
        </div>
        <textarea v-model="quoteContent" class="quote-textarea" placeholder="コメントを入力（1〜250文字）" maxlength="250"></textarea>
        <div class="char-count" :class="{ 'error': quoteContent.length > 250 }">{{ quoteContent.length }} / 250</div>
        <p v-if="quoteError" class="quote-error">{{ quoteError }}</p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="showQuoteModal = false">キャンセル</button>
        <button class="submit-btn" @click="handleQuoteSubmit" :disabled="!quoteContent.trim() || quoteContent.length > 250 || isQuoting">
          {{ isQuoting ? '送信中...' : '引用する' }}
        </button>
      </div>
    </div>
  </div>

  <!-- 投稿編集モーダル -->
  <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">投稿を編集</h3>
        <button class="modal-close-btn" @click="showEditModal = false">×</button>
      </div>
      <div class="modal-body">
        <textarea v-model="editContent" class="edit-textarea" placeholder="投稿内容を入力" maxlength="250"></textarea>
        <div class="char-count" :class="{ 'error': editContent.length > 250 }">{{ editContent.length }} / 250</div>
        <div class="visibility-selector">
          <label class="visibility-label">公開範囲</label>
          <div class="visibility-options">
            <label class="visibility-option"><input type="radio" v-model="editVisibility" value="public" />全員</label>
            <label class="visibility-option"><input type="radio" v-model="editVisibility" value="followers" />フォロワーのみ</label>
            <label class="visibility-option"><input type="radio" v-model="editVisibility" value="private" />自分のみ</label>
          </div>
        </div>
        <p v-if="editError" class="edit-error">{{ editError }}</p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="showEditModal = false">キャンセル</button>
        <button class="submit-btn" @click="handleUpdate" :disabled="!editContent.trim() || editContent.length > 250 || isUpdating">
          {{ isUpdating ? '保存中...' : '保存する' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-card { border: 1px solid #ccc; border-radius: 18px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); background-color: #fff; cursor: pointer; }
.post-card:hover { background-color: #fdf8ff; }
.reply-to-label { font-size: 12px; color: #6a21aa; margin-bottom: 8px; cursor: pointer; display: inline-block; }
.reply-to-label:hover { text-decoration: underline; }
.post-header { display: flex; align-items: center; margin-bottom: 10px; position: relative; }
.post-menu-btn { position: absolute; top: -4px; right: -4px; z-index: 10; }
.menu-dots-btn { background: none; border: none; font-size: 14px; color: #aaa; cursor: pointer; padding: 4px 6px; border-radius: 50%; letter-spacing: 1px; }
.menu-dots-btn:hover { background-color: #f0e6fa; color: #6a21aa; }
.menu-dropdown { position: absolute; top: 28px; right: 0; background: white; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-width: 180px; z-index: 100; overflow: hidden; }
.menu-item { padding: 12px 16px; font-size: 14px; cursor: pointer; }
.menu-item:hover { background-color: #f5f0ff; }
.delete-item { color: #f66; }
.delete-item:hover { background-color: #fff0f0; }
/* icon-wrapperのサイズ指定を削除（UserAvatarが管理） */
.icon-wrapper { flex-shrink: 0; margin-right: 10px; cursor: pointer; }
.icon-wrapper:hover { opacity: 0.8; }
.post-user-info { flex: 1; display: flex; flex-direction: column; }
.name-row { display: flex; align-items: center; gap: 2px; }
.p-user-name { font-weight: bold; font-size: 14px; }
.post-time-inline { font-size: 12px; color: #999; }
.p-user-id { font-size: 12px; color: #999; margin-top: 2px; }
.post-body { font-size: 14px; margin-bottom: 10px; line-height: 1.5; }
.post-body p { margin: 0; }
.quoted-post { border: 1px solid #e0e0e0; border-radius: 12px; padding: 10px 12px; margin-bottom: 10px; background-color: #f8f8f8; cursor: pointer; }
.quoted-post:hover { background-color: #f0e6ff; }
.quoted-author { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.quoted-name { font-weight: bold; font-size: 12px; color: #555; }
.quoted-username { font-size: 11px; color: #aaa; }
.quoted-content { margin: 0; font-size: 13px; color: #777; line-height: 1.5; }
.post-footer { display: flex; justify-content: center; align-items: center; }
.action-area { display: flex; align-items: center; gap: 20px; }
.action-item { display: flex; align-items: center; gap: 4px; }
.views-item { cursor: default; }
.action-button { background: none; border: none; padding: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.action-button:disabled { cursor: not-allowed; opacity: 0.7; }
.action-button:hover { background-color: #f0e6fa; }
.action-icon { width: 20px; height: 20px; object-fit: contain; }
.action-count { font-size: 13px; color: #666; min-width: 16px; }
.icon-purple { filter: brightness(0) saturate(100%) invert(27%) sepia(90%) saturate(500%) hue-rotate(250deg) brightness(0.8); }
.count-purple { color: #6a21aa; }
.reply-form { margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; }
.reply-form-inner { display: flex; gap: 10px; align-items: flex-start; }
.reply-input-area { flex: 1; }
.reply-textarea { width: 100%; border: 1px solid #ddd; border-radius: 8px; padding: 8px 10px; font-size: 14px; resize: none; outline: none; box-sizing: border-box; font-family: inherit; }
.reply-textarea:focus { border-color: #c65bed; }
.reply-char-count { text-align: right; font-size: 11px; color: #999; margin-top: 2px; }
.reply-char-count.error { color: red; }
.reply-error { color: #f66; font-size: 12px; margin: 4px 0; }
.reply-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.reply-cancel-btn { background: none; border: 1px solid #ddd; border-radius: 14px; padding: 5px 12px; font-size: 13px; cursor: pointer; }
.reply-submit-btn { background-color: #c65bed; color: white; border: none; border-radius: 14px; padding: 5px 12px; font-size: 13px; font-weight: bold; cursor: pointer; }
.reply-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 2000; display: flex; justify-content: center; align-items: center; }
.modal { background: white; border-radius: 16px; width: 90%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #eee; }
.modal-title { margin: 0; font-size: 16px; font-weight: bold; }
.modal-close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #999; }
.modal-body { padding: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #eee; }
.cancel-btn { background: none; border: 1px solid #ddd; border-radius: 20px; padding: 8px 16px; font-size: 14px; cursor: pointer; }
.submit-btn { background-color: #c65bed; color: white; border: none; border-radius: 20px; padding: 8px 16px; font-size: 14px; font-weight: bold; cursor: pointer; }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.quote-preview { border: 1px solid #e0e0e0; border-radius: 10px; padding: 12px; margin-bottom: 16px; background-color: #f8f8f8; }
.quote-preview-author-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.quote-preview-name { font-weight: bold; font-size: 13px; color: #333; }
.quote-preview-username { font-size: 12px; color: #999; }
.quote-preview-content { margin: 0; font-size: 13px; color: #555; line-height: 1.5; }
.quote-textarea { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; outline: none; resize: none; min-height: 100px; font-family: inherit; }
.quote-textarea:focus { border-color: #c65bed; }
.char-count { text-align: right; font-size: 12px; color: #666; margin-top: 4px; }
.char-count.error { color: red; font-weight: bold; }
.quote-error { color: #f66; font-size: 13px; margin: 8px 0 0; }
.edit-textarea { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; outline: none; resize: none; min-height: 120px; font-family: inherit; }
.edit-textarea:focus { border-color: #c65bed; }
.visibility-selector { margin-top: 16px; }
.visibility-label { display: block; font-size: 13px; font-weight: bold; color: #333; margin-bottom: 8px; }
.visibility-options { display: flex; flex-direction: column; gap: 8px; }
.visibility-option { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
.edit-error { color: #f66; font-size: 13px; margin: 8px 0 0; }
</style>