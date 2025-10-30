import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, Mail, Phone, User } from "lucide-react";
import type { Lead } from "@/types/lead";
import { formatRelativeTime } from "@/lib/format";

interface LeadsTableProps {
    leads: Lead[];
    onLeadClick?: (lead: Lead) => void;
}

type SortField = "created_at" | "name" | "lead_type" | "status";
type SortOrder = "asc" | "desc";

export function LeadsTable({ leads, onLeadClick }: LeadsTableProps) {
    const [sortField, setSortField] = useState<SortField>("created_at");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("desc");
        }
    };

    const sortedLeads = [...leads].sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
            case "created_at":
                comparison =
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime();
                break;
            case "name":
                comparison = a.name.localeCompare(b.name);
                break;
            case "lead_type":
                comparison = a.lead_type.localeCompare(b.lead_type);
                break;
            case "status":
                comparison = a.status.localeCompare(b.status);
                break;
        }

        return sortOrder === "asc" ? comparison : -comparison;
    });

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortOrder === "asc" ? (
            <ChevronUp className="inline w-4 h-4 ml-1" />
        ) : (
            <ChevronDown className="inline w-4 h-4 ml-1" />
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "new":
                return "bg-blue-100 text-blue-800";
            case "contacted":
                return "bg-yellow-100 text-yellow-800";
            case "qualified":
                return "bg-green-100 text-green-800";
            case "converted":
                return "bg-purple-100 text-purple-800";
            case "lost":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getLeadTypeLabel = (type: string) => {
        switch (type) {
            case "buyer":
                return "Buyer";
            case "seller":
                return "Seller";
            case "valuation":
                return "Valuation";
            case "contact":
                return "Contact";
            default:
                return type;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>
                    Your latest lead submissions ({leads.length} total)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSort("name")}
                                        className="hover:bg-transparent"
                                    >
                                        <User className="w-4 h-4 mr-2" />
                                        Name
                                        <SortIcon field="name" />
                                    </Button>
                                </TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSort("lead_type")}
                                        className="hover:bg-transparent"
                                    >
                                        Type
                                        <SortIcon field="lead_type" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSort("status")}
                                        className="hover:bg-transparent"
                                    >
                                        Status
                                        <SortIcon field="status" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSort("created_at")}
                                        className="hover:bg-transparent"
                                    >
                                        Date
                                        <SortIcon field="created_at" />
                                    </Button>
                                </TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedLeads.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center text-muted-foreground py-8"
                                    >
                                        No leads yet. They'll appear here when
                                        visitors submit forms.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedLeads.map((lead) => (
                                    <TableRow
                                        key={lead.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => onLeadClick?.(lead)}
                                    >
                                        <TableCell className="font-medium">
                                            {lead.name}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm">
                                                <a
                                                    href={`mailto:${lead.email}`}
                                                    className="flex items-center text-blue-600 hover:underline"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <Mail className="w-3 h-3 mr-1" />
                                                    {lead.email}
                                                </a>
                                                {lead.phone && (
                                                    <a
                                                        href={`tel:${lead.phone}`}
                                                        className="flex items-center text-blue-600 hover:underline"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <Phone className="w-3 h-3 mr-1" />
                                                        {lead.phone}
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {getLeadTypeLabel(
                                                    lead.lead_type
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={getStatusColor(
                                                    lead.status
                                                )}
                                            >
                                                {lead.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatRelativeTime(
                                                lead.created_at
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onLeadClick?.(lead);
                                                }}
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
