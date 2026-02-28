// 请在 Firebase 控制台 (https://console.firebase.google.com) 创建项目后，
// 将下面的配置替换为您的项目配置（项目设置 → 常规 → 您的应用 → 配置）。
var firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  firebase.initializeApp(firebaseConfig);
  var db = firebase.firestore();
  // 保持登录状态（关闭网页后再打开仍为已登录）
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function() {});
} else {
  var db = null;
}
