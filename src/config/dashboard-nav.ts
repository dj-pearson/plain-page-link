/**
 * The dashboard's navigation, in one place (US-120).
 *
 * There were two lists — DashboardLayout's sidebar and MobileNav's — and they
 * disagreed: /dashboard/subscription, /team and /api-keys were in the sidebar
 * and absent from mobile entirely, so an agent on a phone could not reach their
 * own billing. The sidebar carried fifteen entries for a link-in-bio product
 * aimed at people who are not technical.
 *
 * Seven primary destinations, and everything else reachable from Settings.
 * Both navs render from this file, and a test asserts they cover the same set.
 */
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  KeyRound,
  LayoutDashboard,
  Link as LinkIcon,
  Palette,
  Settings,
  Star,
  Trash2,
  User,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface NavDestination {
  label: string;
  href: string;
  icon: LucideIcon;
  /** A one-line explanation, shown where there is room for one. */
  description?: string;
}

/**
 * The dashboard's own navigation. Seven entries, in the order an agent works:
 * see the numbers, edit who they are, then the things on their page, then the
 * people it produced.
 */
export const PRIMARY_NAV: NavDestination[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
  { label: 'Links', href: '/dashboard/links', icon: LinkIcon },
  { label: 'Listings', href: '/dashboard/listings', icon: Building2 },
  { label: 'Leads', href: '/dashboard/leads', icon: Users },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

/**
 * Everything else, reachable from the Settings page.
 *
 * Not hidden — linked from one place that an agent can find, instead of
 * competing with the seven things they do every day. /dashboard/settings/
 * delete-account in particular had no link anywhere in the app.
 */
export const SETTINGS_TOOLS: NavDestination[] = [
  {
    label: 'Theme',
    href: '/dashboard/theme',
    icon: Palette,
    description: 'Colours, fonts and layout for your public page',
  },
  {
    label: 'Testimonials',
    href: '/dashboard/testimonials',
    icon: Star,
    description: 'Client reviews, and which ones appear publicly',
  },
  {
    label: 'Page Builder',
    href: '/dashboard/page-builder',
    icon: FileText,
    description: 'Extra sections to show on your profile',
  },
  {
    label: 'Quick Actions',
    href: '/dashboard/quick-actions',
    icon: Zap,
    description: 'Shortcuts for the things you do most',
  },
  {
    label: 'Workflows',
    href: '/dashboard/workflows',
    icon: Workflow,
    description: 'Automate follow-up when a lead arrives',
  },
  {
    label: 'Subscription',
    href: '/dashboard/subscription',
    icon: CreditCard,
    description: 'Your plan, invoices and billing',
  },
  {
    label: 'Team',
    href: '/dashboard/team',
    icon: Users,
    description: 'Invite colleagues and manage access',
  },
  {
    label: 'API Keys',
    href: '/dashboard/api-keys',
    icon: KeyRound,
    description: 'Keys for connecting other tools',
  },
  {
    label: 'Delete Account',
    href: '/dashboard/settings/delete-account',
    icon: Trash2,
    description: 'Permanently remove your account and data',
  },
];

/** Every dashboard destination either nav offers. */
export const ALL_NAV_DESTINATIONS: NavDestination[] = [...PRIMARY_NAV, ...SETTINGS_TOOLS];
