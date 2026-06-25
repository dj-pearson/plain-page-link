/**
 * Lead Routing Rules (team admin)
 *
 * Create/list/toggle/delete auto-assignment rules. Rules are evaluated
 * server-side by priority; unmatched leads fall back to round-robin among
 * team members.
 */

import { useState } from 'react';
import { Loader2, Plus, Trash2, GitBranch } from 'lucide-react';
import { useLeadRouting } from '@/hooks/useLeadRouting';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Member {
  user_id: string | null;
  email: string | null;
}

interface LeadRoutingRulesProps {
  teamId: string;
  members: Member[];
}

const LEAD_TYPES = ['any', 'buyer', 'seller', 'valuation', 'contact'];

export function LeadRoutingRules({ teamId, members }: LeadRoutingRulesProps) {
  const { rules, isLoading, createRule, toggleRule, deleteRule } = useLeadRouting(teamId);
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [leadType, setLeadType] = useState('any');
  const [assignedTo, setAssignedTo] = useState<string>('round_robin');
  const [priority, setPriority] = useState(100);

  const assignable = members.filter((m) => m.user_id);

  const handleCreate = () => {
    if (!name.trim()) return;
    createRule.mutate(
      {
        name: name.trim(),
        criteria: leadType === 'any' ? {} : { lead_type: leadType },
        assigned_to: assignedTo === 'round_robin' ? null : assignedTo,
        priority,
      },
      {
        onSuccess: () => {
          setName('');
          setLeadType('any');
          setAssignedTo('round_robin');
          setPriority(100);
          toast({ title: 'Routing rule created' });
        },
        onError: (e) =>
          toast({
            title: 'Error',
            description: e instanceof Error ? e.message : 'Failed to create rule',
            variant: 'destructive',
          }),
      }
    );
  };

  const memberLabel = (userId: string | null) =>
    members.find((m) => m.user_id === userId)?.email ?? 'Unassigned';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Lead Routing</CardTitle>
            <CardDescription>
              Auto-assign incoming leads. Rules run by priority; unmatched leads round-robin across
              the team.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create form */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          <Input
            placeholder="Rule name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="sm:col-span-2"
          />
          <Select value={leadType} onValueChange={setLeadType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === 'any' ? 'Any type' : t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="round_robin">Round-robin</SelectItem>
              {assignable.map((m) => (
                <SelectItem key={m.user_id!} value={m.user_id!}>
                  {m.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} disabled={!name.trim() || createRule.isPending}>
            {createRule.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add
          </Button>
        </div>

        {/* Rules list */}
        {isLoading ? (
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : rules.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No routing rules yet — leads round-robin across the team by default.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rules.map((rule) => (
              <li key={rule.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-medium text-foreground">
                    {rule.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      priority {rule.priority}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {rule.criteria.lead_type ? `${rule.criteria.lead_type} → ` : 'any → '}
                    {rule.assigned_to ? memberLabel(rule.assigned_to) : 'round-robin'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(checked) =>
                      toggleRule.mutate({ id: rule.id, is_active: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => deleteRule.mutate(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
