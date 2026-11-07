/**
 * API Keys management page.
 *
 * Lets users create, list, and revoke API keys for programmatic access
 * (CRM integrations etc.). The full key is shown exactly once on creation.
 */

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Copy, Check, KeyRound, Loader2, Trash2, Plus, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';
import { edgeFunctions } from '@/lib/edgeFunctions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ApiKeyRecord {
  id: string;
  name: string;
  key_prefix: string | null;
  permissions: { read?: boolean; write?: boolean };
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export default function ApiKeysPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  // `copied` flips back after 2s for the icon; this one remembers that the key
  // left the page at least once (button or a manual Ctrl+C), so 'Done' knows
  // whether dismissing would destroy the only copy.
  const [keySaved, setKeySaved] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyRecord | null>(null);
  const keyTextRef = useRef<HTMLElement>(null);

  const {
    data: keys,
    isLoading,
    error: listError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async (): Promise<ApiKeyRecord[]> => {
      const { data, error } = await edgeFunctions.invoke('api-keys', { body: { action: 'list' } });
      if (error) throw new Error(error.message);
      return data?.keys ?? [];
    },
  });

  const createKey = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await edgeFunctions.invoke('api-keys', {
        body: { action: 'create', name },
      });
      if (error) throw new Error(error.message);
      return data as { key: string };
    },
    onSuccess: (data) => {
      setCreatedKey(data.key);
      setCopied(false);
      setCopyFailed(false);
      setKeySaved(false);
      setNewName('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (e) =>
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to create key',
        variant: 'destructive',
      }),
  });

  const revokeKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await edgeFunctions.invoke('api-keys', { body: { action: 'revoke', id } });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({ title: 'Key revoked' });
    },
    onError: (e) =>
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to revoke key',
        variant: 'destructive',
      }),
  });

  /** Select the key text so the agent can copy it by hand. */
  const selectKeyText = () => {
    const el = keyTextRef.current;
    const selection = typeof window !== 'undefined' ? window.getSelection() : null;
    if (!el || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const copyKey = async () => {
    if (!createdKey) return;
    try {
      // navigator.clipboard is undefined outside a secure context, and
      // writeText rejects when the browser refuses (iOS without a gesture,
      // permissions policy). Either way the key must not be lost silently:
      // it is shown exactly once.
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(createdKey);
      setCopyFailed(false);
      setCopied(true);
      setKeySaved(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      logger.warn('API key copy to clipboard failed', {
        reason: e instanceof Error ? e.message : 'unknown',
      });
      setCopied(false);
      setCopyFailed(true);
      selectKeyText();
    }
  };

  const dismissCreatedKey = () => {
    setCreatedKey(null);
    setConfirmDiscard(false);
    setCopied(false);
    setCopyFailed(false);
    setKeySaved(false);
  };

  /** 'Done' destroys the one-time key; ask first if it never left the page. */
  const handleDone = () => {
    if (keySaved) dismissCreatedKey();
    else setConfirmDiscard(true);
  };

  const activeKeys = (keys ?? []).filter((k) => !k.revoked_at);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
        <p className="text-muted-foreground">
          Programmatic access for integrations (Make, Zapier, your CRM). Max 10 active keys.
        </p>
      </div>

      {/* Create */}
      <Card>
        <CardHeader>
          <CardTitle>Create a key</CardTitle>
          <CardDescription>Give it a recognizable name, e.g. "Follow Up Boss".</CardDescription>
        </CardHeader>
        <CardContent>
          {createdKey ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-warning-border bg-warning p-3 text-sm text-warning-foreground">
                Copy this key now — you won't be able to see it again.
              </div>
              <div className="flex items-center gap-2">
                <code
                  ref={keyTextRef}
                  data-testid="created-api-key"
                  onCopy={() => setKeySaved(true)}
                  className="flex-1 select-all break-all rounded bg-muted px-3 py-2 font-mono text-sm"
                >
                  {createdKey}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  onClick={copyKey}
                  aria-label={copied ? 'API key copied' : 'Copy API key'}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
              <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
                {copied
                  ? 'Copied to your clipboard.'
                  : copyFailed
                    ? 'Your browser blocked automatic copying. The key is selected — copy it with Ctrl+C (⌘C on Mac), or press and hold it on a phone.'
                    : ''}
              </p>
              <Button variant="outline" onClick={handleDone}>
                Done
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                aria-label="API key name"
                placeholder="Key name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && newName.trim() && createKey.mutate(newName.trim())
                }
              />
              <Button
                onClick={() => createKey.mutate(newName.trim())}
                disabled={!newName.trim() || createKey.isPending}
              >
                {createKey.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Your keys{!isLoading && !listError ? ` (${activeKeys.length})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : listError ? (
            <div role="alert" className="py-6 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-600" aria-hidden="true" />
              <p className="mt-3 font-semibold text-foreground">Couldn’t load your API keys</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your existing keys are unaffected and still work. Check your connection and try
                again.
              </p>
              <Button
                variant="outline"
                className="mt-4 gap-2"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`h-4 w-4${isFetching ? ' animate-spin' : ''}`}
                  aria-hidden="true"
                />
                Try again
              </Button>
            </div>
          ) : activeKeys.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No active API keys yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {activeKeys.map((k) => (
                <li key={k.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">{k.name}</div>
                      <div className="text-xs text-muted-foreground">
                        <code>{k.key_prefix ?? 'ab_'}…</code> · created{' '}
                        {new Date(k.created_at).toLocaleDateString()}
                        {k.last_used_at
                          ? ` · last used ${new Date(k.last_used_at).toLocaleDateString()}`
                          : ' · never used'}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setRevokeTarget(k)}
                    aria-label={`Revoke ${k.name}`}
                    disabled={revokeKey.isPending && revokeKey.variables === k.id}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close without copying the key?</AlertDialogTitle>
            <AlertDialogDescription>
              You haven’t copied this key yet. Once you close it, it can’t be shown again — you
              would have to revoke it and create a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back and copy it</AlertDialogCancel>
            <AlertDialogAction onClick={dismissCreatedKey}>I’ve saved it — close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {revokeTarget ? `Revoke “${revokeTarget.name}”?` : 'Revoke this API key?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Any integration using this key will immediately lose access. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (revokeTarget) revokeKey.mutate(revokeTarget.id);
                setRevokeTarget(null);
              }}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
