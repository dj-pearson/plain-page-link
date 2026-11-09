import { LeadNotificationPreferences } from '@/components/settings/LeadNotificationPreferences';
import { TimeZoneSetting } from '@/components/settings/TimeZoneSetting';
import { NativeMFASettings } from '@/components/auth/mfa/NativeMFASettings';
import { SessionManagement } from '@/components/settings/SessionManagement';
import { AuditLogViewer } from '@/components/settings/AuditLogViewer';
import { GDPRSettings } from '@/components/settings/GDPRSettings';

/**
 * Everything under the Settings page's "Security & Privacy" header.
 *
 * Its own chunk, loaded when the reader scrolls near the header (US-516).
 * These six sections were inlined into the Settings chunk and, with the
 * dropdown-menu, select and MFA code they pull in, made up most of what the
 * page downloaded beyond the dashboard layout, all of it far below the fold.
 * Mounting them on approach also defers their own requests (sessions, audit
 * log, MFA factors, export history) until someone is going to look at them.
 */
export default function SecurityPrivacySections() {
  return (
    <>
      {/* Lead Notification Preferences */}
      <LeadNotificationPreferences />

      {/* Time zone (US-433): when the morning email arrives */}
      <TimeZoneSetting />

      {/* Two-Factor Authentication */}
      <NativeMFASettings />

      {/* Session Management */}
      <SessionManagement />

      {/* Security Activity / Audit Logs */}
      <AuditLogViewer />

      {/* GDPR Settings (Data Export & Account Deletion) */}
      <GDPRSettings />
    </>
  );
}
