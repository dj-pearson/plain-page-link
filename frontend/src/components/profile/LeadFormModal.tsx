import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
    ContactForm,
    BuyerInquiryForm,
    SellerInquiryForm,
    HomeValuationForm,
} from "@/components/forms";

export type LeadFormType = "contact" | "buyer" | "seller" | "valuation";

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    formType: LeadFormType;
    agentId: string;
    agentName: string;
}

export function LeadFormModal({
    isOpen,
    onClose,
    formType,
    agentId,
    agentName,
}: LeadFormModalProps) {
    const renderForm = () => {
        switch (formType) {
            case "contact":
                return (
                    <ContactForm
                        agentId={agentId}
                        agentName={agentName}
                        onSuccess={onClose}
                    />
                );
            case "buyer":
                return (
                    <BuyerInquiryForm
                        agentId={agentId}
                        agentName={agentName}
                        onSuccess={onClose}
                    />
                );
            case "seller":
                return (
                    <SellerInquiryForm
                        agentId={agentId}
                        agentName={agentName}
                        onSuccess={onClose}
                    />
                );
            case "valuation":
                return (
                    <HomeValuationForm
                        agentId={agentId}
                        agentName={agentName}
                        onSuccess={onClose}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                {renderForm()}
            </DialogContent>
        </Dialog>
    );
}
