<script setup lang="ts">
const props = defineProps<{
  profileImageUrl?: string | null
  size?: number
}>()

const sizePx = computed(() => `${props.size ?? 40}px`)
const iconSize = computed(() => `${(props.size ?? 40) * 0.55}px`)
</script>

<template>
  <img
    v-if="profileImageUrl"
    :src="profileImageUrl"
    class="avatar-img"
    :style="{ width: sizePx, height: sizePx }"
    alt="ユーザーアイコン"
  />
  <div
    v-else
    class="avatar-default"
    :style="{ width: sizePx, height: sizePx }"
  >
    <img
      src="/images/icon_mypage.svg"
      class="avatar-default-icon"
      :style="{ width: iconSize, height: iconSize }"
      alt="デフォルトアイコン"
    />
  </div>
</template>

<style scoped>
.avatar-img {
  border-radius: 50%;
  object-fit: cover;
  display: block;
  flex-shrink: 0;
}
.avatar-default {
  border-radius: 50%;
  background-color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-default-icon {
  object-fit: contain;
  filter: brightness(0) invert(1);
}
</style>