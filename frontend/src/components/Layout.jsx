import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
