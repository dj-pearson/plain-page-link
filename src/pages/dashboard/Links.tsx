import LinkManager from "@/components/dashboard/LinkManager";

export default function Links() {
    // TODO: Get actual user ID from auth context
    const userId = 1; // Temporary hardcoded value

    return <LinkManager userId={userId} />;
}
