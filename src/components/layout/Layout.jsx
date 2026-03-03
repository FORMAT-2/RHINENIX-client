import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Main content – leaves room for the bottom nav on mobile */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
