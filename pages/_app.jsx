// pages/_app.jsx
import '../styles/globals.css';
import 'react-datepicker/dist/react-datepicker.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TrustBanner from '../components/TrustBanner';

// Pages that use the admin layout (no public nav/footer)
const ADMIN_PAGES   = ['/admin'];
const NO_NAV_PAGES  = ['/auth/login', '/auth/register', '/auth/forgot-password'];

export default function App({ Component, pageProps, router }) {
  const path          = router.pathname;
  const isAdmin       = path.startsWith('/admin');
  const isAuth        = NO_NAV_PAGES.some(p => path.startsWith(p));
  const showPublicNav = !isAdmin && !isAuth;

  return (
    <AuthProvider>
      <div className="min-h-screen bg-brand-black noise">
        {/* Mesh gradient background */}
        <div className="fixed inset-0 mesh-bg pointer-events-none" aria-hidden />

        {showPublicNav && <Navbar />}

        {showPublicNav && (
          <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
            {/* Intentionally empty – trust strip is per-page */}
          </div>
        )}

        <main className={showPublicNav ? 'pt-16' : ''}>
          <Component {...pageProps} />
        </main>

        {showPublicNav && <Footer />}

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#16162a',
              color: '#f8f8ff',
              border: '1px solid rgba(99,102,241,0.20)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          }}
        />
      </div>
    </AuthProvider>
  );
}
