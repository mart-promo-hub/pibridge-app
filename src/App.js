import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================
// ملف واحد كامل ومُصحح - تطبيق جسر باي | PiBridge
// ============================================================

const establishSession = async (accessToken) => {
  const response = await fetch('/api/pi/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Unable to establish Pi session');
  }

  return data.user;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const piInitPromiseRef = useRef(null);
  const autoAuthStartedRef = useRef(false);

  const campaigns = [
    { id: 1, name: 'حملة رمضان', platform: 'فيسبوك + تويتر', status: 'نشطة', views: 1250, clicks: 340 },
    { id: 2, name: 'إطلاق تطبيق جديد', platform: 'يوتيوب + تيك توك', status: 'مكتملة', views: 890, clicks: 210 },
    { id: 3, name: 'ترويج منتج', platform: 'إنستغرام', status: 'قيد المراجعة', views: 0, clicks: 0 }
  ];

  const products = [
    { id: 1, name: '📱 خطة أساسية', price: 5, desc: '10 حملات/شهر' },
    { id: 2, name: '⭐ خطة احترافية', price: 15, desc: 'حملات غير محدودة' },
    { id: 3, name: '🏢 خطة مؤسسات', price: 30, desc: 'فريق + CRM' }
  ];

  const initializePi = useCallback(async () => {
    if (typeof window === 'undefined' || !window.Pi) {
      throw new Error('Pi SDK is not available');
    }

    if (!piInitPromiseRef.current) {
      piInitPromiseRef.current = Promise.resolve(window.Pi.init({ version: '2.0', sandbox: true }));
    }

    await piInitPromiseRef.current;
  }, []);

  const handleLogin = useCallback(async ({ automatic = false } = {}) => {
    if (authenticating) return;

    try {
      setAuthenticating(true);
      setAuthMessage('');
      await initializePi();

      const auth = await window.Pi.authenticate(['username'], {
        onIncompletePaymentFound: (payment) => {
          console.log('Incomplete payment found:', payment);
        }
      });

      const verifiedUser = await establishSession(auth.accessToken);
      setUser(verifiedUser);
      localStorage.setItem('pibridge_user', JSON.stringify(verifiedUser));
    } catch (error) {
      console.error('Auth error:', error);
      const message = 'يرجى فتح التطبيق داخل متصفح Pi وتسجيل الدخول مرة أخرى.';
      setAuthMessage(message);

      if (!automatic) {
        alert(`❌ فشل تسجيل الدخول. ${message}`);
      }
    } finally {
      setAuthenticating(false);
    }
  }, [authenticating, initializePi]);

  useEffect(() => {
    if (autoAuthStartedRef.current) return;
    autoAuthStartedRef.current = true;

    const initApp = async () => {
      try {
        const savedUser = localStorage.getItem('pibridge_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        await handleLogin({ automatic: true });
      } finally {
        setLoading(false);
      }
    };
    
    initApp();
  }, [handleLogin]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pibridge_user');
    fetch('/api/pi/session', { method: 'DELETE' }).catch(() => {});
  };

  const handlePayment = async (productName, price) => {
    try {
      if (typeof window !== 'undefined' && window.Pi) {
        await window.Pi.createPayment({
          amount: parseFloat(price),
          memo: `شراء ${productName} - جسر باي`,
          metadata: { product: productName }
        }, {
          onReadyForServer: (paymentId) => {
            console.log('Payment ready for server:', paymentId);
          },
          onPending: (payment) => {
            console.log('Payment pending:', payment);
          },
          onComplete: () => {
            setPaymentMessage(`✅ تم شراء ${productName} بنجاح!`);
          },
          onCancel: () => {
            setPaymentMessage('❌ تم إلغاء عملية الدفع.');
          },
          onError: () => {
            setPaymentMessage('❌ حدث خطأ أثناء الدفع.');
          }
        });
      } else {
        setPaymentMessage('⚠️ يرجى استخدام متصفح Pi لإتمام الدفع.');
      }
    } catch (error) {
      setPaymentMessage('❌ حدث خطأ أثناء الاتصال بـ Pi.');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loader}></div>
        <h1 style={styles.loadingTitle}>🌉 جسر باي</h1>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <h1 style={styles.authTitle}>جسر باي</h1>
          {authMessage && <p style={styles.authMessage}>{authMessage}</p>}
          <button onClick={() => handleLogin()} style={styles.loginBtn} disabled={authenticating}>
            {authenticating ? 'جاري تسجيل الدخول...' : '🔑 تسجيل الدخول بـ Pi Network'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.navContainer}>
          <h2>جسر باي</h2>
          <div>
            <button onClick={() => setActiveTab('dashboard')}>📊 الرئيسية</button>
            <button onClick={() => setActiveTab('payments')}>💰 الدفع</button>
            <button onClick={handleLogout}>🚪 خروج</button>
          </div>
        </div>
      </nav>

      <div style={styles.pageContainer}>
        {paymentMessage && <div style={styles.message}>{paymentMessage}</div>}
        {activeTab === 'dashboard' ? (
          <div>
            <h1>مرحباً بك، {user.username} 👋</h1>
            <p>إدارة حملاتك من هنا.</p>
            {campaigns.map(campaign => (
              <div key={campaign.id} style={styles.productCard}>
                <h3>{campaign.name}</h3>
                <p>{campaign.platform} - {campaign.status}</p>
                <p>{campaign.views} مشاهدة - {campaign.clicks} نقرة</p>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <h1>🛒 اشتراكات جسر باي</h1>
            {products.map(p => (
              <div key={p.id} style={styles.productCard}>
                <h3>{p.name}</h3>
                <p>{p.desc}</p>
                <p>{p.price} Pi</p>
                <button onClick={() => handlePayment(p.name, p.price)}>اشترِ الآن</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  appContainer: { minHeight: '100vh', background: '#f0f4f8', padding: '20px' },
  loadingScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  authContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  authCard: { background: 'white', padding: '40px', borderRadius: '20px', textAlign: 'center' },
  authMessage: { color: '#b00020', maxWidth: '320px' },
  loginBtn: { background: '#1a237e', color: 'white', padding: '15px 30px', border: 'none', borderRadius: '10px', cursor: 'pointer' },
  navbar: { background: 'white', padding: '10px', display: 'flex', justifyContent: 'space-between' },
  pageContainer: { maxWidth: '800px', margin: 'auto' },
  message: { padding: '10px', margin: '10px 0', borderRadius: '5px', background: '#e8f5e9' },
  productCard: { border: '1px solid #ddd', padding: '20px', margin: '10px 0', borderRadius: '10px' },
  loader: { border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 2s linear infinite' }
};

export default App;
