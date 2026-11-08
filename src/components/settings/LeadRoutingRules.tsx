/**
 * Lead Routing Rules (team admin)
 *
 * Create/list/toggle/delete auto-assignment rules. Rules are evaluated
 * server-side by priority; unmatched leads fall back to round-robin among
 * team members.
 */

import { useState } from 'react';
import { Loader2, Plus, Trash2, GitBranch, UserX } from 'lucide-react';
import { useLeadRouting } from '@/hooks/useLeadRouting';
import { describeRuleAssignee, type RosterEntry } from '@/lib/routingRuleAssignee';
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
import { SectionLoadError } from '@/components/dashboard/SectionLoadError';

interface LeadRoutingRulesProps {
  teamId: string;
  members: RosterEntry[];
}

const LEAD_TYPES = ['any', 'buyer', 'seller', 'valuation', 'contact', 'open_house'];

export function LeadRoutingRules({ teamId, members }: LeadRoutingRulesProps) {
  const { rules, isLoading, isError, refetch, createRule, toggleRule, deleteRule } =
    useLeadRouting(teamId);
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [leadType, setLeadType] = useState('any');
  // The trigger evaluates lead_type, source and zip. The form only ever wrote
  // lead_type, so the other two were unreachable from the UI while RoutingCriteria
  // advertised five fields (US-105). price_min/price_max are gone from the type:
  // they matched against price_range, a free-text column an agent types by
  // hand, so a rule on them fired according to how the visitor phrased a budget.
  const [source, setSource] = useState('');
  const [zip, setZip] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('round_robin');
  const [priority, setPriority] = useState(100);

  const assignable = members.filter((m) => m.user_id);

  const handleCreate = () => {
    if (!name.trim()) return;
    createRule.mutate(
      {
        name: name.trim(),
        criteria: {
          ...(leadType === 'any' ? {} : { lead_type: leadType }),
          ...(source.trim() ? { source: source.trim() } : {}),
          ...(zip.trim() ? { zip: zip.trim() } : {}),
        },
        assigned_to: assignedTo === 'round_robin' ? null : assignedTo,
        priority,
      },
      {
        onSuccess: () => {
          setName('');
          setLeadType('any');
          setSource('');
          setZip('');
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-6">
          <Input
            aria-label="Rule name"
            placeholder="Rule name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="sm:col-span-2"
          />
          <Select value={leadType} onValueChange={setLeadType}>
            <SelectTrigger aria-label="Lead type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === 'any' ? 'Any type' : t.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="ZIP (optional)"
            aria-label="ZIP code"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            inputMode="numeric"
          />
          <Input
            placeholder="Source (optional)"
            aria-label="Lead source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger aria-label="Assign to">
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
        ) : isError ? (
          // US-612: not "No routing rules yet" — that reads as "leads
          // round-robin" when rules the agent set may be routing them.
          <SectionLoadError
            message="Your routing rules did not load."
            onRetry={() => void refetch()}
            retryLabel="Retry loading routing rules"
          />
        ) : rules.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No routing rules yet — leads round-robin across the team by default.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rules.map((rule) => {
              const assignee = describeRuleAssignee(rule.assigned_to, members);
              // US-454: a departed teammate's rule is paused and routes nothing
              // even if switched on, so turning it back on is not offered.
              const cannotResume = assignee.kind === 'departed' && !rule.is_active;
              return (
                <li key={rule.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground">
                      {rule.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        priority {rule.priority}
                        {!rule.is_active && ' · paused'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {rule.criteria.lead_type ? `${rule.criteria.lead_type} → ` : 'any → '}
                      {assignee.kind === 'member'
                        ? assignee.email
                        : assignee.kind === 'round_robin'
                          ? 'round-robin'
                          : 'unassigned'}
                    </div>
                    {assignee.kind === 'departed' && (
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-foreground">
                        <UserX className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          The teammate this rule assigned to has left the team, so it no longer
                          assigns leads. Delete it and add a new rule for someone on the team.
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      aria-label={`${rule.is_active ? 'Pause' : 'Resume'} rule ${rule.name}`}
                      checked={rule.is_active}
                      disabled={cannotResume}
                      onCheckedChange={(checked) =>
                        toggleRule.mutate({ id: rule.id, is_active: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete rule ${rule.name}`}
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => deleteRule.mutate(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
