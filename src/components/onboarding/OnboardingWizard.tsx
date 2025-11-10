import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Sparkles, Upload, Home, Link as LinkIcon, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

/**
 * OnboardingWizard Component
 * 5-step guided onboarding to get agents from signup to shareable profile in <10 minutes
 */

interface OnboardingWizardProps {
  onComplete: () => void;
  userProfile?: any;
}

export function OnboardingWizard({ onComplete, userProfile }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    templateChoice: null as string | null,
    profileBasics: {
      photo: null as File | null,
      photoPreview: null as string | null,
      fullName: userProfile?.full_name || '',
      title: '',
      bio: '',
      phone: '',
      location: ''
    },
    firstListing: {
      photo: null as File | null,
      photoPreview: null as string | null,
      address: '',
      price: '',
      beds: '',
      baths: '',
      status: 'active' as 'active' | 'sold'
    },
    importOption: null as 'scratch' | 'linktree' | null
  });

  const navigate = useNavigate();

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const steps = [
    { number: 1, title: 'Choose Template', icon: Sparkles },
    { number: 2, title: 'Profile Basics', icon: Upload },
    { number: 3, title: 'First Listing', icon: Home },
    { number: 4, title: 'Preview', icon: Eye },
    { number: 5, title: 'Share', icon: LinkIcon }
  ];

  const templates = [
    { id: 'luxury', name: 'Luxury', description: 'High-end properties', colors: ['#1e3a8a', '#d4af37'] },
    { id: 'modern', name: 'Modern Clean', description: 'Minimalist & professional', colors: ['#2563eb', '#10b981'] },
    { id: 'coastal', name: 'Coastal', description: 'Beach & waterfront', colors: ['#0891b2', '#06b6d4'] },
    { id: 'classic', name: 'Classic', description: 'Traditional & timeless', colors: ['#7c3aed', '#a855f7'] }
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(wizardData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipToEnd = () => {
    onComplete(wizardData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardData.templateChoice !== null;
      case 2:
        return wizardData.profileBasics.fullName && wizardData.profileBasics.title;
      case 3:
        return true; // Optional step
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Setup Your AgentBio Profile
            </h1>
            <Button variant="ghost" size="sm" onClick={handleSkipToEnd}>
              Skip Setup
            </Button>
          </div>
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex items-center justify-between">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex items-center gap-2 ${
                  step.number === currentStep ? 'text-blue-600 font-semibold' :
                  step.number < currentStep ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {step.number < currentStep ? (
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.number === currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step.number}
                  </div>
                )}
                <span className="hidden md:inline text-sm">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8 bg-white shadow-xl">
          {currentStep === 1 && (
            <StepChooseTemplate
              templates={templates}
              selected={wizardData.templateChoice}
              onSelect={(id) => setWizardData({ ...wizardData, templateChoice: id })}
            />
          )}

          {currentStep === 2 && (
            <StepProfileBasics
              data={wizardData.profileBasics}
              onChange={(data) => setWizardData({ ...wizardData, profileBasics: data })}
            />
          )}

          {currentStep === 3 && (
            <StepFirstListing
              data={wizardData.firstListing}
              onChange={(data) => setWizardData({ ...wizardData, firstListing: data })}
            />
          )}

          {currentStep === 4 && (
            <StepPreview wizardData={wizardData} />
          )}

          {currentStep === 5 && (
            <StepShare username={userProfile?.username || 'yourname'} />
          )}
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-sm text-gray-600">
            Step {currentStep} of {totalSteps} • ~{10 - currentStep * 2} min remaining
          </div>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {currentStep === totalSteps ? 'Go to Dashboard' : 'Next'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Step Components
function StepChooseTemplate({ templates, selected, onSelect }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Choose Your Style</h2>
      <p className="text-gray-600 mb-6">
        Select a template to match your brand. You can customize it later.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {templates.map((template: any) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={`p-4 rounded-xl border-2 transition-all ${
              selected === template.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div
              className="w-full h-24 rounded-lg mb-3"
              style={{
                background: `linear-gradient(135deg, ${template.colors[0]}, ${template.colors[1]})`
              }}
            />
            <div className="font-semibold text-sm">{template.name}</div>
            <div className="text-xs text-gray-500">{template.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepProfileBasics({ data, onChange }: any) {
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, photo: file, photoPreview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Your Profile Basics</h2>
      <p className="text-gray-600 mb-6">
        Add your photo and basic info. Takes ~2 minutes.
      </p>
      <div className="space-y-4">
        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Profile Photo</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
              {data.photoPreview ? (
                <img src={data.photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Upload className="h-8 w-8" />
                </div>
              )}
            </div>
            <div>
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button asChild variant="outline" size="sm">
                <label htmlFor="photo-upload" className="cursor-pointer">
                  Upload Photo
                </label>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name *</label>
            <input
              type="text"
              value={data.fullName}
              onChange={(e) => onChange({ ...data, fullName: e.target.value })}
              placeholder="Sarah Johnson"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              placeholder="Luxury Home Specialist"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Bio (optional)</label>
          <textarea
            value={data.bio}
            onChange={(e) => onChange({ ...data, bio: e.target.value })}
            placeholder="Helping families find their dream homes..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Phone (optional)</label>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => onChange({ ...data, phone: e.target.value })}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Location (optional)</label>
            <input
              type="text"
              value={data.location}
              onChange={(e) => onChange({ ...data, location: e.target.value })}
              placeholder="Austin, TX"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepFirstListing({ data, onChange }: any) {
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, photo: file, photoPreview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Add Your First Listing</h2>
      <p className="text-gray-600 mb-6">
        Showcase a property to make your profile pop. You can skip and add later.
      </p>
      <div className="space-y-4">
        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Property Photo</label>
          <div className="flex items-center gap-4">
            <div className="w-32 h-24 rounded-lg bg-gray-200 overflow-hidden">
              {data.photoPreview ? (
                <img src={data.photoPreview} alt="Property" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Home className="h-8 w-8" />
                </div>
              )}
            </div>
            <div>
              <input
                type="file"
                id="listing-photo"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button asChild variant="outline" size="sm">
                <label htmlFor="listing-photo" className="cursor-pointer">
                  Upload Photo
                </label>
              </Button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Address</label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            placeholder="123 Main St, Austin, TX 78701"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Price</label>
            <input
              type="text"
              value={data.price}
              onChange={(e) => onChange({ ...data, price: e.target.value })}
              placeholder="$750,000"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Beds</label>
            <input
              type="number"
              value={data.beds}
              onChange={(e) => onChange({ ...data, beds: e.target.value })}
              placeholder="3"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Baths</label>
            <input
              type="number"
              value={data.baths}
              onChange={(e) => onChange({ ...data, baths: e.target.value })}
              placeholder="2"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={data.status === 'active'}
                onChange={() => onChange({ ...data, status: 'active' })}
                className="text-blue-600"
              />
              <span>Active Listing</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={data.status === 'sold'}
                onChange={() => onChange({ ...data, status: 'sold' })}
                className="text-blue-600"
              />
              <span>Sold Property</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepPreview({ wizardData }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Preview Your Profile</h2>
      <p className="text-gray-600 mb-6">
        Here's how your profile will look. You can edit everything later.
      </p>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 border border-gray-200">
        {/* Mock Profile Preview */}
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
          <div className="flex flex-col items-center mb-6">
            {wizardData.profileBasics.photoPreview ? (
              <img
                src={wizardData.profileBasics.photoPreview}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-300 mb-4" />
            )}
            <h3 className="text-xl font-bold">{wizardData.profileBasics.fullName || 'Your Name'}</h3>
            <p className="text-sm text-gray-600">{wizardData.profileBasics.title || 'Your Title'}</p>
            {wizardData.profileBasics.location && (
              <p className="text-sm text-gray-500">{wizardData.profileBasics.location}</p>
            )}
          </div>

          {wizardData.profileBasics.bio && (
            <p className="text-sm text-gray-700 text-center mb-4">
              {wizardData.profileBasics.bio}
            </p>
          )}

          {wizardData.firstListing.photoPreview && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <img
                src={wizardData.firstListing.photoPreview}
                alt="Listing"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="font-semibold text-lg text-blue-600 mb-1">
                  {wizardData.firstListing.price || '$XXX,XXX'}
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  {wizardData.firstListing.address || 'Property Address'}
                </div>
                {(wizardData.firstListing.beds || wizardData.firstListing.baths) && (
                  <div className="text-sm text-gray-600">
                    {wizardData.firstListing.beds} bd • {wizardData.firstListing.baths} ba
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepShare({ username }: any) {
  const profileUrl = `agentbio.net/${username}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${profileUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold mb-2">🎉 Your Profile is Live!</h2>
      <p className="text-gray-600 mb-8">
        Share your link on Instagram, Facebook, business cards, and everywhere you connect with clients.
      </p>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
        <div className="text-sm text-gray-600 mb-2">Your AgentBio Link</div>
        <div className="text-2xl font-bold text-blue-600 mb-4">{profileUrl}</div>
        <Button onClick={handleCopy} size="lg" className="mb-4">
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
      </div>

      <div className="space-y-3 text-left max-w-md mx-auto">
        <h3 className="font-semibold text-center mb-4">Next Steps:</h3>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            1
          </div>
          <div>
            <div className="font-medium">Add it to Instagram bio</div>
            <div className="text-sm text-gray-600">Replace your current link with your AgentBio URL</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            2
          </div>
          <div>
            <div className="font-medium">Add more listings</div>
            <div className="text-sm text-gray-600">Showcase your sold properties and active listings</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            3
          </div>
          <div>
            <div className="font-medium">Customize your theme</div>
            <div className="text-sm text-gray-600">Match your personal brand with colors and fonts</div>
          </div>
        </div>
      </div>
    </div>
  );
}
