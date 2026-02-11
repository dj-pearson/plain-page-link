import { useState } from "react";
import { Plus, Search, Edit, Trash2, AlertTriangle, AlertCircle, RefreshCw, FileSpreadsheet, Globe, LayoutGrid, List, Star, ChevronDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddListingModal } from "@/components/modals/AddListingModal";
import { EditListingModal, EditListingFormData } from "@/components/modals/EditListingModal";
import type { ListingFormData } from "@/components/modals/AddListingModal";
import { CSVUploadDialog } from "@/components/listings/CSVUploadDialog";
import { URLImportDialog } from "@/components/listings/URLImportDialog";
import { useToast } from "@/hooks/use-toast";
import { useListings, type Listing } from "@/hooks/useListings";
import { useListingImageUpload } from "@/hooks/useListingImageUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradeModal } from "@/components/UpgradeModal";
import { LimitBanner } from "@/components/LimitBanner";
import { SocialShareDialog } from "@/components/listings/SocialShareDialog";
import { useProfile } from "@/hooks/useProfile";
import { KeyboardShortcutsHelper } from "@/components/dashboard/KeyboardShortcutsHelper";
import { QuickStatusUpdate } from "@/components/dashboard/QuickStatusUpdate";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { parsePrice, formatPrice } from "@/lib/format";
import { getImageUrl } from "@/lib/images";

interface SocialShareListingData {
  address: string;
  city: string;
  price: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  property_type?: string;
  image?: string;
}

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "active" | "pending" | "under_contract" | "sold" | "draft";

export default function Listings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState(false);
  const [isURLDialogOpen, setIsURLDialogOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSocialShareDialog, setShowSocialShareDialog] = useState(false);
  const [newlyCreatedListing, setNewlyCreatedListing] = useState<SocialShareListingData | null>(null);
  const [listingToDelete, setListingToDelete] = useState<{ id: string; address: string } | null>(null);
  const { toast } = useToast();
  const { listings, isLoading, isError, error, refetch, addListing, updateListing, deleteListing } = useListings();
  const { uploadListingImages } = useListingImageUpload();
  const { subscription, canAdd, getLimit, getUsage } = useSubscriptionLimits();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const shortcuts = [
    { key: "n", description: "Add new listing", action: () => handleAddClick(), category: "Actions" },
    { key: "d", description: "Go to Dashboard", action: () => navigate("/dashboard"), category: "Navigation" },
    { key: "l", description: "Go to Leads", action: () => navigate("/dashboard/leads"), category: "Navigation" },
    { key: "a", description: "Go to Analytics", action: () => navigate("/dashboard/analytics"), category: "Navigation" },
  ];

  const filteredListings = listings.filter(listing => {
    const matchesSearch = !searchQuery ||
      listing.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === "active").length,
    pending: listings.filter(l => l.status === "pending").length,
    sold: listings.filter(l => l.status === "sold").length,
    underContract: listings.filter(l => l.status === "under_contract").length,
    totalValue: listings.reduce((sum, l) => sum + parsePrice(l.price), 0),
  };

  const handleAddClick = () => {
    const allowed = canAdd('listings');
    if (!allowed) {
      setShowUpgradeModal(true);
      toast({ title: "Upgrade required", description: "Your plan limit has been reached for listings." });
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleAddListing = async (data: ListingFormData) => {
    try {
      let imageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        imageUrls = await uploadListingImages(data.images);
        if (imageUrls.length === 0) return;
      }

      const listingData: Record<string, unknown> = {
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        price: data.price,
        beds: data.beds,
        baths: data.baths,
        bedrooms: data.beds,
        bathrooms: data.baths,
        sqft: parseInt(data.sqft) || null,
        square_feet: parseInt(data.sqft) || null,
        status: data.status,
        image: imageUrls[0] || null,
        photos: imageUrls.length > 0 ? imageUrls : null,
        description: data.description || null,
        mls_number: data.mlsNumber || null,
        property_type: data.propertyType || null,
        lot_size_acres: data.lotSize ? parseFloat(data.lotSize) : null,
        virtual_tour_url: data.virtualTourUrl || null,
        is_featured: data.isFeatured || false,
      };

      if (data.openHouseDate) listingData.open_house_date = data.openHouseDate;

      await addListing.mutateAsync(listingData as any);

      setNewlyCreatedListing({
        address: data.address, city: data.city, price: data.price,
        beds: data.beds, baths: data.baths, sqft: parseInt(data.sqft) || undefined,
        property_type: data.propertyType, image: imageUrls[0] || undefined,
      });

      toast({ title: "Listing added!", description: "Your property listing has been created successfully." });
      setIsAddModalOpen(false);
      setShowSocialShareDialog(true);
    } catch {
      toast({ title: "Error", description: "Failed to add listing. Please try again.", variant: "destructive" });
    }
  };

  const handleCSVImport = async (importedListings: any[]) => {
    let successCount = 0;
    for (const listing of importedListings) {
      try {
        await addListing.mutateAsync({
          address: listing.address, city: listing.city, state: listing.state,
          zip_code: listing.zip_code, price: String(listing.price),
          beds: listing.bedrooms, baths: listing.bathrooms,
          bedrooms: listing.bedrooms, bathrooms: listing.bathrooms,
          sqft: listing.square_feet, square_feet: listing.square_feet,
          status: listing.status, description: listing.description,
          mls_number: listing.mls_number, property_type: listing.property_type,
          lot_size_acres: listing.lot_size_acres, is_featured: listing.is_featured,
          virtual_tour_url: listing.virtual_tour_url,
        } as any);
        successCount++;
      } catch {
        // Continue with remaining listings
      }
    }
    toast({
      title: "Import complete",
      description: `Successfully imported ${successCount} of ${importedListings.length} listings.`,
    });
  };

  const handleURLImport = (importedListing: any) => {
    addListing.mutateAsync({
      address: importedListing.address, city: importedListing.city,
      state: importedListing.state, zip_code: importedListing.zip_code,
      price: importedListing.price,
      beds: importedListing.bedrooms, baths: importedListing.bathrooms,
      bedrooms: importedListing.bedrooms, bathrooms: importedListing.bathrooms,
      sqft: importedListing.square_feet, square_feet: importedListing.square_feet,
      status: importedListing.status || "active",
      description: importedListing.description, mls_number: importedListing.mls_number,
      property_type: importedListing.property_type, lot_size_acres: importedListing.lot_size_acres,
    } as any).then(() => {
      toast({ title: "Listing imported!", description: "Property has been added to your listings." });
    }).catch(() => {
      toast({ title: "Error", description: "Failed to import listing.", variant: "destructive" });
    });
  };

  const handleDeleteListing = async () => {
    if (!listingToDelete) return;
    try {
      await deleteListing.mutateAsync(listingToDelete.id);
      toast({ title: "Listing deleted", description: "Property listing has been removed." });
    } catch {
      toast({ title: "Error", description: "Failed to delete listing.", variant: "destructive" });
    } finally {
      setListingToDelete(null);
    }
  };

  const handleEditListing = async (data: EditListingFormData) => {
    if (!editingListing) return;
    try {
      await updateListing.mutateAsync({
        id: editingListing.id, address: data.address, city: data.city,
        price: data.price, beds: data.beds, baths: data.baths, sqft: data.sqft,
        status: data.status, image: data.image, description: data.description,
        mls_number: data.mls_number, property_type: data.property_type,
        updated_at: new Date().toISOString(),
      });
      toast({ title: "Listing updated!", description: "Your property listing has been updated successfully." });
      setEditingListing(null);
    } catch {
      toast({ title: "Error", description: "Failed to update listing. Please try again.", variant: "destructive" });
    }
  };

  const statusFilterOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "under_contract", label: "Under Contract" },
    { value: "sold", label: "Sold" },
    { value: "draft", label: "Draft" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Property Listings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">Manage your active and sold properties</p>
        </div>

        {/* Add Button with Dropdown */}
        <div className="relative w-full sm:w-auto">
          <div className="flex gap-1 w-full sm:w-auto">
            <button onClick={handleAddClick}
              className="flex-1 sm:flex-none inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-l-lg hover:bg-primary/90 active:scale-[0.98] transition-all font-medium min-h-[44px] justify-center shadow-sm">
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Property</span>
            </button>
            <button onClick={() => setShowAddMenu(!showAddMenu)}
              className="inline-flex items-center px-2.5 py-2.5 bg-primary text-primary-foreground rounded-r-lg hover:bg-primary/90 active:scale-[0.98] transition-all min-h-[44px] shadow-sm border-l border-primary-foreground/20">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
              <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-xl z-50 w-64 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button onClick={() => { setShowAddMenu(false); handleAddClick(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-sm transition-colors">
                  <Plus className="h-4 w-4 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">Add Manually</div>
                    <div className="text-xs text-muted-foreground">Enter listing details step by step</div>
                  </div>
                </button>
                <button onClick={() => { setShowAddMenu(false); setIsCSVDialogOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-sm transition-colors">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Bulk Import (CSV)</div>
                    <div className="text-xs text-muted-foreground">Upload multiple listings at once</div>
                  </div>
                </button>
                <button onClick={() => { setShowAddMenu(false); setIsURLDialogOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-sm transition-colors">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Import from URL / Paste</div>
                    <div className="text-xs text-muted-foreground">Copy from Zillow, Realtor.com, etc.</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Limit Banner */}
      {subscription && getLimit('listings') !== Infinity && (
        <LimitBanner feature="listings" current={getUsage('listings')} limit={getLimit('listings')} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <div className="bg-card border border-border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter("all")}>
          <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total</div>
        </div>
        <div className={cn("bg-card border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer", statusFilter === "active" ? "border-green-400 bg-green-50/50 dark:bg-green-950/20" : "border-border")} onClick={() => setStatusFilter("active")}>
          <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Active</div>
        </div>
        <div className={cn("bg-card border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer", statusFilter === "pending" ? "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20" : "border-border")} onClick={() => setStatusFilter("pending")}>
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Pending</div>
        </div>
        <div className={cn("bg-card border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer", statusFilter === "under_contract" ? "border-orange-400 bg-orange-50/50 dark:bg-orange-950/20" : "border-border")} onClick={() => setStatusFilter("under_contract")}>
          <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.underContract}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Under Contract</div>
        </div>
        <div className={cn("bg-card border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer", statusFilter === "sold" ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20" : "border-border")} onClick={() => setStatusFilter("sold")}>
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.sold}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Sold</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-lg sm:text-xl font-bold text-foreground truncate">{formatPrice(stats.totalValue)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total Value</div>
        </div>
      </div>

      {/* Search & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search by address, city..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm min-h-[44px]" />
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button onClick={() => setViewMode("grid")}
            className={cn("p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors",
              viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode("list")}
            className={cn("p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors",
              viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {statusFilterOptions.map(opt => (
          <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
              statusFilter === opt.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50 text-foreground")}>
            {opt.label}
            {opt.value !== "all" && <span className="ml-1 opacity-75">({listings.filter(l => l.status === opt.value).length})</span>}
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
            <p className="text-sm text-muted-foreground mb-4">{error instanceof Error ? error.message : "An unexpected error occurred."}</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" /> Try Again</Button>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {!isError && viewMode === "grid" && filteredListings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <div className="relative h-48 sm:h-52 overflow-hidden">
                <img src={getImageUrl((listing as any).image || (listing as any).photos?.[0], 'listings')} alt={listing.address}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"
                  onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 left-2">
                  <QuickStatusUpdate listingId={listing.id} currentStatus={listing.status} onStatusChange={(s) => { listing.status = s; }} />
                </div>
                {(listing as any).is_featured && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-purple-600 text-white rounded-full text-[10px] font-semibold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" /> Featured
                    </span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingListing(listing)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-all shadow-md" title="Edit">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setListingToDelete({ id: listing.id, address: listing.address })}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-all text-red-600 shadow-md" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-2">
                  <div className="text-xl font-bold text-primary mb-0.5">{formatPrice(parsePrice(listing.price))}</div>
                  <div className="font-medium text-sm text-foreground truncate">{listing.address}</div>
                  <div className="text-xs text-muted-foreground">{listing.city}{(listing as any).state ? `, ${(listing as any).state}` : ''}</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span>{listing.beds || (listing as any).bedrooms || 0} beds</span>
                  <span className="text-border">|</span>
                  <span>{listing.baths || (listing as any).bathrooms || 0} baths</span>
                  {(listing.sqft || (listing as any).square_feet) && (
                    <><span className="text-border">|</span><span>{(listing.sqft || (listing as any).square_feet || 0).toLocaleString()} sqft</span></>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground">Listed {new Date(listing.created_at).toLocaleDateString()}</div>
                  {(listing as any).mls_number && <div className="text-xs text-muted-foreground">MLS# {(listing as any).mls_number}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!isError && viewMode === "list" && filteredListings.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">Beds</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">Baths</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">Sqft</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={getImageUrl((listing as any).image || (listing as any).photos?.[0], 'listings')} alt={listing.address}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg'; }} />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{listing.address}</div>
                        <div className="text-xs text-muted-foreground">{listing.city}{(listing as any).state ? `, ${(listing as any).state}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <QuickStatusUpdate listingId={listing.id} currentStatus={listing.status} onStatusChange={(s) => { listing.status = s; }} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-sm">{formatPrice(parsePrice(listing.price))}</td>
                  <td className="px-4 py-3 text-center text-sm hidden sm:table-cell">{listing.beds || (listing as any).bedrooms || '-'}</td>
                  <td className="px-4 py-3 text-center text-sm hidden sm:table-cell">{listing.baths || (listing as any).bathrooms || '-'}</td>
                  <td className="px-4 py-3 text-right text-sm hidden lg:table-cell">
                    {(listing.sqft || (listing as any).square_feet) ? (listing.sqft || (listing as any).square_feet).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditingListing(listing)} className="p-2 hover:bg-accent rounded-lg transition-colors" title="Edit">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setListingToDelete({ id: listing.id, address: listing.address })}
                        className="p-2 hover:bg-accent rounded-lg transition-colors text-red-600" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
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
          <button onClick={() => { setSearchQuery(""); setStatusFilter("all"); }} className="text-primary text-sm mt-2 hover:underline">Clear filters</button>
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
            Add your first property listing manually, import from a CSV file, or paste listing details from any real estate website.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleAddClick}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-md min-h-[44px]">
              <Plus className="h-5 w-5" /> Add Manually
            </button>
            <button onClick={() => setIsCSVDialogOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-lg hover:bg-accent transition-all font-medium min-h-[44px]">
              <FileSpreadsheet className="h-5 w-5 text-green-600" /> Import CSV
            </button>
            <button onClick={() => setIsURLDialogOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-lg hover:bg-accent transition-all font-medium min-h-[44px]">
              <Globe className="h-5 w-5 text-blue-600" /> Import from URL
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddListingModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} onSave={handleAddListing} />
      <CSVUploadDialog open={isCSVDialogOpen} onOpenChange={setIsCSVDialogOpen} onImport={handleCSVImport} />
      <URLImportDialog open={isURLDialogOpen} onOpenChange={setIsURLDialogOpen} onImport={handleURLImport} />

      {editingListing && (
        <EditListingModal isOpen={!!editingListing} onClose={() => setEditingListing(null)} onSubmit={handleEditListing}
          initialData={{
            address: editingListing.address, city: editingListing.city, price: editingListing.price,
            beds: editingListing.beds, baths: editingListing.baths, sqft: editingListing.sqft,
            status: editingListing.status, image: editingListing.image,
            description: (editingListing as any).description, mls_number: (editingListing as any).mls_number,
            property_type: (editingListing as any).property_type,
          }} />
      )}

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} feature="listings"
        currentPlan={subscription?.plan_name || "Free"} requiredPlan="Starter" />

      {newlyCreatedListing && (
        <SocialShareDialog open={showSocialShareDialog} onOpenChange={setShowSocialShareDialog}
          listing={newlyCreatedListing} agentName={profile?.full_name} />
      )}

      <AlertDialog open={!!listingToDelete} onOpenChange={(open) => !open && setListingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" /> Delete Listing
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{listingToDelete?.address}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteListing} className="bg-red-600 hover:bg-red-700">Delete Listing</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <KeyboardShortcutsHelper shortcuts={shortcuts} />
    </div>
  );
}
