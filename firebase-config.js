// 请在 Firebase 控制台 (https://console.firebase.google.com) 创建项目后，
// 将下面的配置替换为您的项目配置（项目设置 → 常规 → 您的应用 → 配置）。
var firebaseConfig = {
  apiKey: "AIzaSyDLPpkdYMyU_mpmkjWUd1S4HiYEMPxIwFs",
  authDomain: "medication-reminder-a3dbf.firebaseapp.com",
  projectId: "medication-reminder-a3dbf",
  storageBucket: "medication-reminder-a3dbf.firebasestorage.app",
  messagingSenderId: "105403173862",
  appId: "1:105403173862:web:61a17132806591ddcfe427"
};

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  firebase.initializeApp(firebaseConfig);
  var db = firebase.firestore();
  // 保持登录状态（关闭网页后再打开仍为已登录）
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function() {});
} else {
  var db = null;
}
