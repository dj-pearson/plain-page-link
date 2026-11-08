import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageBuilderStore } from '@/stores/pageBuilderStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Globe,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { uniqueSlug } from '@/lib/pageSlug';
import { createNewPage } from '@/lib/pageBuilder';
import { pageTemplates, applyTemplate } from '@/lib/pageTemplates';
import { useAuthStore } from '@/stores/useAuthStore';
import type { PageConfig } from '@/types/pageBuilder';

/** The public profile renders the active page only while it is published
 * (usePublicProfile filters on both). */
const isLivePage = (page: PageConfig): boolean => page.isActive === true && page.published === true;

interface DeletePageDialogProps {
  page: PageConfig | null;
  username: string | null;
  /** A published page that could be set as active instead, if there is one. */
  otherPublishedTitle: string | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeletePageDialog({
  page,
  username,
  otherPublishedTitle,
  deleting,
  onCancel,
  onConfirm,
}: DeletePageDialogProps) {
  const live = page ? isLivePage(page) : false;
  const title = page?.title || 'this page';
  const blockCount = page?.blocks.length ?? 0;
  const host = typeof window !== 'undefined' ? window.location.host : 'agentbio.net';
  const where = username ? `${host}/${username}` : 'your public page';

  return (
    <AlertDialog
      open={page !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {live ? 'Delete your live page?' : `Delete “${title}”?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {live ? (
              <>
                “{title}” is what visitors see at {where}. Deleting it removes its {blockCount}{' '}
                {blockCount === 1 ? 'block' : 'blocks'} from your public page straight away. Your
                profile, listings, links and reviews stay.
                {otherPublishedTitle
                  ? ` To keep a custom page showing, set “${otherPublishedTitle}” as active first.`
                  : ''}{' '}
                This cannot be undone.
              </>
            ) : (
              <>
                This deletes the page and its blocks. Your public page does not change. This cannot
                be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {live ? 'Keep it live' : 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              // Stay open until the delete settles, so a failure is not hidden
              // behind a dialog that already closed.
              event.preventDefault();
              onConfirm();
            }}
          >
            {deleting ? 'Deleting…' : live ? 'Delete live page' : 'Delete page'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PageList() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { setPage, loadUserPages, setAsActivePage } = usePageBuilderStore();
  const [pages, setPages] = useState<PageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  // A failed load is not "no pages". Showing the empty state for it told an
  // agent with a live page to create their first one.
  const [loadFailed, setLoadFailed] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  // The page awaiting delete confirmation. A native confirm() said the same
  // thing for every page, so deleting the live one dropped its blocks off the
  // public profile with no warning (US-642).
  const [pendingDelete, setPendingDelete] = useState<PageConfig | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const userPages = await loadUserPages();
      setPages(userPages);
      setLoadFailed(false);
    } catch (error) {
      logger.error('Failed to load pages', error as Error);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (!user || !profile) {
      toast.error('Please log in to create a page');
      return;
    }

    setShowTemplates(true);
  };

  const handleSelectTemplate = (templateId: string | null) => {
    if (!user || !profile) {
      toast.error('Please log in to create a page');
      return;
    }

    // Unique, not `profile.username` every time. custom_pages has a UNIQUE
    // (user_id, slug), so the second page an agent created collided on
    // custom_pages_user_id_slug_key and the editor reported "Failed to save
    // page" — with no slug field to change it in (US-116).
    const newPage = createNewPage(
      user.id,
      uniqueSlug(
        profile.username || 'my-page',
        pages.map((p) => p.slug)
      )
    );

    // Apply template if selected
    if (templateId) {
      const template = pageTemplates.find((t) => t.id === templateId);
      if (template) {
        newPage.blocks = applyTemplate(template, user.id, newPage.slug);
        toast.success(`Created page from "${template.name}" template!`);
      }
    }

    setPage(newPage);
    setShowTemplates(false);
    navigate('/dashboard/page-builder');
  };

  const handleEdit = (page: PageConfig) => {
    setPage(page);
    navigate('/dashboard/page-builder');
  };

  const handleSetActive = async (pageId: string) => {
    setActivating(pageId);
    try {
      await setAsActivePage(pageId);
      await loadPages(); // Reload to show updated active status
    } catch (error) {
      logger.error('Failed to set active page', error as Error);
    } finally {
      setActivating(null);
    }
  };

  const confirmDelete = async () => {
    const target = pendingDelete;
    if (!target || !user) return;
    setDeleting(true);
    try {
      // Scoped to the owner and asked to return the row: RLS answers a delete
      // it filters out with zero rows and no error, which used to read as
      // "Page deleted successfully" while the page stayed.
      const { data, error } = await supabase
        .from('custom_pages')
        .delete()
        .eq('id', target.id)
        .eq('user_id', user.id)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Page was not deleted');

      toast.success(
        isLivePage(target) ? 'Page deleted. Your public page no longer shows it.' : 'Page deleted'
      );
      setPendingDelete(null);
      await loadPages();
    } catch (error) {
      logger.error('Failed to delete page', error as Error);
      toast.error('Failed to delete page');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading pages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Pages</h2>
          <p className="text-muted-foreground">Create custom link-in-bio pages</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Page
        </Button>
      </div>

      {loadFailed ? (
        <Card className="p-12 text-center" role="alert">
          <div className="max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" aria-hidden="true" />
            <h3 className="text-lg font-semibold mb-2">Your pages could not be loaded</h3>
            <p className="text-muted-foreground mb-6">
              Nothing has changed on your public page. Check your connection and try again.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setLoading(true);
                void loadPages();
              }}
            >
              Try again
            </Button>
          </div>
        </Card>
      ) : pages.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No pages yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first custom page to get started
            </p>
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Page
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => {
            const isActive = page.isActive === true;
            const isLive = isLivePage(page);
            return (
              <Card key={page.id} className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg truncate">{page.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">/{page.slug}</p>
                    </div>
                    {isLive && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        Live on your page
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Badge variant={page.published ? 'default' : 'secondary'}>
                      {page.published ? 'Published' : 'Draft'}
                    </Badge>
                    <Badge variant="outline">{page.blocks.length} blocks</Badge>
                  </div>
                  {isActive && !page.published && (
                    <p className="text-sm text-muted-foreground">
                      This is your active page, but it is a draft, so your public page does not show
                      it. Publish it to put it live.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(page)}
                    className="gap-2 w-full"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>

                  {page.published && (
                    <>
                      <Button variant="outline" size="sm" asChild className="gap-2 w-full">
                        <a
                          href={`/${profile?.username ?? ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      </Button>

                      {!isActive && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSetActive(page.id)}
                          disabled={activating === page.id}
                          className="gap-2 w-full"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {activating === page.id ? 'Setting...' : 'Set as Active'}
                        </Button>
                      )}
                    </>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingDelete(page)}
                    className="gap-2 w-full text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>

                {page.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{page.description}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <DeletePageDialog
        page={pendingDelete}
        username={profile?.username ?? null}
        otherPublishedTitle={
          pages.find((p) => p.id !== pendingDelete?.id && p.published)?.title ?? null
        }
        deleting={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => void confirmDelete()}
      />

      {/* Template Selector Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>
              Start with a pre-built template or create a blank page
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {/* Blank Page Option */}
            <Card
              className="p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleSelectTemplate(null)}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gray-100 rounded">
                    <Plus className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Blank Page</h3>
                    <p className="text-sm text-muted-foreground">Start from scratch</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground flex-1">
                  Create a completely custom page by adding blocks one at a time.
                </p>
              </div>
            </Card>

            {/* Template Options */}
            {pageTemplates.map((template) => (
              <Card
                key={template.id}
                className="p-6 cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelectTemplate(template.id)}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge variant="outline" className="mt-1">
                        {template.blocks.length} blocks
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">{template.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
