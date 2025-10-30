import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, DollarSign, TrendingUp, Mail } from "lucide-react";
import { LeadFormModal, LeadFormType } from "./LeadFormModal";

interface LeadCaptureCTAProps {
    agentId: string;
    agentName: string;
}

export function LeadCaptureCTA({ agentId, agentName }: LeadCaptureCTAProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeForm, setActiveForm] = useState<LeadFormType>("contact");

    const openForm = (formType: LeadFormType) => {
        setActiveForm(formType);
        setIsModalOpen(true);
    };

    return (
        <>
            <section className="w-full max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-3">
                        How Can I Help You?
                    </h2>
                    <p className="text-muted-foreground">
                        Choose the option that best fits your needs
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Buyer CTA */}
                    <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                    <Home className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">
                                        Looking to Buy?
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Find your dream home with personalized
                                        search assistance
                                    </p>
                                </div>
                                <Button
                                    onClick={() => openForm("buyer")}
                                    className="w-full"
                                    size="lg"
                                >
                                    <Home className="mr-2 h-4 w-4" />
                                    Start Home Search
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Seller CTA */}
                    <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                    <DollarSign className="w-8 h-8 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">
                                        Ready to Sell?
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Get a competitive market analysis and
                                        selling strategy
                                    </p>
                                </div>
                                <Button
                                    onClick={() => openForm("seller")}
                                    className="w-full"
                                    size="lg"
                                    variant="outline"
                                >
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    List My Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Valuation CTA */}
                    <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                    <TrendingUp className="w-8 h-8 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">
                                        What's It Worth?
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Get a free home valuation report with
                                        market insights
                                    </p>
                                </div>
                                <Button
                                    onClick={() => openForm("valuation")}
                                    className="w-full"
                                    size="lg"
                                    variant="outline"
                                >
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Free Valuation
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact CTA */}
                    <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                                    <Mail className="w-8 h-8 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">
                                        Just Have Questions?
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Send a message and I'll get back to you
                                        right away
                                    </p>
                                </div>
                                <Button
                                    onClick={() => openForm("contact")}
                                    className="w-full"
                                    size="lg"
                                    variant="outline"
                                >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Message
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <LeadFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                formType={activeForm}
                agentId={agentId}
                agentName={agentName}
            />
        </>
    );
}
