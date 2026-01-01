'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Key, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { db } from '@/lib/db/schema';
import { useLiveQuery } from 'dexie-react-hooks';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [apiKey, setApiKey] = React.useState('');
  const [showKey, setShowKey] = React.useState(false);

  // Load saved API key
  const savedKey = useLiveQuery(() => db.settings.get('openai_api_key'), []);

  React.useEffect(() => {
    if (savedKey?.value) {
      setApiKey(savedKey.value);
    }
  }, [savedKey]);

  const handleSaveApiKey = async () => {
    await db.settings.put({ key: 'openai_api_key', value: apiKey });
    toast.success('API key saved');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Theme Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-medium">Appearance</h2>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Select your preferred color scheme
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* AI Section */}
        <section>
          <h2 className="mb-4 text-lg font-medium">AI Settings</h2>
          <div className="rounded-lg border p-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <p className="font-medium">OpenAI API Key</p>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  Required for AI features. Get your key from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    OpenAI
                  </a>
                </p>
                <div className="flex gap-2">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="font-mono"
                  />
                  <Button variant="outline" onClick={() => setShowKey(!showKey)}>
                    {showKey ? 'Hide' : 'Show'}
                  </Button>
                  <Button onClick={handleSaveApiKey}>Save</Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally in your browser and never sent to our servers.
              </p>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* About Section */}
        <section>
          <h2 className="mb-4 text-lg font-medium">About</h2>
          <div className="rounded-lg border p-4">
            <p className="mb-2 font-medium">Notes</p>
            <p className="text-sm text-muted-foreground">
              A beautiful, minimal note-taking app with AI assistance. Built with Next.js, Tiptap, and
              the Vercel AI SDK.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">Version 1.0.0</p>
          </div>
        </section>
      </main>
    </div>
  );
}
