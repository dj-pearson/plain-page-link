import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Plus, ExternalLink, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

export function ProfileDisplaySettings() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [activePage, setActivePage] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadActivePage();
    }, [user]);

    const loadActivePage = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('custom_pages')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .single();

            if (!error && data) {
                setActivePage(data);
            }
        } catch (error) {
            console.error('Error loading active page:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        if (!activePage) return;

        try {
            const { error } = await supabase
                .from('custom_pages')
                .update({ is_active: false })
                .eq('id', activePage.id);

            if (error) throw error;

            toast.success('Switched to default profile');
            setActivePage(null);
        } catch (error) {
            console.error('Error deactivating page:', error);
            toast.error('Failed to deactivate custom page');
        }
    };

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold mb-1">Profile Display</h3>
                    <p className="text-sm text-muted-foreground">
                        Choose what visitors see when they visit your profile
                    </p>
                </div>

                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                ) : activePage ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Globe className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{activePage.title}</span>
                                    <Badge variant="default" className="gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Active
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Custom page: /{activePage.slug}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                            >
                                <a
                                    href={`/p/${activePage.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="gap-2"
                                >
                                    View
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/dashboard/page-builder')}
                                className="gap-2"
                            >
                                Edit Custom Page
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDeactivate}
                            >
                                Use Default Profile
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <span className="font-medium">Default Profile</span>
                                <Badge variant="secondary">Active</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Using the standard profile layout with listings, testimonials, and links
                            </p>
                        </div>

                        <Button
                            onClick={() => navigate('/dashboard/page-builder')}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create Custom Page
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}
