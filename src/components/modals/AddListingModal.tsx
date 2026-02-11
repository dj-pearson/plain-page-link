import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Upload,
  X,
  ChevronRight,
  ChevronLeft,
  Home,
  DollarSign,
  Image as ImageIcon,
  FileText,
  MapPin,
  Star,
  Video,
  Calendar,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const listingSchema = z.object({
  address: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required").max(2, "Use 2-letter state code"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid zip code"),
  price: z.string().min(1, "Price is required"),
  propertyType: z.string().min(1, "Property type is required"),
  beds: z.number().min(0, "Must be 0 or more"),
  baths: z.number().min(0, "Must be 0 or more"),
  sqft: z.string().min(1, "Square footage is required"),
  lotSize: z.string().optional(),
  yearBuilt: z.string().optional(),
  stories: z.string().optional(),
  garage: z.string().optional(),
  status: z.string(),
  mlsNumber: z.string().optional(),
  description: z.string().optional(),
  highlights: z.string().optional(),
  images: z.array(z.instanceof(File)).max(25, "Maximum 25 images"),
  virtualTourUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  openHouseDate: z.string().optional(),
  openHouseEndDate: z.string().optional(),
  isFeatured: z.boolean().optional(),
});

export type ListingFormData = z.infer<typeof listingSchema>;

interface AddListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: ListingFormData) => void;
}

const STEPS = [
  { id: "address", label: "Location", icon: MapPin },
  { id: "details", label: "Details", icon: Home },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "description", label: "Description", icon: FileText },
  { id: "media", label: "Photos", icon: ImageIcon },
  { id: "extras", label: "Extras", icon: Star },
];

export function AddListingModal({ open, onOpenChange, onSave }: AddListingModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
    trigger,
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      address: "", city: "", state: "", zipCode: "",
      price: "", beds: 3, baths: 2, sqft: "", lotSize: "",
      propertyType: "single_family", status: "active",
      description: "", highlights: "", mlsNumber: "",
      yearBuilt: "", stories: "", garage: "",
      images: [], virtualTourUrl: "", videoUrl: "",
      openHouseDate: "", openHouseEndDate: "", isFeatured: false,
    },
  });

  const images = watch("images");
  const isFeatured = watch("isFeatured");

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentImages = images || [];
    const newImages = [...currentImages, ...files].slice(0, 25);
    setValue("images", newImages);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string].slice(0, 25));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }, [images, setValue]);

  const removeImage = useCallback((index: number) => {
    const currentImages = images || [];
    setValue("images", currentImages.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }, [images, setValue]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    const currentImages = images || [];
    const newImages = [...currentImages, ...files].slice(0, 25);
    setValue("images", newImages);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string].slice(0, 25));
      };
      reader.readAsDataURL(file);
    });
  }, [images, setValue]);

  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldsByStep: Record<number, (keyof ListingFormData)[]> = {
      0: ["address", "city", "state", "zipCode"],
      1: ["propertyType", "beds", "baths", "sqft"],
      2: ["price", "status"],
      3: [], 4: [], 5: [],
    };
    const fields = fieldsByStep[currentStep];
    if (fields.length === 0) return true;
    return trigger(fields);
  };

  const goToNextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
  };

  const goToPrevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const onSubmit = async (data: ListingFormData) => {
    try {
      setError(null);
      await onSave?.(data);
      onOpenChange(false);
      reset();
      setImagePreviews([]);
      setCurrentStep(0);
    } catch (err) {
      console.error("Failed to add listing:", err);
      setError("Failed to add listing. Please try again.");
    }
  };

  const handleClose = () => { onOpenChange(false); setCurrentStep(0); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl">Add New Property Listing</DialogTitle>
          <DialogDescription>Fill in the details for your property listing</DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="px-6 py-3 border-b">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              return (
                <button key={step.id} type="button" onClick={() => idx <= currentStep && setCurrentStep(idx)}
                  className={cn("flex flex-col items-center gap-1 transition-all",
                    isActive ? "text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    isActive ? "bg-primary text-primary-foreground" : isCompleted ? "bg-green-100 text-green-600" : "bg-muted")}>
                    {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          {error && (
            <div className="mx-6 mt-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Step 0: Location */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Property Location</h3>
                <div>
                  <Label htmlFor="address">Street Address *</Label>
                  <Input id="address" {...register("address")} placeholder="123 Main Street" className="mt-1" />
                  {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" {...register("city")} className="mt-1" />
                    {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input id="state" {...register("state")} maxLength={2} placeholder="CA" className="mt-1" />
                      {errors.state && <p className="text-sm text-red-600 mt-1">{errors.state.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Zip *</Label>
                      <Input id="zipCode" {...register("zipCode")} placeholder="94102" className="mt-1" />
                      {errors.zipCode && <p className="text-sm text-red-600 mt-1">{errors.zipCode.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Property Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Property Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Property Type *</Label>
                    <Controller name="propertyType" control={control} render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single_family">Single Family</SelectItem>
                          <SelectItem value="condo">Condo</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="multi_family">Multi-Family</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div>
                    <Label htmlFor="beds">Bedrooms *</Label>
                    <Input id="beds" type="number" {...register("beds", { valueAsNumber: true })} min={0} className="mt-1" />
                    {errors.beds && <p className="text-sm text-red-600 mt-1">{errors.beds.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="baths">Bathrooms *</Label>
                    <Input id="baths" type="number" {...register("baths", { valueAsNumber: true })} min={0} step={0.5} className="mt-1" />
                    {errors.baths && <p className="text-sm text-red-600 mt-1">{errors.baths.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="sqft">Square Feet *</Label>
                    <Input id="sqft" {...register("sqft")} placeholder="2,400" className="mt-1" />
                    {errors.sqft && <p className="text-sm text-red-600 mt-1">{errors.sqft.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lotSize">Lot Size (acres)</Label>
                    <Input id="lotSize" {...register("lotSize")} placeholder="0.25" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input id="yearBuilt" {...register("yearBuilt")} placeholder="2015" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="stories">Stories</Label>
                    <Input id="stories" {...register("stories")} placeholder="2" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="garage">Garage Spaces</Label>
                    <Input id="garage" {...register("garage")} placeholder="2" className="mt-1" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Pricing & Status */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Pricing & Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Listing Price *</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="price" {...register("price")} placeholder="1,250,000" className="pl-9" />
                    </div>
                    {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>}
                  </div>
                  <div>
                    <Label>Listing Status *</Label>
                    <Controller name="status" control={control} render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="under_contract">Under Contract</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="draft">Draft (Hidden)</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div>
                    <Label htmlFor="mlsNumber">MLS Number</Label>
                    <Input id="mlsNumber" {...register("mlsNumber")} placeholder="ML81234567" className="mt-1" />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center gap-3 cursor-pointer p-2" onClick={() => setValue("isFeatured", !isFeatured)}>
                      <div className={cn("w-10 h-6 rounded-full transition-colors relative",
                        isFeatured ? "bg-purple-600" : "bg-gray-300")}>
                        <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 transition-transform",
                          isFeatured ? "translate-x-5" : "translate-x-1")} />
                      </div>
                      <span className="text-sm font-medium">Featured Listing</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Description */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Property Description</h3>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register("description")} rows={6}
                    placeholder="Describe the property's key features, upgrades, neighborhood..." className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">A compelling description helps attract more buyers.</p>
                </div>
                <div>
                  <Label htmlFor="highlights">Property Highlights</Label>
                  <Textarea id="highlights" {...register("highlights")} rows={3}
                    placeholder="Updated kitchen, Hardwood floors, Pool, Mountain views" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">Comma-separated list of standout features.</p>
                </div>
              </div>
            )}

            {/* Step 4: Photos */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Property Photos</h3>
                <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-accent/30 transition-all cursor-pointer">
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload}
                    className="hidden" id="image-upload-add" />
                  <label htmlFor="image-upload-add" className="cursor-pointer">
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WEBP up to 5MB each (max 25 photos)</p>
                  </label>
                </div>
                {imagePreviews.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">{imagePreviews.length} photo{imagePreviews.length !== 1 ? "s" : ""} selected</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                          {index === 0 && (
                            <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">Cover</div>
                          )}
                          <button type="button" onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {errors.images && <p className="text-sm text-red-600 mt-1">{errors.images.message}</p>}
              </div>
            )}

            {/* Step 5: Extras */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Additional Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="virtualTourUrl" className="flex items-center gap-2"><Video className="h-4 w-4" /> Virtual Tour URL</Label>
                    <Input id="virtualTourUrl" {...register("virtualTourUrl")} placeholder="https://my.matterport.com/show/?m=..." className="mt-1" />
                    {errors.virtualTourUrl && <p className="text-sm text-red-600 mt-1">{errors.virtualTourUrl.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="videoUrl" className="flex items-center gap-2"><Video className="h-4 w-4" /> Video URL</Label>
                    <Input id="videoUrl" {...register("videoUrl")} placeholder="https://youtube.com/watch?v=..." className="mt-1" />
                    {errors.videoUrl && <p className="text-sm text-red-600 mt-1">{errors.videoUrl.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="openHouseDate" className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Open House Start</Label>
                      <Input id="openHouseDate" type="datetime-local" {...register("openHouseDate")} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="openHouseEndDate" className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Open House End</Label>
                      <Input id="openHouseEndDate" type="datetime-local" {...register("openHouseEndDate")} className="mt-1" />
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Ready to publish! Review and click "Add Listing" to save.</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-background flex items-center justify-between">
            <Button type="button" variant="outline" onClick={currentStep === 0 ? handleClose : goToPrevStep}>
              {currentStep === 0 ? "Cancel" : (<><ChevronLeft className="h-4 w-4 mr-1" /> Back</>)}
            </Button>
            <div className="text-xs text-muted-foreground">Step {currentStep + 1} of {STEPS.length}</div>
            {currentStep < STEPS.length - 1 ? (
              <Button type="button" onClick={goToNextStep}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
            ) : (
              <Button type="submit">Add Listing</Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
