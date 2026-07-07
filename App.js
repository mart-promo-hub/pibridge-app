import React, { useState, useEffect } from 'react';

// ============================================================
// ملف واحد كامل ومُصحح - تطبيق جسر باي | PiBridge
// ============================================================

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const [campaigns] = useState([
    { id: 1, name: 'حملة رمضان', platform: 'فيسبوك + تويتر', status: 'نشطة', views: 1250, clicks: 340 },
    { id: 2, name: 'إطلاق تطبيق جديد', platform: 'يوتيوب + تيك توك', status: 'مكتملة', views: 890, clicks: 210 },
    { id: 3, name: 'ترويج منتج', platform: 'إنستغرام', status: 'قيد المراجعة', views: 0, clicks: 0 }
  ]);

  const products = [
    { id: 1, name: '📱 خطة أساسية', price: 5, desc: '10 حملات/شهر' },
    { id: 2, name: '⭐ خطة احترافية', price: 15, desc: 'حملات غير محدودة' },
    { id: 3, name: '🏢 خطة مؤسسات', price: 30, desc: 'فريق + CRM' }
  ];

  useEffect(() => {
    const initApp = async () => {
      try {
        if (typeof window !== 'undefined' && window.Pi) {
          window.Pi.init({ version: '2.0', sandbox: true });
          console.log('✅ Pi SDK initialized');

          // Check if already authenticated or if user exists in local storage
          const savedUser = localStorage.getItem('pibridge_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initApp();
  }, []);

  const handleLogin = async () => {
    try {
      if (typeof window !== 'undefined' && window.Pi) {
        // Authenticate the user
        const auth = await window.Pi.authenticate(['username', 'payments'], {
          onIncompletePaymentFound: (payment) => {
            console.log('Incomplete payment found:', payment);
            // Optionally handle incomplete payment
          }
        });
        
        const userData = {
          username: auth.user.username,
          uid: auth.user.uid,
          accessToken: auth.accessToken
        };
        setUser(userData);
        localStorage.setItem('pibridge_user', JSON.stringify(userData));
      } else {
        alert('يرجى فتح التطبيق داخل متصفح Pi (Pi Browser)');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('❌ فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pibridge_user');
  };

  const handlePayment = async (productName, price) => {
    try {
      if (typeof window !== 'undefined' && window.Pi) {
        const payment = await window.Pi.createPayment({
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
          onComplete: (payment) => {
            setPaymentMessage(`✅ تم شراء ${productName} بنجاح!`);
          },
          onCancel: (payment) => {
            setPaymentMessage('❌ تم إلغاء عملية الدفع.');
          },
          onError: (error, payment) => {
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
          <button onClick={handleLogin} style={styles.loginBtn}>
            🔑 تسجيل الدخول بـ Pi Network
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
          </div>
        ) : (
          <div>
            <h1>🛒 اشتراكات جسر باي</h1>
            {products.map(p => (
              <div key={p.id} style={styles.productCard}>
                <h3>{p.name}</h3>
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
  loginBtn: { background: '#1a237e', color: 'white', padding: '15px 30px', border: 'none', borderRadius: '10px', cursor: 'pointer' },
  navbar: { background: 'white', padding: '10px', display: 'flex', justifyContent: 'space-between' },
  pageContainer: { maxWidth: '800px', margin: 'auto' },
  message: { padding: '10px', margin: '10px 0', borderRadius: '5px', background: '#e8f5e9' },
  productCard: { border: '1px solid #ddd', padding: '20px', margin: '10px 0', borderRadius: '10px' },
  loader: { border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 2s linear infinite' }
};

export default App;
