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
import { logger } from "@/lib/logger";

export function SampleDataManager() {
  const { user } = useAuthStore();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [resolvedUserId, setResolvedUserId] = useState("");
  const [resolvedUserInfo, setResolvedUserInfo] = useState<{ email?: string; username?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [existingDataInfo, setExistingDataInfo] = useState<any>(null);
  
  // Options for what to include
  const [includeListings, setIncludeListings] = useState(true);
  const [includeLeads, setIncludeLeads] = useState(true);
  const [includeTestimonials, setIncludeTestimonials] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false);

  /**
   * Lookup user by email or username and resolve to UUID
   */
  const lookupUser = async (identifier: string): Promise<{ id: string; email?: string; username?: string } | null> => {
    logger.info('Looking up user', { identifier });

    try {
      // Try looking up by username first (profiles table)
      const { data: profileByUsername, error: usernameError } = await supabase
        .from('profiles')
        .select('id, username, email_display')
        .eq('username', identifier)
        .maybeSingle();

      if (profileByUsername) {
        logger.info('Found user by username', { id: profileByUsername.id, username: profileByUsername.username });
        return {
          id: profileByUsername.id,
          username: profileByUsername.username,
          email: profileByUsername.email_display || undefined
        };
      }

      // Try looking up by email_display (profiles table)
      const { data: profileByEmail, error: emailError } = await supabase
        .from('profiles')
        .select('id, username, email_display')
        .eq('email_display', identifier)
        .maybeSingle();

      if (profileByEmail) {
        logger.info('Found user by email_display', { id: profileByEmail.id, email: profileByEmail.email_display });
        return {
          id: profileByEmail.id,
          username: profileByEmail.username,
          email: profileByEmail.email_display || undefined
        };
      }

      logger.warn('User not found in profiles table', { identifier, usernameError, emailError });
      return null;
    } catch (error) {
      logger.error('Error looking up user', { identifier, error });
      throw error;
    }
  };

  const handleCheckUser = async () => {
    if (!emailOrUsername.trim()) {
      toast.error("Please enter a user email or username");
      return;
    }

    setIsCheckingUser(true);
    setExistingDataInfo(null);
    setResolvedUserId("");
    setResolvedUserInfo(null);

    try {
      logger.info('Starting user lookup', { emailOrUsername });

      const userInfo = await lookupUser(emailOrUsername.trim());
      
      if (!userInfo) {
        logger.warn('User not found', { emailOrUsername });
        toast.error(`User not found: ${emailOrUsername}`);
        return;
      }

      logger.info('User found, checking existing data', { userId: userInfo.id });
      setResolvedUserId(userInfo.id);
      setResolvedUserInfo(userInfo);

      // Check existing data
      const existingData = await checkExistingData(userInfo.id);
      setExistingDataInfo(existingData);
      
      logger.info('User data checked successfully', { userId: userInfo.id, existingData });
      toast.success(`Found user: ${userInfo.username || userInfo.email}`);
    } catch (error: any) {
      logger.error('Error checking user', { emailOrUsername, error });
      toast.error(error.message || "Failed to check user data");
    } finally {
      setIsCheckingUser(false);
    }
  };


  const handleGenerateSampleData = async () => {
    if (!resolvedUserId) {
      toast.error("Please check a user first");
      return;
    }

    setIsLoading(true);
    logger.info('Starting sample data generation', { 
      userId: resolvedUserId, 
      options: { includeListings, includeLeads, includeTestimonials, includeLinks, skipDuplicateCheck }
    });

    try {
      const counts = await generateSampleData(resolvedUserId, {
        includeListings,
        includeLeads,
        includeTestimonials,
        includeLinks,
        skipDuplicateCheck,
      });

      logger.info('Sample data generated successfully', { userId: resolvedUserId, counts });

      // Refresh existing data check
      const existingData = await checkExistingData(resolvedUserId);
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
      logger.error('Error generating sample data', { 
        userId: resolvedUserId, 
        message: error?.message,
        stack: error?.stack 
      });
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

    setIsLoading(true);
    logger.info('Adding sample data to current user', { userId: user.id });

    try {
      // Set resolved info
      setResolvedUserId(user.id);
      setResolvedUserInfo({ email: user.email, username: user.user_metadata?.username });
      
      // Check existing data first
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

      logger.info('Sample data added to current user', { userId: user.id, counts });

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
      logger.error('Error adding sample data to self', { 
        userId: user?.id, 
        message: error?.message,
        stack: error?.stack 
      });
      toast.error(error.message || "Failed to add sample data");
    } finally {
      setIsLoading(false);
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
          <div className="space-y-2">
            <Label htmlFor="emailOrUsername">User Email or Username</Label>
            <Input
              id="emailOrUsername"
              placeholder="username or user@example.com"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCheckUser();
                }
              }}
            />
            <p className="text-sm text-muted-foreground">
              Enter a username (e.g. "johnsmith") or email address to look up the user
            </p>
          </div>

          {resolvedUserInfo && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>User Found:</strong> {resolvedUserInfo.username || resolvedUserInfo.email}
                {resolvedUserInfo.email && resolvedUserInfo.username && (
                  <span className="text-sm text-green-700"> ({resolvedUserInfo.email})</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleCheckUser}
            disabled={isCheckingUser || isLoading || !emailOrUsername.trim()}
            variant="outline"
            className="w-full"
          >
            {isCheckingUser ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Looking up user...
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
          disabled={isLoading || isCheckingUser || !resolvedUserId}
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

        {!resolvedUserId && (
          <p className="text-sm text-center text-muted-foreground">
            Check a user first to enable generation
          </p>
        )}
      </CardContent>
    </Card>
  );
}
