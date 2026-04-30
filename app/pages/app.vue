<script setup lang="ts">
interface HealthResponse {
  status: string;
  timestamp: string;
}

const checkHealth = async () => {
  // 1. まずはURLを完全に1つの文字列にして定義してみる
  const fullUrl = "https://apg-joetsu.tail02904.ts.net/api/health"; 
  console.log("アクセス中のURL:", fullUrl);

  try {
    const response = await fetch(fullUrl, { method: 'GET' });

    console.log("HTTPステータス:", response.status); // 200なら成功、404ならURLミス

    const data = await response.json() as HealthResponse;
    
    // Apidogの例通りなら data.status に "ok" が入るはず
    if (data.status === "ok") {
      console.log("サーバーは健康です！時刻:", data.timestamp);
    } else {
      console.log("サーバーから予期せぬ返答:", data);
    }
  } catch (e) {
    console.error("通信失敗（ネットワークエラーなど）:", e);
  }
};

checkHealth();
</script>

<template>

</template>
