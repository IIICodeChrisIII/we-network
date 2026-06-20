import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Sidebar';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Landing from './pages/Landing';
import News from './pages/News';
import Channels from './pages/Channels';
import Career from './pages/Career';
import Contacts from './pages/Contacts';
import Profile from './pages/Profile';

function AppLayout({ children }) {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<AppLayout><Landing /></AppLayout>} />
        <Route path="/feed" element={<AppLayout><News /></AppLayout>} />
        <Route path="/channels" element={<AppLayout><Channels /></AppLayout>} />
        <Route path="/career" element={<AppLayout><Career /></AppLayout>} />
        <Route path="/contacts" element={<AppLayout><Contacts /></AppLayout>} />
        <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
        <Route path="/admin/dashboard" element={<AppLayout><AdminDashboard /></AppLayout>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
