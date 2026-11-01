import { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  Globe,
  LayoutGrid,
  List,
  Star,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
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
import { parseSquareFeet } from '@/lib/format';
import { logger } from '@/lib/logger';
import { CLOSED_LISTING_STATUSES, LISTING_STATUSES } from '@/lib/listingStatus';
import { todayCalendarDate } from '@/lib/localDate';
import { buildImportedListing } from '@/lib/listingImport';
import { reorderWithinView, sortOrderChanges } from '@/lib/listingOrder';
import { AddListingModal } from '@/components/modals/AddListingModal';
import { EditListingModal, EditListingFormData } from '@/components/modals/EditListingModal';
import type { ListingFormData } from '@/components/modals/AddListingModal';
import { CSVUploadDialog } from '@/components/listings/CSVUploadDialog';
import { URLImportDialog } from '@/components/listings/URLImportDialog';
import { useToast } from '@/hooks/use-toast';
import { useListings, type Listing, type NewListing } from '@/hooks/useListings';
import type { ImportedListingData } from '@/components/listings/URLImportDialog';
import type { SharedListing } from '@/components/listings/SocialShareDialog';
import { useListingImageUpload } from '@/hooks/useListingImageUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { UpgradeModal } from '@/components/UpgradeModal';
import { PlanLimitNotice } from '@/components/PlanLimitNotice';
import { SocialShareDialog } from '@/components/listings/SocialShareDialog';
import { useProfile } from '@/hooks/useProfile';
import { KeyboardShortcutsHelper } from '@/components/dashboard/KeyboardShortcutsHelper';
import { QuickStatusUpdate } from '@/components/dashboard/QuickStatusUpdate';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { parsePrice, formatPrice } from '@/lib/format';
import { fallBackToOriginal, getImageUrl } from '@/lib/images';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | (typeof LISTING_STATUSES)[number]['value'];

export default function Listings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState(false);
  const [isURLDialogOpen, setIsURLDialogOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSocialShareDialog, setShowSocialShareDialog] = useState(false);
  const [newlyCreatedListing, setNewlyCreatedListing] = useState<SharedListing | null>(null);
  const [listingToDelete, setListingToDelete] = useState<{ id: string; address: string } | null>(
    null
  );
  const { toast } = useToast();
  const {
    listings,
    isLoading,
    isError,
    error,
    refetch,
    addListing,
    updateListing,
    deleteListing,
    reorderListings,
  } = useListings();
  const { uploadListingImages } = useListingImageUpload();
  const { subscription, canAdd } = useSubscriptionLimits();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const shortcuts = [
    {
      key: 'n',
      description: 'Add new listing',
      action: () => handleAddClick(),
      category: 'Actions',
    },
    {
      key: 'd',
      description: 'Go to Dashboard',
      action: () => navigate('/dashboard'),
      category: 'Navigation',
    },
    {
      key: 'l',
      description: 'Go to Leads',
      action: () => navigate('/dashboard/leads'),
      category: 'Navigation',
    },
    {
      key: 'a',
      description: 'Go to Analytics',
      action: () => navigate('/dashboard/analytics'),
      category: 'Navigation',
    },
  ];

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      !searchQuery ||
      listing.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: listings.length,
    active: listings.filter((l) => l.status === 'active').length,
    pending: listings.filter((l) => l.status === 'pending').length,
    sold: listings.filter((l) => l.status === 'sold').length,
    underContract: listings.filter((l) => l.status === 'under_contract').length,
    totalValue: listings.reduce((sum, l) => sum + parsePrice(l.price), 0),
  };

  const handleAddClick = () => {
    const allowed = canAdd('listings');
    if (!allowed) {
      setShowUpgradeModal(true);
      toast({
        title: 'Upgrade required',
        description: 'Your plan limit has been reached for listings.',
      });
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleAddListing = async (data: ListingFormData) => {
    try {
      // uploadListingImages throws now, so a failure lands in the catch below
      // and is rethrown — the modal stays open with the form intact. This used
      // to be `if (imageUrls.length === 0) return;`, a normal return that the
      // modal treated as success: it closed and reset, so a 6 MB photo against
      // a 5 MB limit made the agent re-enter the whole six-step listing
      // (US-107).
      let imageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        imageUrls = await uploadListingImages(data.images);
      }

      const listingData: NewListing = {
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        price: data.price,
        // Canonical columns only. beds/baths/sqft are GENERATED from these
        // since 20260902000007 — writing them now raises rather than silently
        // diverging, which is the bug this fixes: create wrote both pairs while
        // edit wrote only the integers, and the public read's `bedrooms ?? beds`
        // then showed the stale value (US-106).
        bedrooms: data.beds,
        bathrooms: data.baths,
        square_feet: parseSquareFeet(data.sqft),
        status: data.status,
        // Nothing wrote either date. listed_date is what "days on market"
        // counts from, and sold_date is set on the transition below (US-107).
        listed_date: todayCalendarDate(),
        image: imageUrls[0] || null,
        photos: imageUrls.length > 0 ? imageUrls : null,
        description: data.description || null,
        mls_number: data.mlsNumber || null,
        property_type: data.propertyType || null,
        lot_size_acres: data.lotSize ? parseFloat(data.lotSize) : null,
        virtual_tour_url: data.virtualTourUrl || null,
        is_featured: data.isFeatured || false,
        year_built: data.yearBuilt ? Number(data.yearBuilt) : null,
        stories: data.stories ? Number(data.stories) : null,
        garage_spaces: data.garage ? Number(data.garage) : null,
        // Collected by the form's "Property Highlights" textarea and rendered by
        // ListingDetailModal, but never persisted until US-056 added the column.
        highlights: data.highlights
          ? data.highlights
              .split(',')
              .map((h) => h.trim())
              .filter(Boolean)
          : null,
      };

      await addListing.mutateAsync(listingData);

      setNewlyCreatedListing({
        address: data.address,
        city: data.city,
        price: data.price,
        beds: data.beds,
        baths: data.baths,
        sqft: parseSquareFeet(data.sqft) ?? undefined,
        property_type: data.propertyType,
        image: imageUrls[0] || undefined,
      });

      toast({
        title: 'Listing added!',
        description: 'Your property listing has been created successfully.',
      });
      setIsAddModalOpen(false);
      setShowSocialShareDialog(true);
    } catch (error) {
      // Rethrown, not swallowed. The modal's own submit handler keeps the
      // dialog open and the fields populated when this rejects; swallowing it
      // here is what let the form close on a failed upload and threw away six
      // steps of typing (US-107). The specific reason has already been toasted
      // by the upload hook, so this only reports what it can add.
      toast({
        title: 'Error',
        description:
          error instanceof Error && error.message
            ? error.message
            : 'Failed to add listing. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleCSVImport = async (importedListings: Record<string, unknown>[]) => {
    let successCount = 0;
    let failCount = 0;
    for (const listing of importedListings) {
      try {
        await addListing.mutateAsync({
          address: listing.address as string,
          city: listing.city as string,
          state: listing.state as string,
          zip_code: listing.zip_code as string,
          price: String(listing.price),
          bedrooms: listing.bedrooms as number,
          bathrooms: listing.bathrooms as number,
          square_feet: listing.square_feet as number,
          status: listing.status as string,
          description: listing.description as string,
          mls_number: listing.mls_number as string,
          property_type: listing.property_type as string,
          lot_size_acres: listing.lot_size_acres as number,
          is_featured: listing.is_featured as boolean,
          virtual_tour_url: listing.virtual_tour_url as string,
          // The template has advertised year_built all along (US-106).
          year_built: (listing.year_built as number | null) ?? null,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }
    toast({
      title: 'Import complete',
      description:
        failCount > 0
          ? `Imported ${successCount} of ${importedListings.length} listings. ${failCount} failed.`
          : `Successfully imported ${successCount} of ${importedListings.length} listings.`,
      variant: failCount > 0 ? 'destructive' : 'default',
    });
  };

  /**
   * Save a reviewed import. Rejects on failure so the dialog stays open with
   * the agent's text and shows why (US-253); the payload is built by
   * buildImportedListing, which writes no generated column.
   */
  const handleURLImport = async (importedListing: ImportedListingData) => {
    try {
      await addListing.mutateAsync(buildImportedListing(importedListing, todayCalendarDate()));
    } catch (error) {
      logger.error('Failed to import listing', error as Error);
      throw error;
    }
    toast({
      title: 'Listing imported!',
      description: 'Property has been added to your listings.',
    });
  };

  const handleDeleteListing = async () => {
    if (!listingToDelete) return;
    try {
      await deleteListing.mutateAsync(listingToDelete.id);
      toast({ title: 'Listing deleted', description: 'Property listing has been removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete listing.', variant: 'destructive' });
    } finally {
      setListingToDelete(null);
    }
  };

  /**
   * Move one listing to another's place (a drop, or the Move buttons).
   *
   * Positions are computed over the full listing list, not the filtered one:
   * numbering only the visible cards 0..n gave them the positions hidden
   * listings already held, and the public page interleaved them (US-253).
   * Only rows whose sort_order changes are written, through one mutation that
   * updates the cache optimistically and rolls back on failure.
   */
  const moveListing = async (movedId: string, targetId: string) => {
    const ordered = reorderWithinView(
      listings,
      filteredListings.map((l) => l.id),
      movedId,
      targetId
    );
    if (!ordered) return;
    const changes = sortOrderChanges(ordered);
    if (changes.length === 0) return;
    try {
      await reorderListings.mutateAsync(changes);
    } catch (error) {
      logger.error('Failed to save the listing order', error as Error);
      toast({
        title: 'Error',
        description: 'Could not save the new order. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDropOn = async (targetId: string) => {
    if (!draggingId) return;
    const draggedId = draggingId;
    setDraggingId(null);
    await moveListing(draggedId, targetId);
  };

  /**
   * Move a listing one place earlier (-1) or later (+1) in the visible order.
   * Drag was the only way to reorder, which a keyboard or touch user cannot
   * do (US-257); this goes through the same full-list reorder as a drop.
   */
  const handleMove = async (id: string, delta: -1 | 1) => {
    const from = filteredListings.findIndex((l) => l.id === id);
    const neighbour = filteredListings[from + delta];
    if (from === -1 || !neighbour) return;
    await moveListing(id, neighbour.id);
  };

  const handleEditListing = async (data: EditListingFormData) => {
    if (!editingListing) return;
    try {
      await updateListing.mutateAsync({
        id: editingListing.id,
        address: data.address,
        city: data.city,
        price: data.price,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        square_feet: data.square_feet ?? null,
        status: data.status,
        // Moving a listing to sold records the date; moving it back out clears
        // it. Nothing wrote sold_date at all, so a sold listing had no close
        // date and days_on_market could never be computed (US-107).
        sold_date: CLOSED_LISTING_STATUSES.has(data.status)
          ? (editingListing.sold_date ?? todayCalendarDate())
          : null,
        // `photos` is the gallery and `image` is the card thumbnail; they must
        // agree, so the cover is always photos[0] (US-107).
        photos: data.photos,
        image: data.photos[0] ?? null,
        description: data.description,
        mls_number: data.mls_number,
        property_type: data.property_type,
        state: data.state || null,
        zip_code: data.zip_code || null,
        lot_size_acres: data.lot_size_acres ?? null,
        virtual_tour_url: data.virtual_tour_url || null,
        is_featured: data.is_featured ?? false,
        highlights: data.highlights
          ? data.highlights
              .split(',')
              .map((h) => h.trim())
              .filter(Boolean)
          : null,
        updated_at: new Date().toISOString(),
      });
      toast({
        title: 'Listing updated!',
        description: 'Your property listing has been updated successfully.',
      });
      setEditingListing(null);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update listing. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // From the shared list, so a status added there appears here rather than
  // becoming a state no filter can reach (US-107).
  const statusFilterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    ...LISTING_STATUSES.map((s) => ({ value: s.value as StatusFilter, label: s.label })),
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Property Listings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
            Manage your active and sold properties
          </p>
        </div>

        {/* Add Button with Dropdown */}
        <div className="relative w-full sm:w-auto">
          <div className="flex gap-1 w-full sm:w-auto">
            <button
              onClick={handleAddClick}
              className="flex-1 sm:flex-none inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-l-lg hover:bg-primary/90 active:scale-[0.98] transition-all font-medium min-h-[44px] justify-center shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Property</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddMenu(!showAddMenu)}
              aria-label="More ways to add a property"
              aria-haspopup="true"
              aria-expanded={showAddMenu}
              className="inline-flex items-center px-2.5 py-2.5 bg-primary text-primary-foreground rounded-r-lg hover:bg-primary/90 active:scale-[0.98] transition-all min-h-[44px] shadow-sm border-l border-primary-foreground/20"
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
              <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-xl z-50 w-64 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => {
                    setShowAddMenu(false);
                    handleAddClick();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-sm transition-colors"
                >
                  <Plus className="h-4 w-4 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">Add Manually</div>
                    <div className="text-xs text-muted-foreground">
                      Enter listing details step by step
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowAddMenu(false);
                    setIsCSVDialogOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-sm transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Bulk Import (CSV)</div>
                    <div className="text-xs text-muted-foreground">
                      Upload multiple listings at once
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowAddMenu(false);
                    setIsURLDialogOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-sm transition-colors"
                >
                  <Globe className="h-4 w-4 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Import from Zillow / Paste</div>
                    <div className="text-xs text-muted-foreground">
                      Paste a listing copied from Zillow, Realtor.com, etc.
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Limit Banner */}
      <PlanLimitNotice limitKey="listings" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <div
          className="bg-card border border-border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setStatusFilter('all')}
        >
          <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total</div>
        </div>
        <div
          className={cn(
            'bg-card border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer',
            statusFilter === 'active'
              ? 'border-green-400 bg-green-50/50 dark:bg-green-950/20'
              : 'border-border'
          )}
          onClick={() => setStatusFilter('active')}
        >
          <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Active</div>
        </div>
        <div
          className={cn(
            'bg-card border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer',
            statusFilter === 'pending'
              ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20'
              : 'border-border'
          )}
          onClick={() => setStatusFilter('pending')}
        >
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Pending</div>
        </div>
        <div
          className={cn(
            'bg-card border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer',
            statusFilter === 'under_contract'
              ? 'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20'
              : 'border-border'
          )}
          onClick={() => setStatusFilter('under_contract')}
        >
          <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.underContract}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Under Contract</div>
        </div>
        <div
          className={cn(
            'bg-card border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer',
            statusFilter === 'sold'
              ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-border'
          )}
          onClick={() => setStatusFilter('sold')}
        >
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.sold}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Sold</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-lg sm:text-xl font-bold text-foreground truncate">
            {formatPrice(stats.totalValue)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Total Value</div>
        </div>
      </div>

      {/* Search & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            aria-label="Search listings"
            placeholder="Search by address, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm min-h-[44px]"
          />
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            className={cn(
              'p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors',
              viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            )}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            className={cn(
              'p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors',
              viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            )}
          >
            <List className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {statusFilterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
              statusFilter === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:border-primary/50 text-foreground'
            )}
          >
            {opt.label}
            {opt.value !== 'all' && (
              <span className="ml-1 opacity-75">
                ({listings.filter((l) => l.status === opt.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error State */}
      {isError && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mb-3">
              <AlertCircle className="h-7 w-7 text-red-600" />
            </div>
            <h3 className="text-base font-semibold mb-1">Failed to load listings</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'An unexpected error occurred.'}
            </p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading — without this a slow load read as "No properties yet"
          appearing and then vanishing (US-257). */}
      {!isError && isLoading && (
        <div
          role="status"
          aria-label="Loading listings"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
              <Skeleton className="h-48 sm:h-52 w-full rounded-none bg-muted" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-6 w-28 bg-muted" />
                <Skeleton className="h-4 w-full bg-muted" />
                <Skeleton className="h-3 w-1/2 bg-muted" />
              </div>
            </div>
          ))}
          <span className="sr-only">Loading listings…</span>
        </div>
      )}

      {/* Grid View */}
      {!isError && viewMode === 'grid' && filteredListings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredListings.map((listing, index) => (
            <div
              key={listing.id}
              // Native HTML5 drag, matching PageBuilder — no new dependency.
              // Dropping one card onto another rewrites sort_order for the
              // whole list, which the public gallery then follows (US-107).
              draggable
              onDragStart={() => setDraggingId(listing.id)}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => void handleDropOn(listing.id)}
              className={cn(
                'bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group',
                draggingId === listing.id && 'opacity-50 ring-2 ring-primary'
              )}
            >
              <div className="relative h-48 sm:h-52 overflow-hidden">
                <img
                  src={getImageUrl(listing.image || listing.photos?.[0], { width: 400 })}
                  alt={listing.address}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                  onError={(e) =>
                    fallBackToOriginal(
                      e.currentTarget,
                      getImageUrl(listing.image || listing.photos?.[0])
                    )
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 left-2">
                  <QuickStatusUpdate
                    listingId={listing.id}
                    currentStatus={listing.status}
                    onStatusChange={() => {
                      refetch();
                    }}
                  />
                </div>
                {listing.is_featured && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-purple-600 text-white rounded-full text-[10px] font-semibold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" /> Featured
                    </span>
                  </div>
                )}
                {/* Hover-only made these invisible on touch screens (no hover)
                    and to a keyboard user tabbing onto them (US-257). */}
                <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                  <button
                    type="button"
                    onClick={() => setEditingListing(listing)}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/90 text-gray-900 shadow-md backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    title="Edit"
                    aria-label={`Edit ${listing.address}`}
                  >
                    <Edit className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingToDelete({ id: listing.id, address: listing.address })}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/90 text-red-600 shadow-md backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    title="Delete"
                    aria-label={`Delete ${listing.address}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-2">
                  <div className="text-xl font-bold text-primary mb-0.5">
                    {formatPrice(parsePrice(listing.price))}
                  </div>
                  <div className="font-medium text-sm text-foreground truncate">
                    {listing.address}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {listing.city}
                    {listing.state ? `, ${listing.state}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span>{listing.beds || listing.bedrooms || 0} beds</span>
                  <span className="text-border">|</span>
                  <span>{listing.baths || listing.bathrooms || 0} baths</span>
                  {(listing.sqft || listing.square_feet) && (
                    <>
                      <span className="text-border">|</span>
                      <span>
                        {(listing.sqft || listing.square_feet || 0).toLocaleString()} sqft
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                  <div className="min-w-0 text-xs text-muted-foreground">
                    <div>
                      Listed{' '}
                      {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : '—'}
                    </div>
                    {listing.mls_number && (
                      <div className="truncate">MLS# {listing.mls_number}</div>
                    )}
                  </div>
                  {/* Reorder without drag, for keyboard and touch (US-257). */}
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => void handleMove(listing.id, -1)}
                      disabled={index === 0}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                      title="Move earlier"
                      aria-label={`Move ${listing.address} earlier`}
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleMove(listing.id, 1)}
                      disabled={index === filteredListings.length - 1}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                      title="Move later"
                      aria-label={`Move ${listing.address} later`}
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!isError && viewMode === 'list' && filteredListings.length > 0 && (
        // overflow-x-auto, not hidden: at 360px a wide row scrolls inside its
        // own box rather than clipping the edit/delete buttons (US-246).
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Property
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Price
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">
                  Beds
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">
                  Baths
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">
                  Sqft
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={getImageUrl(listing.image || listing.photos?.[0], { width: 200 })}
                        alt={listing.address}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        loading="lazy"
                        decoding="async"
                        onError={(e) =>
                          fallBackToOriginal(
                            e.currentTarget,
                            getImageUrl(listing.image || listing.photos?.[0])
                          )
                        }
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{listing.address}</div>
                        <div className="text-xs text-muted-foreground">
                          {listing.city}
                          {listing.state ? `, ${listing.state}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <QuickStatusUpdate
                      listingId={listing.id}
                      currentStatus={listing.status}
                      onStatusChange={() => {
                        refetch();
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-sm">
                    {formatPrice(parsePrice(listing.price))}
                  </td>
                  <td className="px-4 py-3 text-center text-sm hidden sm:table-cell">
                    {listing.beds || listing.bedrooms || '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm hidden sm:table-cell">
                    {listing.baths || listing.bathrooms || '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm hidden lg:table-cell">
                    {(listing.sqft ?? listing.square_feet)?.toLocaleString() ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingListing(listing)}
                        className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-accent rounded-lg transition-colors"
                        title="Edit"
                        aria-label={`Edit ${listing.address}`}
                      >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() =>
                          setListingToDelete({ id: listing.id, address: listing.address })
                        }
                        className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-accent rounded-lg transition-colors text-red-600"
                        title="Delete"
                        aria-label={`Delete ${listing.address}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No results */}
      {!isError && filteredListings.length === 0 && listings.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No listings match your filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="text-primary text-sm mt-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isError && listings.length === 0 && !isLoading && (
        <div className="text-center py-12 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No properties yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Add your first property listing manually, import from a CSV file, or paste listing
            details from any real estate website.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleAddClick}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-md min-h-[44px]"
            >
              <Plus className="h-5 w-5" /> Add Manually
            </button>
            <button
              onClick={() => setIsCSVDialogOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-lg hover:bg-accent transition-all font-medium min-h-[44px]"
            >
              <FileSpreadsheet className="h-5 w-5 text-green-600" /> Import CSV
            </button>
            <button
              onClick={() => setIsURLDialogOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-lg hover:bg-accent transition-all font-medium min-h-[44px]"
            >
              <Globe className="h-5 w-5 text-blue-600" /> Import from Zillow
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddListingModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSave={handleAddListing}
      />
      <CSVUploadDialog
        open={isCSVDialogOpen}
        onOpenChange={setIsCSVDialogOpen}
        onImport={handleCSVImport}
      />
      <URLImportDialog
        open={isURLDialogOpen}
        onOpenChange={setIsURLDialogOpen}
        onImport={handleURLImport}
      />

      {editingListing && (
        <EditListingModal
          // Keyed so a different listing mounts a fresh form; the modal no
          // longer resets its state from initialData (US-257).
          key={editingListing.id}
          isOpen={!!editingListing}
          onClose={() => setEditingListing(null)}
          onSubmit={handleEditListing}
          listingId={editingListing.id}
          initialData={{
            address: editingListing.address,
            city: editingListing.city,
            price: editingListing.price,
            bedrooms: editingListing.bedrooms,
            bathrooms: editingListing.bathrooms,
            square_feet: editingListing.square_feet ?? undefined,
            status: editingListing.status ?? 'active',
            photos: Array.isArray(editingListing.photos)
              ? (editingListing.photos as string[])
              : editingListing.image
                ? [editingListing.image]
                : [],
            state: editingListing.state ?? undefined,
            zip_code: editingListing.zip_code ?? undefined,
            lot_size_acres: editingListing.lot_size_acres ?? undefined,
            virtual_tour_url: editingListing.virtual_tour_url ?? undefined,
            highlights: Array.isArray(editingListing.highlights)
              ? (editingListing.highlights as string[]).join(', ')
              : undefined,
            is_featured: editingListing.is_featured ?? false,
            description: editingListing.description ?? undefined,
            mls_number: editingListing.mls_number ?? undefined,
            property_type: editingListing.property_type ?? undefined,
          }}
        />
      )}

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="listings"
        currentPlan={subscription?.plan_name || 'Free'}
        requiredPlan="Starter"
      />

      {newlyCreatedListing && (
        <SocialShareDialog
          open={showSocialShareDialog}
          onOpenChange={setShowSocialShareDialog}
          listing={newlyCreatedListing}
          agentName={profile?.full_name ?? undefined}
        />
      )}

      <AlertDialog
        open={!!listingToDelete}
        onOpenChange={(open) => !open && setListingToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" /> Delete Listing
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{listingToDelete?.address}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteListing}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <KeyboardShortcutsHelper shortcuts={shortcuts} />
    </div>
  );
}
