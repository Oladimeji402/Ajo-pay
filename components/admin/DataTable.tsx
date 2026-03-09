'use client';

import React from 'react';

export type DataTableColumn<T> = {
    key: string;
    header: React.ReactNode;
    render: (row: T) => React.ReactNode;
    className?: string;
    headerClassName?: string;
};

type DataTableProps<T> = {
    rows: T[];
    columns: Array<DataTableColumn<T>>;
    rowKey: (row: T) => string;
    rowClassName?: (row: T) => string;
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
};

export function DataTable<T>({
    rows,
    columns,
    rowKey,
    rowClassName,
    loading = false,
    emptyMessage = 'No records found.',
    className = '',
}: DataTableProps<T>) {
    return (
        <div className={`overflow-x-auto rounded-2xl border border-slate-100 bg-white ${className}`.trim()}>
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left">
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key} className={`px-4 py-3 font-semibold text-brand-navy ${column.headerClassName ?? ''}`.trim()}>
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-6 text-sm text-slate-500">
                                Loading...
                            </td>
                        </tr>
                    ) : null}

                    {!loading && rows.map((row) => (
                        <tr key={rowKey(row)} className={rowClassName ? rowClassName(row) : ''}>
                            {columns.map((column) => (
                                <td key={column.key} className={`px-4 py-3 ${column.className ?? ''}`.trim()}>
                                    {column.render(row)}
                                </td>
                            ))}
                        </tr>
                    ))}

                    {!loading && rows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-6 text-sm text-slate-500">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : null}
                </tbody>
            </table>
        </div>
    );
}
