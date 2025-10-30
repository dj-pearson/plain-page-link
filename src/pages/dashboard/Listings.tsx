import { useState } from "react";
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { AddListingModal } from "@/components/modals/AddListingModal";
import type { ListingFormData } from "@/components/modals/AddListingModal";
import { useToast } from "@/hooks/use-toast";

export default function Listings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  const handleAddListing = (data: ListingFormData) => {
    // TODO: Save to backend
    console.log("New listing:", data);
    toast({
      title: "Listing added!",
      description: "Your property listing has been created successfully.",
    });
  };

  // Mock data - will be replaced with real data from backend
  const listings = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400",
      address: "123 Oak Street",
      city: "San Francisco, CA",
      price: "$1,250,000",
      beds: 4,
      baths: 3,
      sqft: "2,400",
      status: "Active",
      views: 234,
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400",
      address: "456 Maple Avenue",
      city: "Los Angeles, CA",
      price: "$895,000",
      beds: 3,
      baths: 2,
      sqft: "1,850",
      status: "Pending",
      views: 189,
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400",
      address: "789 Pine Road",
      city: "San Diego, CA",
      price: "$1,450,000",
      beds: 5,
      baths: 4,
      sqft: "3,200",
      status: "Active",
      views: 412,
    },
  ];

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
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </button>
      </div>

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
            {listings.filter((l) => l.status === "Active").length}
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {listings.filter((l) => l.status === "Pending").length}
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
                    listing.status === "Active"
                      ? "bg-green-500 text-white"
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {listing.status}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                  <MoreVertical className="h-4 w-4" />
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
                <span>•</span>
                <span>{listing.sqft} sqft</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{listing.views} views</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
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
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSave={handleAddListing}
      />
    </div>
  );
}
