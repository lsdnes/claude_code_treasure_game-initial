import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuthModalProps {
  open: boolean;
  onSuccess: (user: { username: string; token: string }) => void;
  onClose: () => void;
}

async function callApi(path: string, body: object) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Unknown error');
  return json;
}

export function AuthModal({ open, onSuccess, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');

  const [siUsername, setSiUsername] = useState('');
  const [siPassword, setSiPassword] = useState('');

  const [suUsername, setSuUsername] = useState('');
  const [suPassword, setSuPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleTabChange(value: string) {
    setTab(value as 'signin' | 'signup');
    setError('');
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!siUsername.trim() || !siPassword) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const json = await callApi('/api/signin', { username: siUsername.trim(), password: siPassword });
      localStorage.setItem('game_token', json.token);
      localStorage.setItem('game_username', json.username);
      onSuccess({ token: json.token, username: json.username });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot reach server. Is the API server running?');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!suUsername.trim() || !suPassword) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const json = await callApi('/api/signup', { username: suUsername.trim(), password: suPassword });
      localStorage.setItem('game_token', json.token);
      localStorage.setItem('game_username', json.username);
      onSuccess({ token: json.token, username: json.username });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot reach server. Is the API server running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-900 text-center text-xl">Welcome, Treasure Hunter!</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="signin-username">Username</Label>
                <Input
                  id="signin-username"
                  value={siUsername}
                  onChange={(e) => setSiUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={siPassword}
                  onChange={(e) => setSiPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="signup-username">Username</Label>
                <Input
                  id="signup-username"
                  value={suUsername}
                  onChange={(e) => setSuUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={suPassword}
                  onChange={(e) => setSuPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
