import { Phone, Mail, MessageSquare } from 'lucide-react';
import type { PublicProfile } from '@/types/profile';

interface ContactButtonsProps {
  profile: PublicProfile;
  onContactClick?: (method: string) => void;
}

export default function ContactButtons({ profile, onContactClick }: ContactButtonsProps) {
  const handleClick = (method: string, value: string) => {
    if (onContactClick) {
      onContactClick(method);
    }

    // Open native app/action
    if (method === 'phone') {
      window.location.href = `tel:${value}`;
    } else if (method === 'email') {
      window.location.href = `mailto:${value}`;
    } else if (method === 'sms') {
      window.location.href = `sms:${value}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Get in Touch</h3>

      {/* US-234: label colours come from --theme-on-* (applyTheme picks black
          or white for each fill). They were hard-coded white: 3.68:1 on the
          default blue, 1.67:1 on Luxe's gold. The fallbacks are pairs that pass
          on their own, for a profile with no theme. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Phone Button */}
        {profile.phone && (
          <button
            onClick={() => handleClick('phone', profile.phone!)}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
            style={{
              backgroundColor: `hsl(var(--theme-primary, 221 83% 53%))`,
              color: `hsl(var(--theme-on-primary, 0 0% 100%))`,
            }}
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
            <span>Call</span>
          </button>
        )}

        {/* Email Button */}
        {profile.email_display && (
          <button
            onClick={() => handleClick('email', profile.email_display!)}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
            style={{
              backgroundColor: `hsl(var(--theme-secondary, 142 71% 45%))`,
              color: `hsl(var(--theme-on-secondary, 0 0% 0%))`,
            }}
          >
            <Mail className="h-5 w-5" aria-hidden="true" />
            <span>Email</span>
          </button>
        )}

        {/* SMS Button */}
        {profile.phone && profile.sms_enabled && (
          <button
            onClick={() => handleClick('sms', profile.phone!)}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
            style={{
              backgroundColor: `hsl(var(--theme-accent, 38 92% 50%))`,
              color: `hsl(var(--theme-on-accent, 0 0% 0%))`,
            }}
          >
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
            <span>Text</span>
          </button>
        )}
      </div>

      {/* Contact info display for desktop */}
      <div className="hidden md:block mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-col items-center gap-2 text-sm text-gray-600">
          {profile.phone && (
            <a href={`tel:${profile.phone}`} className="hover:text-blue-600 transition-colors">
              {profile.phone}
            </a>
          )}
          {profile.email_display && (
            <a
              href={`mailto:${profile.email_display}`}
              className="hover:text-blue-600 transition-colors"
            >
              {profile.email_display}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
