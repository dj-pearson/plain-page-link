/**
 * Follow-ups that are due, on the dashboard.
 *
 * US-103: lead_activities has carried task_due_date, task_priority and
 * task_completed_at since it was created, and nothing ever inserted a task or
 * listed the due ones. The product's claim is that nothing pulls an agent back
 * to an unanswered lead — this is the block that makes it true.
 *
 * Overdue tasks are shown alongside today's, not hidden once their date passes:
 * a slipped reminder is the one that most needs surfacing.
 */
import { Link } from 'react-router-dom';
import { CheckSquare, CalendarClock } from 'lucide-react';
import { isPast } from '@/lib/dateFormat';
import { formatDistanceToNowWithSuffix } from '@/lib/relativeTime';
import { useDueLeadTasks, useLeadActivities } from '@/hooks/useLeadActivities';
import { taskDueAt } from '@/lib/localDate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionLoadError } from './SectionLoadError';

export function DueFollowUps() {
  const { data: tasks = [], isLoading, isError, refetch } = useDueLeadTasks();
  const { completeTask, completingTaskId } = useLeadActivities(undefined);

  // US-590: a failed query is not "nothing due". Rendering nothing here told
  // an agent with overdue follow-ups that they had none.
  if (isError) {
    return (
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Due today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SectionLoadError
            message="Your follow-ups did not load."
            onRetry={() => void refetch()}
            retryLabel="Retry loading follow-ups"
          />
        </CardContent>
      </Card>
    );
  }

  // An empty block is noise on a dashboard. Nothing due, nothing rendered.
  if (isLoading || tasks.length === 0) return null;

  const overdue = tasks.filter((t) => {
    const due = taskDueAt(t.task_due_date);
    return due !== null && isPast(due);
  });

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <CalendarClock className="h-4 w-4" aria-hidden="true" />
          Due today
          {overdue.length > 0 && (
            <Badge variant="destructive" className="ml-1">
              {overdue.length} overdue
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.slice(0, 8).map((task) => {
          const due = taskDueAt(task.task_due_date);
          const late = due ? isPast(due) : false;
          const title = task.title || 'Follow up';
          const completing = completingTaskId === task.id;
          return (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-lg border p-3 min-h-[44px]"
            >
              <div className="min-w-0 flex-1">
                <Link
                  to={`/dashboard/leads?lead=${task.lead_id}`}
                  className="block truncate text-sm font-medium hover:text-primary"
                >
                  {title}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {task.leads?.name ?? 'Lead'}
                  {due && (
                    <span className={late ? 'text-red-600' : undefined}>
                      {' · '}
                      {late ? 'overdue ' : 'due '}
                      {formatDistanceToNowWithSuffix(due)}
                    </span>
                  )}
                </p>
              </div>
              {/* US-618: this was h-8 (32px) on a phone, under the 44px touch
                  target, with no pending state, so a double tap sent the
                  update twice. size="default" is h-11 below sm. */}
              <Button
                variant="outline"
                className="flex-shrink-0 gap-1 px-3 text-xs sm:text-xs"
                onClick={() => completeTask(task.id)}
                disabled={completing}
                aria-busy={completing || undefined}
                aria-label={`Mark "${title}" done`}
              >
                <CheckSquare className="h-3 w-3" aria-hidden="true" />
                {completing ? 'Saving…' : 'Done'}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
