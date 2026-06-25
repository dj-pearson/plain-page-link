/**
 * API Keys management page.
 *
 * Lets users create, list, and revoke API keys for programmatic access
 * (CRM integrations etc.). The full key is shown exactly once on creation.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Check, KeyRound, Loader2, Trash2, Plus } from 'lucide-react';
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
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data: keys, isLoading } = useQuery({
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

  const copyKey = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Copy this key now — you won't be able to see it again.
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-muted px-3 py-2 font-mono text-sm">
                  {createdKey}
                </code>
                <Button variant="outline" size="icon" onClick={copyKey}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button variant="outline" onClick={() => setCreatedKey(null)}>
                Done
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
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
          <CardTitle>Your keys ({activeKeys.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
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
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setRevokeId(k.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!revokeId} onOpenChange={() => setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this API key?</AlertDialogTitle>
            <AlertDialogDescription>
              Any integration using this key will immediately lose access. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (revokeId) revokeKey.mutate(revokeId);
                setRevokeId(null);
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
