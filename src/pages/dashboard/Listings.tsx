import { useState } from "react";
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { AddListingModal } from "@/components/modals/AddListingModal";
import { EditListingModal, EditListingFormData } from "@/components/modals/EditListingModal";
import type { ListingFormData } from "@/components/modals/AddListingModal";
import { useToast } from "@/hooks/use-toast";
import { useListings } from "@/hooks/useListings";
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
      await addListing.mutateAsync(data);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Property Listings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your active and sold properties
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Property
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

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{listings.length}</div>
          <div className="text-sm text-muted-foreground">Total Listings</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {listings.filter((l) => l.status === "active").length}
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {listings.filter((l) => l.status === "pending").length}
          </div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
          >
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={listing.image}
                alt={listing.address}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    listing.status === "active"
                      ? "bg-green-500 text-white"
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {listing.status}
                </span>
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                <button 
                  onClick={() => setEditingListing(listing)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                  title="Edit listing"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDeleteListing(listing.id)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors text-red-600"
                  title="Delete listing"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="mb-3">
                <div className="text-2xl font-bold text-primary mb-1">
                  {listing.price}
                </div>
                <div className="font-medium text-foreground">{listing.address}</div>
                <div className="text-sm text-muted-foreground">{listing.city}</div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>{listing.beds} beds</span>
                <span>•</span>
                <span>{listing.baths} baths</span>
                {listing.sqft && (
                  <>
                    <span>•</span>
                    <span>{listing.sqft.toLocaleString()} sqft</span>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Listed {new Date(listing.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (shown when no listings) */}
      {listings.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No properties yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Start by adding your first property listing
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            Add Your First Property
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
