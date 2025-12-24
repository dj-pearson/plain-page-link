import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X } from "lucide-react";

const listingSchema = z.object({
  address: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2 characters (e.g., CA)"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid zip code format"),
  price: z.string().min(1, "Price is required"),
  beds: z.number().min(0, "Bedrooms must be at least 0"),
  baths: z.number().min(0, "Bathrooms must be at least 0"),
  sqft: z.string().min(1, "Square footage is required"),
  lotSize: z.string().optional(),
  propertyType: z.string(),
  status: z.string(),
  description: z.string(),
  mlsNumber: z.string().optional(),
  yearBuilt: z.string().optional(),
  images: z.array(z.instanceof(File)).max(25, "Maximum 25 images allowed"),
});

export type ListingFormData = z.infer<typeof listingSchema>;

interface AddListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: ListingFormData) => void;
}

export function AddListingModal({
  open,
  onOpenChange,
  onSave,
}: AddListingModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      price: "",
      beds: 3,
      baths: 2,
      sqft: "",
      lotSize: "",
      propertyType: "single-family",
      status: "active",
      description: "",
      mlsNumber: "",
      yearBuilt: "",
      images: [],
    },
  });

  const images = watch("images");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentImages = images || [];
    setValue("images", [...currentImages, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const currentImages = images || [];
    setValue(
      "images",
      currentImages.filter((_, i) => i !== index)
    );
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ListingFormData) => {
    try {
      setError(null);
      await onSave?.(data);
      onOpenChange(false);
      reset();
      setImagePreviews([]);
    } catch (err) {
      console.error("Failed to add listing:", err);
      setError("Failed to add listing. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Property Listing</DialogTitle>
          <DialogDescription>
            Fill in the details for your property listing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Property Address */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Property Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="123 Main Street"
                />
                {errors.address && (
                  <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...register("city")}
                />
                {errors.city && (
                  <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    {...register("state")}
                    maxLength={2}
                    placeholder="CA"
                  />
                  {errors.state && (
                    <p className="text-sm text-red-600 mt-1">{errors.state.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip *</Label>
                  <Input
                    id="zipCode"
                    {...register("zipCode")}
                    placeholder="94102"
                  />
                  {errors.zipCode && (
                    <p className="text-sm text-red-600 mt-1">{errors.zipCode.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Property Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  {...register("price")}
                  placeholder="1,250,000"
                />
                {errors.price && (
                  <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="propertyType">Property Type *</Label>
                <Controller
                  name="propertyType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single-family">Single Family</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="multi-family">Multi-Family</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="beds">Bedrooms *</Label>
                <Input
                  id="beds"
                  type="number"
                  {...register("beds", { valueAsNumber: true })}
                  min={0}
                />
                {errors.beds && (
                  <p className="text-sm text-red-600 mt-1">{errors.beds.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="baths">Bathrooms *</Label>
                <Input
                  id="baths"
                  type="number"
                  {...register("baths", { valueAsNumber: true })}
                  min={0}
                  step={0.5}
                />
                {errors.baths && (
                  <p className="text-sm text-red-600 mt-1">{errors.baths.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="sqft">Square Feet *</Label>
                <Input
                  id="sqft"
                  {...register("sqft")}
                  placeholder="2,400"
                />
                {errors.sqft && (
                  <p className="text-sm text-red-600 mt-1">{errors.sqft.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lotSize">Lot Size</Label>
                <Input
                  id="lotSize"
                  {...register("lotSize")}
                  placeholder="0.25 acres"
                />
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="off-market">Off Market</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  {...register("yearBuilt")}
                  placeholder="2015"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              rows={4}
              placeholder="Beautiful property with stunning views..."
            />
          </div>

          {/* MLS Number */}
          <div>
            <Label htmlFor="mlsNumber">MLS Number</Label>
            <Input
              id="mlsNumber"
              {...register("mlsNumber")}
              placeholder="ML81234567"
            />
          </div>

          {/* Images */}
          <div className="space-y-3">
            <Label>Property Photos</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 5MB (max 25 images)
                </p>
              </label>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.images && (
              <p className="text-sm text-red-600 mt-1">{errors.images.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Listing</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
