/**
 * Renders a median response time an agent can stand behind.
 *
 * US-111: the public profile hard-coded responseTime: '< 1 hour' for every
 * agent, and the sticky action bar repeated "Responds in < 1 hour" as literal
 * text. Neither came from data. On a licensed professional's public page that
 * is an advertising claim the platform invented on their behalf.
 *
 * `hours` is the median from public_agent_response_hours, which returns null
 * below five responded leads in 90 days. Null renders nothing at all — no
 * badge is better than a made-up one, which is this story's whole point.
 */
export function formatResponseTime(hours: number | null | undefined): string | undefined {
  if (hours === null || hours === undefined || !Number.isFinite(hours) || hours < 0) {
    return undefined;
  }

  if (hours < 1) {
    const minutes = Math.max(1, Math.round(hours * 60));
    return `~${minutes} min`;
  }
  if (hours < 24) {
    const rounded = Math.round(hours);
    return `~${rounded} ${rounded === 1 ? 'hour' : 'hours'}`;
  }

  const days = Math.round(hours / 24);
  return `~${days} ${days === 1 ? 'day' : 'days'}`;
}
