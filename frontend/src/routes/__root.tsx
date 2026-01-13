import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { Film, FolderOpen, Settings, Home } from 'lucide-react';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 text-primary-600">
                <Film className="h-8 w-8" />
                <span className="font-bold text-xl">Reel Generator</span>
              </Link>

              {/* Nav links */}
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors [&.active]:text-primary-600 [&.active]:bg-primary-50"
                >
                  <Home className="h-4 w-4" />
                  Start
                </Link>
                <Link
                  to="/create"
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors [&.active]:text-primary-600 [&.active]:bg-primary-50"
                >
                  <Film className="h-4 w-4" />
                  Nowa rolka
                </Link>
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors [&.active]:text-primary-600 [&.active]:bg-primary-50"
                >
                  <FolderOpen className="h-4 w-4" />
                  Projekty
                </Link>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors [&.active]:text-primary-600 [&.active]:bg-primary-50"
                >
                  <Settings className="h-4 w-4" />
                  Ustawienia
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden border-t border-gray-100">
          <div className="flex justify-around py-2">
            <Link to="/" className="flex flex-col items-center p-2 text-gray-600 [&.active]:text-primary-600">
              <Home className="h-5 w-5" />
              <span className="text-xs">Start</span>
            </Link>
            <Link to="/create" className="flex flex-col items-center p-2 text-gray-600 [&.active]:text-primary-600">
              <Film className="h-5 w-5" />
              <span className="text-xs">Nowa</span>
            </Link>
            <Link to="/projects" className="flex flex-col items-center p-2 text-gray-600 [&.active]:text-primary-600">
              <FolderOpen className="h-5 w-5" />
              <span className="text-xs">Projekty</span>
            </Link>
            <Link to="/settings" className="flex flex-col items-center p-2 text-gray-600 [&.active]:text-primary-600">
              <Settings className="h-5 w-5" />
              <span className="text-xs">Ustawienia</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Reel Generator - AI-powered video script generator
          </p>
        </div>
      </footer>
    </div>
  );
}
