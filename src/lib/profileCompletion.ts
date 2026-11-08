/**
 * The steps of the dashboard's profile-completion checklist (US-487).
 *
 * Pulled out of ProfileCompletionWidget so the rules can be tested without
 * rendering it. Until this the widget could read 100% and hide itself while
 * the page was still unpublished — and an unpublished page shows a visitor
 * nothing at all — and it never asked for the brokerage logo or service
 * areas, which the profile form has a tab and an upload for.
 */
import type { Profile } from '@/types/profile';

export interface CompletionStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  link: string;
  priority: 'high' | 'medium' | 'low';
}

export type CompletionProfile = Pick<
  Profile,
  | 'avatar_url'
  | 'bio'
  | 'phone'
  | 'email_display'
  | 'theme'
  | 'brokerage_logo'
  | 'service_cities'
  | 'service_zip_codes'
  | 'is_published'
>;

export interface CompletionCounts {
  listings: number;
  testimonials: number;
  links: number;
}

/** Profile form tabs a checklist step may open directly with `?tab=`. */
export const PROFILE_TABS = [
  'basic',
  'professional',
  'contact',
  'service',
  'social',
  'seo',
] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];

/** The tab named by `?tab=` in a query string, or 'basic' for anything else. */
export function profileTabFromSearch(search: string): ProfileTab {
  const requested = new URLSearchParams(search).get('tab');
  return (PROFILE_TABS as readonly string[]).includes(requested ?? '')
    ? (requested as ProfileTab)
    : 'basic';
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function buildCompletionSteps(
  profile: CompletionProfile,
  counts: CompletionCounts
): CompletionStep[] {
  const serviceAreas =
    (profile.service_cities?.length ?? 0) + (profile.service_zip_codes?.length ?? 0);

  return [
    {
      id: 'avatar',
      label: 'Add profile photo',
      description: 'Upload a professional headshot',
      completed: hasText(profile.avatar_url),
      link: '/dashboard/profile',
      priority: 'high',
    },
    {
      id: 'bio',
      label: 'Write your bio',
      description: 'Tell visitors about your experience',
      completed: !!profile.bio && profile.bio.length > 50,
      link: '/dashboard/profile',
      priority: 'high',
    },
    {
      id: 'contact',
      label: 'Add contact info',
      description: 'Phone and email for leads',
      completed: hasText(profile.phone) || hasText(profile.email_display),
      link: '/dashboard/profile?tab=contact',
      priority: 'high',
    },
    {
      id: 'listings',
      label: 'Add your first listing',
      description: "Showcase properties you're selling",
      completed: counts.listings > 0,
      link: '/dashboard/listings',
      priority: 'medium',
    },
    {
      id: 'service-areas',
      label: 'Add service areas',
      description: 'The cities and ZIP codes you work in',
      completed: serviceAreas > 0,
      link: '/dashboard/profile?tab=service',
      priority: 'medium',
    },
    {
      id: 'testimonials',
      label: 'Add testimonials',
      description: 'Build trust with client reviews',
      completed: counts.testimonials > 0,
      link: '/dashboard/testimonials',
      priority: 'medium',
    },
    {
      id: 'brokerage-logo',
      label: 'Add your brokerage logo',
      description: 'Shown beside your name on your page',
      completed: hasText(profile.brokerage_logo),
      link: '/dashboard/profile?tab=professional',
      priority: 'low',
    },
    {
      id: 'links',
      label: 'Add custom links',
      description: 'Link to your website and social',
      completed: counts.links > 0,
      link: '/dashboard/links',
      priority: 'low',
    },
    {
      id: 'theme',
      label: 'Customize theme',
      description: 'Match your brand colors',
      completed: !!profile.theme,
      link: '/dashboard/theme',
      priority: 'low',
    },
    {
      // Only `true` is live: RLS compares is_published = true, so NULL is
      // hidden from visitors exactly like false.
      id: 'publish',
      label: 'Publish your page',
      description: 'Visitors see nothing until your page is live',
      completed: profile.is_published === true,
      link: '/dashboard/settings#publish',
      priority: 'high',
    },
  ];
}

/**
 * The step to suggest next: the first unfinished high-priority one, else the
 * first unfinished step. Publishing is high priority but listed last, so it is
 * suggested once the photo, bio and contact details are in — not before an
 * agent has anything worth showing.
 */
export function nextCompletionStep(steps: CompletionStep[]): CompletionStep | undefined {
  return (
    steps.find((s) => s.priority === 'high' && !s.completed) ?? steps.find((s) => !s.completed)
  );
}
