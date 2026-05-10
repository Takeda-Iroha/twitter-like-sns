<!-- app/components/AppHeader.vue -->
<script setup lang="ts">
// 親コンポーネントからisMenuOpenを操作できるようにemitを使う
// emit：子から親へイベントを伝える仕組み
// 「メニューを開いて」というイベントを親に伝える
const emit = defineEmits<{
  openMenu: []
}>()
</script>

<template>
  <header class="header">
    <div class="menu_icon" @click="emit('openMenu')">
      <img src="/images/icon_menu.svg" alt="メニューを表示" />
    </div>
    <h1 class="logo">APG</h1>
    <div class="spacer"></div>
  </header>
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
.logo { font-size: 20px; margin: 0; }
.menu_icon img { width: 24px; height: 24px; }
.spacer { width: 25px; }
</style>