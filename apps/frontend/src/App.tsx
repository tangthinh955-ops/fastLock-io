import { useState } from 'react';
import Tab0Dashboard from './components/Tab0Dashboard';
import Tab1Products from './components/Tab1Products';
import Tab2LiveMonitor from './components/Tab2LiveMonitor';
import Tab3Livestream from './components/Tab3Livestream';
import Tab4Orders from './components/Tab4Orders';

export default function App() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar điều hướng */}
      <aside style={{ width: 250, background: '#1e1e2f', color: '#fff', padding: 20 }}>
        <h2 style={{ color: '#00d2ff', marginBottom: 30 }}>fastLock.io</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
            {[
              { id: 0, label: 'Tổng quan (Dashboard)', role: 'A' },
              { id: 1, label: 'Sản phẩm & Kho', role: 'A' },
              { id: 2, label: 'Phòng Chốt Đơn', role: 'B' },
              { id: 3, label: 'Quản lý Livestream', role: 'B' },
              { id: 4, label: 'Lịch sử Đơn hàng', role: 'A' }
            ].map((tab) => (
              <li key={tab.id} style={{ marginBottom: 10 }}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 15px',
                    background: activeTab === tab.id ? '#3a3a55' : 'transparent',
                    color: activeTab === tab.id ? '#00d2ff' : '#a0a0b0',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: activeTab === tab.id ? 'bold' : 'normal'
                  }}
                >
                  {tab.label} <span style={{ fontSize: 10, opacity: 0.6 }}>({tab.role})</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Vùng hiển thị nội dung trang */}
      <main style={{ flex: 1, background: '#f5f5f9', padding: 30 }}>
        {activeTab === 0 && <Tab0Dashboard />}
        {activeTab === 1 && <Tab1Products />}
        {activeTab === 2 && <Tab2LiveMonitor />}
        {activeTab === 3 && <Tab3Livestream />}
        {activeTab === 4 && <Tab4Orders />}
      </main>
    </div>
  );
}
