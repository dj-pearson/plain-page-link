/**
 * Multi-step Property Details Form
 * Step 1: Property Type & Basic Info
 * Step 2: Location & Details
 * Step 3: Features Selection
 * Step 4: Target Buyer & Review
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PropertyDetails, PropertyType, TargetBuyer, PROPERTY_FEATURES } from '@/lib/listing-description-generator/types';
import { ArrowRight, ArrowLeft, Home, MapPin, Sparkles, Target } from 'lucide-react';

interface PropertyDetailsFormProps {
  onSubmit: (data: PropertyDetails) => void;
  onStepChange?: (step: number) => void;
}

export function PropertyDetailsForm({ onSubmit, onStepChange }: PropertyDetailsFormProps) {
  const [step, setStep] = useState(1);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PropertyDetails>({
    defaultValues: {
      selectedFeatures: [],
    }
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const nextStep = () => {
    const newStep = Math.min(step + 1, totalSteps);
    setStep(newStep);
    onStepChange?.(newStep);
  };

  const prevStep = () => {
    const newStep = Math.max(step - 1, 1);
    setStep(newStep);
    onStepChange?.(newStep);
  };

  const handleFormSubmit = (data: PropertyDetails) => {
    data.selectedFeatures = selectedFeatures;
    onSubmit(data);
  };

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const featuresByCategory = {
    interior: PROPERTY_FEATURES.filter(f => f.category === 'interior'),
    exterior: PROPERTY_FEATURES.filter(f => f.category === 'exterior'),
    location: PROPERTY_FEATURES.filter(f => f.category === 'location'),
    upgrades: PROPERTY_FEATURES.filter(f => f.category === 'upgrades'),
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step 1: Property Type & Basic Info */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Property Basics</h2>
              <p className="text-gray-600">Tell us about the property</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="propertyType">
                Property Type <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value: PropertyType) => setValue('propertyType', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single-family">Single-Family Home</SelectItem>
                  <SelectItem value="condo">Condominium</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="multi-family">Multi-Family</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="commercial">Commercial Property</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedrooms">
                  Bedrooms <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  placeholder="3"
                  {...register('bedrooms', { required: 'Bedrooms is required', valueAsNumber: true })}
                  className="mt-1"
                />
                {errors.bedrooms && (
                  <p className="text-red-500 text-sm mt-1">{errors.bedrooms.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="bathrooms">
                  Bathrooms <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="2.5"
                  {...register('bathrooms', { required: 'Bathrooms is required', valueAsNumber: true })}
                  className="mt-1"
                />
                {errors.bathrooms && (
                  <p className="text-red-500 text-sm mt-1">{errors.bathrooms.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="squareFeet">
                  Square Feet <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="squareFeet"
                  type="number"
                  min="0"
                  placeholder="2000"
                  {...register('squareFeet', { required: 'Square feet is required', valueAsNumber: true })}
                  className="mt-1"
                />
                {errors.squareFeet && (
                  <p className="text-red-500 text-sm mt-1">{errors.squareFeet.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="price">
                  Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  placeholder="450000"
                  {...register('price', { required: 'Price is required', valueAsNumber: true })}
                  className="mt-1"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  placeholder="2015"
                  {...register('yearBuilt', { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="lotSize">Lot Size (sq ft)</Label>
                <Input
                  id="lotSize"
                  type="number"
                  min="0"
                  placeholder="8000"
                  {...register('lotSize', { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Location & Details */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Location & Details</h2>
              <p className="text-gray-600">Where is this property located?</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address (Optional)</Label>
              <Input
                id="address"
                placeholder="123 Main Street"
                {...register('address')}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">Leave blank for privacy</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="Miami"
                  {...register('city', { required: 'City is required' })}
                  className="mt-1"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state">
                  State <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="state"
                  placeholder="FL"
                  maxLength={2}
                  {...register('state', { required: 'State is required' })}
                  className="mt-1"
                />
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="neighborhood">Neighborhood</Label>
                <Input
                  id="neighborhood"
                  placeholder="Downtown, Waterfront, etc."
                  {...register('neighborhood')}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  placeholder="33101"
                  {...register('zipCode')}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hoa">HOA Fee ($/month)</Label>
                <Input
                  id="hoa"
                  type="number"
                  min="0"
                  placeholder="150"
                  {...register('hoa', { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="parking">Parking</Label>
                <Input
                  id="parking"
                  placeholder="2-car garage"
                  {...register('parking')}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Features Selection */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Property Features</h2>
              <p className="text-gray-600">Select all that apply</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Interior Features */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Interior Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {featuresByCategory.interior.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => toggleFeature(feature.id)}
                    className={`
                      border-2 rounded-lg p-3 text-left transition-all
                      ${selectedFeatures.includes(feature.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{feature.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Exterior Features */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Exterior Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {featuresByCategory.exterior.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => toggleFeature(feature.id)}
                    className={`
                      border-2 rounded-lg p-3 text-left transition-all
                      ${selectedFeatures.includes(feature.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{feature.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location Features */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Location Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {featuresByCategory.location.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => toggleFeature(feature.id)}
                    className={`
                      border-2 rounded-lg p-3 text-left transition-all
                      ${selectedFeatures.includes(feature.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{feature.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upgrades */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Upgrades & Special Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {featuresByCategory.upgrades.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => toggleFeature(feature.id)}
                    className={`
                      border-2 rounded-lg p-3 text-left transition-all
                      ${selectedFeatures.includes(feature.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{feature.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Features */}
            <div>
              <Label htmlFor="uniqueSellingPoints">
                Unique Selling Points (Optional)
              </Label>
              <Textarea
                id="uniqueSellingPoints"
                placeholder="Describe any unique features not listed above (e.g., custom theater room, wine cellar, guest house)..."
                rows={4}
                {...register('uniqueSellingPoints')}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                These details will be incorporated into your descriptions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Target Buyer */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Target Buyer</h2>
              <p className="text-gray-600">Who is your ideal buyer?</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { value: 'first-time' as TargetBuyer, label: 'First-Time Homebuyers', desc: 'Young professionals or couples buying their first home' },
              { value: 'luxury' as TargetBuyer, label: 'Luxury Buyers', desc: 'Affluent buyers seeking high-end properties' },
              { value: 'investor' as TargetBuyer, label: 'Real Estate Investors', desc: 'Looking for rental income or appreciation' },
              { value: 'family' as TargetBuyer, label: 'Growing Families', desc: 'Parents with children needing more space' },
              { value: 'downsizer' as TargetBuyer, label: 'Downsizers / Empty Nesters', desc: 'Looking for less maintenance and space' },
              { value: 'relocating' as TargetBuyer, label: 'Relocating Professionals', desc: 'Moving to the area for work' },
            ].map((buyer) => (
              <div
                key={buyer.value}
                onClick={() => setValue('targetBuyer', buyer.value)}
                className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${watch('targetBuyer') === buyer.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="targetBuyer"
                    value={buyer.value}
                    {...register('targetBuyer', { required: true })}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold">{buyer.label}</div>
                    <div className="text-sm text-gray-600">{buyer.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
            <h3 className="font-bold text-blue-900 mb-3">Summary</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• {watch('bedrooms')} bed, {watch('bathrooms')} bath {watch('propertyType')}</p>
              <p>• {watch('squareFeet')?.toLocaleString()} sq ft</p>
              <p>• ${watch('price')?.toLocaleString()}</p>
              <p>• {watch('city')}, {watch('state')}</p>
              <p>• {selectedFeatures.length} features selected</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        {step < totalSteps ? (
          <Button
            type="button"
            onClick={nextStep}
            className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            Generate Descriptions
            <Sparkles className="w-4 h-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
