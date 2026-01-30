import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, 
  Home, 
  Users, 
  Star, 
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { generateSampleData, checkExistingData } from "@/lib/sample-data-service";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SampleDataManager() {
  const { user } = useAuthStore();
  const [targetUserId, setTargetUserId] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [existingDataInfo, setExistingDataInfo] = useState<any>(null);
  
  // Options for what to include
  const [includeListings, setIncludeListings] = useState(true);
  const [includeLeads, setIncludeLeads] = useState(true);
  const [includeTestimonials, setIncludeTestimonials] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false);

  const handleCheckUser = async () => {
    if (!targetEmail && !targetUserId) {
      toast.error("Please enter a user email or ID");
      return;
    }

    setIsCheckingUser(true);
    setExistingDataInfo(null);

    try {
      let userId = targetUserId;

      // If email is provided, look up the user ID
      if (targetEmail && !targetUserId) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email_display', targetEmail)
          .single();

        if (userError || !userData) {
          // Try auth.users table
          const { data: authData } = await supabase.auth.admin.listUsers();
          const foundUser = authData?.users.find(u => u.email === targetEmail);
          
          if (!foundUser) {
            toast.error("User not found with that email");
            return;
          }
          userId = foundUser.id;
        } else {
          userId = userData.id;
        }
        
        setTargetUserId(userId);
      }

      // Check existing data
      const existingData = await checkExistingData(userId);
      setExistingDataInfo(existingData);

      toast.success("User data checked successfully");
    } catch (error: any) {
      console.error('Error checking user:', error);
      toast.error(error.message || "Failed to check user data");
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleGenerateSampleData = async () => {
    if (!targetUserId && !targetEmail) {
      toast.error("Please check a user first");
      return;
    }

    if (!targetUserId) {
      await handleCheckUser();
      return;
    }

    setIsLoading(true);

    try {
      const counts = await generateSampleData(targetUserId, {
        includeListings,
        includeLeads,
        includeTestimonials,
        includeLinks,
        skipDuplicateCheck,
      });

      // Refresh existing data check
      const existingData = await checkExistingData(targetUserId);
      setExistingDataInfo(existingData);

      const summary = [
        counts.addedListings > 0 ? `${counts.addedListings} listings` : null,
        counts.addedLeads > 0 ? `${counts.addedLeads} leads` : null,
        counts.addedTestimonials > 0 ? `${counts.addedTestimonials} testimonials` : null,
        counts.addedLinks > 0 ? `${counts.addedLinks} links` : null,
      ].filter(Boolean).join(', ');

      if (summary) {
        toast.success(`Successfully added: ${summary}`);
      } else {
        toast.info("No new data was added (user may already have sample data)");
      }
    } catch (error: any) {
      console.error('Error generating sample data:', error);
      toast.error(error.message || "Failed to generate sample data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSampleDataToSelf = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setTargetUserId(user.id);
    setTargetEmail(user.email || "");
    
    // Check existing data first
    try {
      const existingData = await checkExistingData(user.id);
      setExistingDataInfo(existingData);
      
      // Then generate
      const counts = await generateSampleData(user.id, {
        includeListings,
        includeLeads,
        includeTestimonials,
        includeLinks,
        skipDuplicateCheck,
      });

      const summary = [
        counts.addedListings > 0 ? `${counts.addedListings} listings` : null,
        counts.addedLeads > 0 ? `${counts.addedLeads} leads` : null,
        counts.addedTestimonials > 0 ? `${counts.addedTestimonials} testimonials` : null,
        counts.addedLinks > 0 ? `${counts.addedLinks} links` : null,
      ].filter(Boolean).join(', ');

      if (summary) {
        toast.success(`Successfully added to your account: ${summary}`);
      } else {
        toast.info("No new data was added (you may already have sample data)");
      }
    } catch (error: any) {
      console.error('Error adding sample data to self:', error);
      toast.error(error.message || "Failed to add sample data");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sample Data Manager
        </CardTitle>
        <CardDescription>
          Generate sample listings, leads, testimonials, and links for users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Action - Add to Self */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Quick Action</h3>
          <p className="text-sm text-blue-700 mb-4">
            Add sample data to your own account for testing
          </p>
          <Button
            onClick={handleAddSampleDataToSelf}
            disabled={isLoading}
            variant="default"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Add Sample Data to My Account
              </>
            )}
          </Button>
        </div>

        {/* User Selection */}
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">User ID (UUID)</Label>
              <Input
                id="userId"
                placeholder="123e4567-e89b-12d3-a456-426614174000"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            onClick={handleCheckUser}
            disabled={isCheckingUser || isLoading}
            variant="outline"
            className="w-full"
          >
            {isCheckingUser ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Check User Data
              </>
            )}
          </Button>
        </div>

        {/* Existing Data Info */}
        {existingDataInfo && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Current Data for User:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>Listings: {existingDataInfo.counts.listings}</span>
                    {existingDataInfo.hasListings ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Leads: {existingDataInfo.counts.leads}</span>
                    {existingDataInfo.hasLeads ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <span>Testimonials: {existingDataInfo.counts.testimonials}</span>
                    {existingDataInfo.hasTestimonials ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    <span>Links: {existingDataInfo.counts.links}</span>
                    {existingDataInfo.hasLinks ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Options */}
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-semibold">Generation Options</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="listings"
                checked={includeListings}
                onCheckedChange={(checked) => setIncludeListings(checked as boolean)}
              />
              <Label htmlFor="listings" className="flex items-center gap-2 cursor-pointer">
                <Home className="h-4 w-4" />
                Generate Sample Listings (4 properties)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="leads"
                checked={includeLeads}
                onCheckedChange={(checked) => setIncludeLeads(checked as boolean)}
              />
              <Label htmlFor="leads" className="flex items-center gap-2 cursor-pointer">
                <Users className="h-4 w-4" />
                Generate Sample Leads (5 inquiries)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="testimonials"
                checked={includeTestimonials}
                onCheckedChange={(checked) => setIncludeTestimonials(checked as boolean)}
              />
              <Label htmlFor="testimonials" className="flex items-center gap-2 cursor-pointer">
                <Star className="h-4 w-4" />
                Generate Sample Testimonials (4 reviews)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="links"
                checked={includeLinks}
                onCheckedChange={(checked) => setIncludeLinks(checked as boolean)}
              />
              <Label htmlFor="links" className="flex items-center gap-2 cursor-pointer">
                <LinkIcon className="h-4 w-4" />
                Generate Sample Links (6 custom links)
              </Label>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipCheck"
                  checked={skipDuplicateCheck}
                  onCheckedChange={(checked) => setSkipDuplicateCheck(checked as boolean)}
                />
                <Label htmlFor="skipCheck" className="cursor-pointer text-sm text-muted-foreground">
                  Skip duplicate check (force add even if data exists)
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateSampleData}
          disabled={isLoading || isCheckingUser || !targetUserId}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Sample Data...
            </>
          ) : (
            <>
              <Database className="mr-2 h-5 w-5" />
              Generate Sample Data
            </>
          )}
        </Button>

        {!targetUserId && (
          <p className="text-sm text-center text-muted-foreground">
            Check a user first to enable generation
          </p>
        )}
      </CardContent>
    </Card>
  );
}
