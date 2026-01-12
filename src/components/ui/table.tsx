import * as React from "react";
import { cn } from "@/lib/utils";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
    /**
     * Accessible label for the table
     * Required for complex tables or when caption is not provided
     */
    "aria-label"?: string;
    /**
     * ID of element that describes the table
     */
    "aria-describedby"?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
    ({ className, ...props }, ref) => (
        <div className="relative w-full overflow-auto" role="region" aria-label="Scrollable table">
            <table
                ref={ref}
                className={cn("w-full caption-bottom text-sm", className)}
                {...props}
            />
        </div>
    )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn("[&_tr:last-child]:border-0", className)}
        {...props}
    />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tfoot
        ref={ref}
        className={cn(
            "border-t bg-gray-100/50 font-medium [&>tr]:last:border-b-0",
            className
        )}
        {...props}
    />
));
TableFooter.displayName = "TableFooter";

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    /**
     * Whether this row is selected
     */
    "data-state"?: "selected" | undefined;
    /**
     * Accessible label for row if needed
     */
    "aria-label"?: string;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
    ({ className, ...props }, ref) => (
        <tr
            ref={ref}
            className={cn(
                "border-b transition-colors hover:bg-gray-100/50 data-[state=selected]:bg-gray-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
                className
            )}
            {...props}
        />
    )
);
TableRow.displayName = "TableRow";

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    /**
     * Scope of the header cell
     * - "col": Header for a column
     * - "row": Header for a row
     * - "colgroup": Header for a group of columns
     * - "rowgroup": Header for a group of rows
     * @default "col"
     */
    scope?: "col" | "row" | "colgroup" | "rowgroup";
    /**
     * Sort direction for sortable columns
     */
    "aria-sort"?: "ascending" | "descending" | "none" | "other";
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
    ({ className, scope = "col", ...props }, ref) => (
        <th
            ref={ref}
            scope={scope}
            className={cn(
                "h-12 px-4 text-left align-middle font-medium text-gray-500",
                "[&:has([role=checkbox])]:pr-0",
                // Add focus styles for interactive headers (sortable)
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
                className
            )}
            {...props}
        />
    )
);
TableHead.displayName = "TableHead";

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    /**
     * Headers IDs this cell is associated with
     * For complex tables where header association isn't obvious
     */
    headers?: string;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
    ({ className, ...props }, ref) => (
        <td
            ref={ref}
            className={cn(
                "p-4 align-middle [&:has([role=checkbox])]:pr-0",
                className
            )}
            {...props}
        />
    )
);
TableCell.displayName = "TableCell";

interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
    /**
     * Position of caption
     * @default "bottom"
     */
    position?: "top" | "bottom";
}

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
    ({ className, position = "bottom", ...props }, ref) => (
        <caption
            ref={ref}
            className={cn(
                "text-sm text-gray-500",
                position === "bottom" ? "caption-bottom mt-4" : "caption-top mb-4",
                className
            )}
            {...props}
        />
    )
);
TableCaption.displayName = "TableCaption";

/**
 * TableRowHeader Component
 *
 * A specialized table cell for row headers.
 * Use this for the first cell in a row when it serves as a header for that row.
 *
 * @example
 * <TableRow>
 *   <TableRowHeader>Product Name</TableRowHeader>
 *   <TableCell>$19.99</TableCell>
 *   <TableCell>In Stock</TableCell>
 * </TableRow>
 */
const TableRowHeader = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        scope="row"
        className={cn(
            "p-4 align-middle font-medium text-gray-900",
            "[&:has([role=checkbox])]:pr-0",
            className
        )}
        {...props}
    />
));
TableRowHeader.displayName = "TableRowHeader";

/**
 * SortableTableHead Component
 *
 * An accessible sortable column header with proper ARIA attributes.
 *
 * @example
 * <SortableTableHead
 *   sortDirection={sortConfig.key === 'name' ? sortConfig.direction : undefined}
 *   onSort={() => handleSort('name')}
 * >
 *   Name
 * </SortableTableHead>
 */
interface SortableTableHeadProps extends Omit<TableHeadProps, "onClick"> {
    /** Current sort direction, undefined if not sorted by this column */
    sortDirection?: "ascending" | "descending";
    /** Callback when header is clicked to sort */
    onSort: () => void;
    /** Whether sorting is currently loading */
    isSorting?: boolean;
}

const SortableTableHead = React.forwardRef<HTMLTableCellElement, SortableTableHeadProps>(
    ({ className, sortDirection, onSort, isSorting, children, ...props }, ref) => {
        const ariaSort = sortDirection ?? "none";

        return (
            <TableHead
                ref={ref}
                className={cn(
                    "cursor-pointer select-none",
                    "hover:bg-gray-100/50",
                    className
                )}
                aria-sort={ariaSort}
                onClick={onSort}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSort();
                    }
                }}
                tabIndex={0}
                role="columnheader"
                {...props}
            >
                <span className="flex items-center gap-1">
                    {children}
                    <span className="inline-flex flex-col" aria-hidden="true">
                        {isSorting ? (
                            <span className="animate-spin text-gray-400">⟳</span>
                        ) : (
                            <>
                                <span className={cn(
                                    "text-[10px] leading-none",
                                    sortDirection === "ascending" ? "text-blue-600" : "text-gray-300"
                                )}>
                                    ▲
                                </span>
                                <span className={cn(
                                    "text-[10px] leading-none -mt-1",
                                    sortDirection === "descending" ? "text-blue-600" : "text-gray-300"
                                )}>
                                    ▼
                                </span>
                            </>
                        )}
                    </span>
                    <span className="sr-only">
                        {sortDirection === "ascending"
                            ? ", sorted ascending"
                            : sortDirection === "descending"
                            ? ", sorted descending"
                            : ", click to sort"}
                    </span>
                </span>
            </TableHead>
        );
    }
);
SortableTableHead.displayName = "SortableTableHead";

/**
 * EmptyTableRow Component
 *
 * A row to display when the table has no data.
 *
 * @example
 * <TableBody>
 *   {data.length === 0 ? (
 *     <EmptyTableRow colSpan={5}>No results found</EmptyTableRow>
 *   ) : (
 *     data.map(item => <TableRow key={item.id}>...</TableRow>)
 *   )}
 * </TableBody>
 */
interface EmptyTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    /** Number of columns to span */
    colSpan: number;
}

const EmptyTableRow = React.forwardRef<HTMLTableRowElement, EmptyTableRowProps>(
    ({ colSpan, children, className, ...props }, ref) => (
        <TableRow ref={ref} className={className} {...props}>
            <TableCell
                colSpan={colSpan}
                className="h-24 text-center text-gray-500"
            >
                {children ?? "No data available"}
            </TableCell>
        </TableRow>
    )
);
EmptyTableRow.displayName = "EmptyTableRow";

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
    TableRowHeader,
    SortableTableHead,
    EmptyTableRow,
};
