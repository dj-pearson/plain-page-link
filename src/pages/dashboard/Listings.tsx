import { useState } from "react";
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { AddListingModal } from "@/components/modals/AddListingModal";
import { EditListingModal, EditListingFormData } from "@/components/modals/EditListingModal";
import type { ListingFormData } from "@/components/modals/AddListingModal";
import { useToast } from "@/hooks/use-toast";
import { useListings } from "@/hooks/useListings";
import { useListingImageUpload } from "@/hooks/useListingImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradeModal } from "@/components/UpgradeModal";
import { LimitBanner } from "@/components/LimitBanner";

export default function Listings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { toast } = useToast();
  const { listings, isLoading, addListing, deleteListing } = useListings();
  const { uploadListingImages, uploading: uploadingImages } = useListingImageUpload();
  const { subscription, canAdd, getLimit, getUsage } = useSubscriptionLimits();

  const handleAddClick = () => {
    if (!canAdd('listings')) {
      setShowUpgradeModal(true);
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleAddListing = async (data: ListingFormData) => {
    try {
      // Upload images first if any
      let imageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        imageUrls = await uploadListingImages(data.images);

        if (imageUrls.length === 0) {
          // Upload failed, error already shown by hook
          return;
        }
      }

      // Create listing data with uploaded image URLs
      const listingData = {
        address: data.address,
        city: data.city,
        price: data.price,
        beds: data.beds,
        baths: data.baths,
        sqft: parseInt(data.sqft) || null,
        status: data.status,
        image: imageUrls[0] || null, // First image as primary
        photos: imageUrls.length > 0 ? imageUrls : null, // All images
        description: data.description || null,
        mls_number: data.mlsNumber || null,
        property_type: data.propertyType || null,
      };

      await addListing.mutateAsync(listingData);
      toast({
        title: "Listing added!",
        description: "Your property listing has been created successfully.",
      });
      setIsAddModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add listing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    
    try {
      await deleteListing.mutateAsync(id);
      toast({
        title: "Listing deleted",
        description: "Property listing has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete listing.",
        variant: "destructive",
      });
    }
  };

  const handleEditListing = async (data: EditListingFormData) => {
    if (!editingListing) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('listings')
        .update({
          address: data.address,
          city: data.city,
          price: data.price,
          beds: data.beds,
          baths: data.baths,
          sqft: data.sqft,
          status: data.status,
          image: data.image,
          description: data.description,
          mls_number: data.mls_number,
          property_type: data.property_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingListing.id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Listing updated!",
        description: "Your property listing has been updated successfully.",
      });
      setEditingListing(null);
      // Refetch listings
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update listing. Please try again.",
        variant: "destructive",
      });
    }
  };

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
        <button
          onClick={handleAddClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 sm:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:scale-95 transition-all font-medium min-h-[44px] w-full sm:w-auto justify-center shadow-sm"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Add Property</span>
        </button>
      </div>

      {/* Limit Banner */}
      {subscription && getLimit('listings') !== Infinity && (
        <LimitBanner
          feature="listings"
          current={getUsage('listings')}
          limit={getLimit('listings')}
        />
      )}

      {/* Filters & Search - Mobile optimized */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base min-h-[44px]"
          />
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-background border border-border rounded-lg hover:bg-accent active:scale-95 transition-all min-h-[44px] w-full sm:w-auto">
          <Filter className="h-4 w-4" />
          <span className="text-sm sm:text-base">Filters</span>
        </button>
      </div>

      {/* Stats - Mobile optimized 3-column grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="text-xl sm:text-2xl font-bold text-foreground">{listings.length}</div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">Total</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {listings.filter((l) => l.status === "active").length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">Active</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">
            {listings.filter((l) => l.status === "pending").length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">Pending</div>
        </div>
      </div>

      {/* Listings Grid - Mobile optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg active:shadow-xl transition-all group"
          >
            {/* Image */}
            <div className="relative h-44 sm:h-48 overflow-hidden">
              <img
                src={listing.image}
                alt={listing.address}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                <span
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                    listing.status === "active"
                      ? "bg-green-500 text-white shadow-md"
                      : "bg-yellow-500 text-white shadow-md"
                  }`}
                >
                  {listing.status}
                </span>
              </div>
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => setEditingListing(listing)}
                  className="p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white active:scale-90 transition-all shadow-md min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="Edit listing"
                  aria-label="Edit listing"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteListing(listing.id)}
                  className="p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white active:scale-90 transition-all text-red-600 shadow-md min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="Delete listing"
                  aria-label="Delete listing"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4">
              <div className="mb-2 sm:mb-3">
                <div className="text-xl sm:text-2xl font-bold text-primary mb-1">
                  {listing.price}
                </div>
                <div className="font-medium text-sm sm:text-base text-foreground">{listing.address}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{listing.city}</div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 flex-wrap">
                <span>{listing.beds} beds</span>
                <span>•</span>
                <span>{listing.baths} baths</span>
                {listing.sqft && (
                  <>
                    <span>•</span>
                    <span className="whitespace-nowrap">{listing.sqft.toLocaleString()} sqft</span>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Listed {new Date(listing.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (shown when no listings) - Mobile optimized */}
      {listings.length === 0 && (
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-accent rounded-full mb-3 sm:mb-4">
            <Plus className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
            No properties yet
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-sm mx-auto">
            Start by adding your first property listing
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:scale-95 transition-all font-medium min-h-[44px] shadow-md"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm sm:text-base">Add Your First Property</span>
          </button>
        </div>
      )}

      {/* Add Listing Modal */}
      <AddListingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddListing}
      />

      {/* Edit Listing Modal */}
      {editingListing && (
        <EditListingModal
          isOpen={!!editingListing}
          onClose={() => setEditingListing(null)}
          onSubmit={handleEditListing}
          initialData={{
            address: editingListing.address,
            city: editingListing.city,
            price: editingListing.price,
            beds: editingListing.beds,
            baths: editingListing.baths,
            sqft: editingListing.sqft,
            status: editingListing.status,
            image: editingListing.image,
            description: editingListing.description,
            mls_number: editingListing.mls_number,
            property_type: editingListing.property_type,
          }}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="listings"
        currentPlan={subscription?.plan_name || "Free"}
        requiredPlan="Starter"
      />
    </div>
  );
}
