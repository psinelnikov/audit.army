'use client';

import { useAuth } from '../../contexts/AuthContext';
import { connectWallet } from '../../lib/wallet';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';

export function LoginButton() {
  const { authState, login, logout, loading } = useAuth();

  if (loading) {
    return (
      <Button disabled>
        Connecting...
      </Button>
    );
  }

  if (authState.isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {authState.address?.slice(0, 6)}...{authState.address?.slice(-4)}
        </span>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>
    );
  }

  const handleLogin = async () => {
    try {
      // First connect wallet
      await connectWallet();
      // Then authenticate with SIWE
      await login();
    } catch (error: any) {
      console.error('Login failed:', error);
      alert(error.message || 'Login failed. Please try again.');
    }
  };

  return (
    <Button onClick={handleLogin}>
      Connect Wallet
    </Button>
  );
}

export function LoginForm() {
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      // First connect wallet
      await connectWallet();
      // Then authenticate with SIWE
      await login();
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In With Ethereum</CardTitle>
        <CardDescription>
          Connect your wallet to authenticate with the Audit Army platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              You'll be asked to sign a message to verify your identity. This doesn't cost any gas fees.
            </AlertDescription>
          </Alert>
          <Button onClick={handleLogin} className="w-full">
            Connect Wallet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
