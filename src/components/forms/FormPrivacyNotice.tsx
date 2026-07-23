import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FormPrivacyNoticeProps {
    /** Optional leading assurance sentence (e.g. "No spam, ever."). */
    assurance?: string;
    className?: string;
}

/**
 * Notice at the point of personal-information collection.
 *
 * Lead-capture forms gather name, email, and phone, so GDPR (Art. 13),
 * CCPA/CPRA "notice at collection", and CAN-SPAM expect a clear disclosure
 * with a link to the Privacy Policy at the moment of submission. Rendered
 * just above/below the submit button on every public lead form.
 */
export function FormPrivacyNotice({ assurance, className }: FormPrivacyNoticeProps) {
    return (
        <p
            className={cn(
                "text-xs text-center text-muted-foreground leading-relaxed",
                className
            )}
        >
            {assurance ? `${assurance} ` : ""}
            By submitting this form you agree to our{" "}
            <Link to="/terms" className="underline hover:text-foreground">
                Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-foreground">
                Privacy Policy
            </Link>
            , and consent to being contacted about your inquiry.
        </p>
    );
}
