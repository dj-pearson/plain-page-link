import { LinkStackLink, PREDEFINED_LINKS } from "@/types/linkstack";
import { ExternalLink, Phone, Mail, Download } from "lucide-react";

interface LinkStackBlocksProps {
    links: LinkStackLink[];
    onLinkClick?: (link: LinkStackLink) => void;
}

export default function LinkStackBlocks({
    links,
    onLinkClick,
}: LinkStackBlocksProps) {
    // Filter to only show active links, sorted by order
    const activeLinks = links
        .filter((link) => link.up_link === "yes")
        .sort((a, b) => a.order - b.order);

    if (activeLinks.length === 0) {
        return null;
    }

    const handleClick = (link: LinkStackLink) => {
        // Track click
        if (onLinkClick) {
            onLinkClick(link);
        }

        // For actual navigation, the browser will handle the <a> tag
    };

    const renderBlock = (link: LinkStackLink) => {
        switch (link.type) {
            case "spacer":
                return (
                    <div
                        key={link.id}
                        className="w-full"
                        style={{ height: "32px" }}
                    />
                );

            case "heading":
                return (
                    <div key={link.id} className="w-full text-center py-2">
                        <h3 className="text-2xl font-bold text-gray-900">
                            {link.title}
                        </h3>
                    </div>
                );

            case "text":
                return (
                    <div
                        key={link.id}
                        className="w-full text-center py-2 px-4"
                    >
                        <p className="text-gray-600">{link.title}</p>
                    </div>
                );

            case "link":
                return (
                    <a
                        key={link.id}
                        href={link.link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleClick(link)}
                        className="block w-full bg-white hover:bg-gray-50 border-2 border-gray-900 rounded-lg px-6 py-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={
                            link.custom_css
                                ? { cssText: link.custom_css }
                                : undefined
                        }
                    >
                        <div className="flex items-center justify-center gap-3">
                            {link.custom_icon && (
                                <i className={link.custom_icon}></i>
                            )}
                            <span className="font-semibold text-gray-900">
                                {link.title}
                            </span>
                            <ExternalLink className="w-4 h-4 text-gray-600" />
                        </div>
                    </a>
                );

            case "predefined":
                const serviceName = link.type_params?.service_name;
                const platform = serviceName
                    ? PREDEFINED_LINKS[serviceName]
                    : null;
                const url = link.link || "#";

                return (
                    <a
                        key={link.id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleClick(link)}
                        className="block w-full hover:opacity-90 rounded-lg px-6 py-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                            backgroundColor: platform?.color || "#000000",
                            color: "#ffffff",
                        }}
                    >
                        <div className="flex items-center justify-center gap-3">
                            {platform?.icon && (
                                <i className={platform.icon}></i>
                            )}
                            <span className="font-semibold">
                                {platform?.title || link.title}
                            </span>
                        </div>
                    </a>
                );

            case "telephone":
                return (
                    <a
                        key={link.id}
                        href={link.link || "#"}
                        onClick={() => handleClick(link)}
                        className="block w-full bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <Phone className="w-5 h-5" />
                            <span className="font-semibold">
                                {link.title || "Call Me"}
                            </span>
                        </div>
                    </a>
                );

            case "email":
                return (
                    <a
                        key={link.id}
                        href={link.link || "#"}
                        onClick={() => handleClick(link)}
                        className="block w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <Mail className="w-5 h-5" />
                            <span className="font-semibold">
                                {link.title || "Email Me"}
                            </span>
                        </div>
                    </a>
                );

            case "vcard":
                return (
                    <a
                        key={link.id}
                        href={link.link || "#"}
                        onClick={() => handleClick(link)}
                        download
                        className="block w-full bg-gray-800 hover:bg-gray-900 text-white rounded-lg px-6 py-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <Download className="w-5 h-5" />
                            <span className="font-semibold">
                                {link.title || "Save Contact"}
                            </span>
                        </div>
                    </a>
                );

            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-3 py-6">
            <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                    More Links
                </h2>
            </div>
            {activeLinks.map((link) => renderBlock(link))}
        </div>
    );
}

