import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// دالة لتهيئة Pi Network SDK
const initPiSDK = () => {
  if (window.Pi) {
    window.Pi.init({ version: "2.0", sandbox: true });
    console.log("Pi SDK Initialized");
  } else {
    console.error("Pi SDK not found");
  }
};

// التأكد من أن عنصر الـ root موجود في الصفحة قبل التشغيل
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  
  // تهيئة الـ SDK قبل عرض التطبيق
  initPiSDK();

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Error: Could not find element with id 'root'. Check your public/index.html");
}
