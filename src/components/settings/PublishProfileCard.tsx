/**
 * Publish controls for the agent's public page (US-265, first slice of US-142).
 *
 * `profiles.is_published` decides whether /:username shows anything to a
 * visitor (RLS, the crawler Pages Function and the profile sitemap all read
 * it), and until now no screen could change it. An agent could not take their
 * page down while they changed brokerages, and could not look at it before
 * handing out the link.
 *
 * Going live is one tap. Taking the page down asks first, because every link
 * already shared — business cards, Instagram bio, yard signs — stops working
 * the moment it is saved.
 */
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export function PublishProfileCard() {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false);
  const hasProfile = !!profile?.username;

  // The preview banner on the public page links to /dashboard/settings#publish.
  // React Router does not scroll to a hash, so do it once the card exists.
  useEffect(() => {
    if (hasProfile && window.location.hash === '#publish') {
      document.getElementById('publish')?.scrollIntoView?.({ block: 'start' });
    }
  }, [hasProfile]);

  if (!hasProfile || !profile) return null;

  // Only `true` is live: RLS compares is_published = true, so NULL is hidden.
  const isLive = profile.is_published === true;
  const pagePath = `/${profile.username}`;
  const pageHost = typeof window !== 'undefined' ? window.location.host : 'agentbio.net';

  const save = (next: boolean) => {
    updateProfile.mutate(
      { is_published: next },
      {
        onSuccess: () => {
          // The public page caches the profile under ['public-profile', …];
          // without this the owner's own tab kept showing the old state.
          void queryClient.invalidateQueries({ queryKey: ['public-profile'] });
          toast({
            title: next ? 'Your page is live' : 'Your page is unpublished',
            description: next
              ? `Visitors can see ${pageHost}${pagePath} again.`
              : 'Visitors now see “This page isn’t available”. Only you can preview it.',
          });
        },
        onError: (error) => {
          logger.error('Failed to change the publish state of the profile', error);
          toast({
            title: 'Could not save',
            description: 'Your page is unchanged. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const onToggle = (checked: boolean) => {
    if (checked) {
      save(true);
    } else {
      setConfirmingUnpublish(true);
    }
  };

  return (
    <Card id="publish" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
          Publish your page
        </CardTitle>
        <CardDescription>
          {isLive
            ? `Live at ${pageHost}${pagePath}. Anyone with the link can see it.`
            : 'Not published. Visitors see “This page isn’t available” and search engines drop it.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="profile-published" className="text-sm font-medium text-foreground">
            Page is live
          </Label>
          <Switch
            id="profile-published"
            checked={isLive}
            disabled={updateProfile.isPending}
            onCheckedChange={onToggle}
          />
        </div>
        <a
          href={pagePath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          {isLive ? 'View your page' : 'Preview as visitor'}
        </a>
      </CardContent>

      <AlertDialog open={confirmingUnpublish} onOpenChange={setConfirmingUnpublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish your page?</AlertDialogTitle>
            <AlertDialogDescription>
              Every link you have shared to {pageHost}
              {pagePath} will show “This page isn’t available” until you publish again. No leads can
              reach you through it in the meantime. Your listings, links and reviews are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it live</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmingUnpublish(false);
                save(false);
              }}
            >
              Unpublish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
