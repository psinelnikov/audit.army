'use client';

import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { formatAddress } from '../../lib/wallet';

export default function Header() {
  const { authState, login, logout, loading } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-card border-b border-border camo-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AA</span>
              </div>
              <span className="text-xl font-bold text-foreground">Audit Army</span>
            </Link>
          </div>

          {/* Authentication Status */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            ) : authState.isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="hidden sm:block">
                  <p className="text-sm text-muted-foreground">Connected as</p>
                  <p className="text-sm font-mono text-primary">{formatAddress(authState.address!)}</p>
                </div>
                
                {/* Mobile User Info */}
                <div className="sm:hidden">
                  <p className="text-xs text-muted-foreground">Connected</p>
                  <p className="text-xs font-mono text-primary">{formatAddress(authState.address!, 4)}</p>
                </div>
                
                {/* Desktop Logout Button */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="hidden md:block camo-border"
                >
                  Logout
                </Button>
                
                {/* Mobile Logout Button */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="md:hidden camo-border"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Desktop Login Button */}
                <Button
                  onClick={handleLogin}
                  className="hidden md:block bg-primary hover:bg-primary/90"
                >
                  Connect Wallet
                </Button>
                
                {/* Mobile Login Button */}
                <Button
                  onClick={handleLogin}
                  size="sm"
                  className="md:hidden bg-primary hover:bg-primary/90"
                >
                  Connect
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
