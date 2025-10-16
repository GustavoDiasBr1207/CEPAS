import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';

// DataTable: columns (array), data (array of objects), initialPageSize
export default function DataTable({ columns = [], data = [], initialPageSize = 50 }) {
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [filters, setFilters] = useState({});

    const filtered = useMemo(() => {
        const active = Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v.toString().trim() !== '');
        if (!active.length) return data;
        return data.filter(row => {
            return active.every(([col, expr]) => {
                const raw = row[col];
                if (raw === null || raw === undefined) return false;
                const s = expr.toString().trim();

                // Numeric operator support
                if (/^[<>]=?\s*[-+]?[0-9]+(\.[0-9]+)?$/.test(s)) {
                    const m = s.match(/^([<>]=?)\s*([-+]?[0-9]+(?:\.[0-9]+)?)$/);
                    if (!m) return false;
                    const op = m[1];
                    const num = parseFloat(m[2]);
                    const val = parseFloat(raw);
                    if (Number.isNaN(val)) return false;
                    if (op === '>') return val > num;
                    if (op === '>=') return val >= num;
                    if (op === '<') return val < num;
                    if (op === '<=') return val <= num;
                    return false;
                }

                if (/^=\s*[-+]?[0-9]+(\.[0-9]+)?$/.test(s)) {
                    const num = parseFloat(s.replace('=', '').trim());
                    const val = parseFloat(raw);
                    return !Number.isNaN(val) && val === num;
                }

                return raw.toString().toLowerCase().includes(s.toLowerCase());
            });
        });
    }, [data, filters]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

    const setFilter = (col, value) => {
        setPageIndex(0);
        setFilters(prev => ({ ...prev, [col]: value }));
    };

    const clearFilters = () => {
        setFilters({});
        setPageIndex(0);
    };

    function downloadCSV(rows) {
        if (!rows || !rows.length) return;
        const cols = columns;
        const lines = [cols.join(',')];
        rows.forEach(r => {
            const vals = cols.map(c => {
                const v = r[c];
                if (v === null || v === undefined) return '';
                const s = v.toString().replace(/"/g, '""');
                if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s}"`;
                return s;
            });
            lines.push(vals.join(','));
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_${new Date().toISOString().slice(0,19)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-600">Registros: <strong>{filtered.length}</strong></div>
                    <div className="text-sm text-gray-500">Filtros ativos: <strong>{Object.values(filters).filter(v => v && v.toString().trim() !== '').length}</strong></div>
                </div>
                <div className="flex items-center space-x-2">
                    <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }} className="border rounded-md p-1">
                        {[10,25,50,100].map(s => <option key={s} value={s}>{s} / página</option>)}
                    </select>
                    <button onClick={() => downloadCSV(filtered)} className="bg-green-600 text-white px-3 py-1 rounded-md flex items-center space-x-2 hover:bg-green-700">
                        <Download className="w-4 h-4" />
                        <span>Exportar CSV</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-md">
                <table className="min-w-full bg-white border-collapse">
                    <thead className="bg-green-700 text-white sticky top-0 z-10">
                        <tr>
                            {columns.map(col => (
                                <th key={col} className="py-3 px-4 text-left text-sm font-semibold border-r border-green-600 last:border-r-0">{col}</th>
                            ))}
                        </tr>
                        <tr className="bg-green-100 text-green-900 sticky top-12">
                            {columns.map(col => (
                                <th key={col + '-f'} className="py-2 px-3 text-left text-sm border-r border-green-200 last:border-r-0">
                                    <input value={filters[col] || ''} onChange={(e) => setFilter(col, e.target.value)} placeholder="filtrar..." className="w-full p-2 rounded-md border border-green-200 text-sm" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {page.map((row, idx) => (
                            <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-green-50'} hover:bg-green-100 border-t border-gray-100`}>
                                {columns.map(col => (
                                    <td key={col} className="py-3 px-4 text-sm text-gray-800 border-r border-gray-200 last:border-r-0 whitespace-nowrap">{row[col] !== null && row[col] !== undefined ? row[col].toString() : ''}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-3">
                <div className="space-x-2">
                    <button onClick={() => { setPageIndex(0); }} disabled={pageIndex === 0} className="px-3 py-1 bg-gray-100 rounded-md">Primeira</button>
                    <button onClick={() => setPageIndex(p => Math.max(0, p-1))} disabled={pageIndex === 0} className="px-3 py-1 bg-gray-100 rounded-md">Anterior</button>
                    <button onClick={() => setPageIndex(p => Math.min(pageCount-1, p+1))} disabled={pageIndex >= pageCount-1} className="px-3 py-1 bg-gray-100 rounded-md">Próxima</button>
                    <button onClick={() => setPageIndex(pageCount-1)} disabled={pageIndex >= pageCount-1} className="px-3 py-1 bg-gray-100 rounded-md">Última</button>
                </div>

                <div className="text-sm text-gray-600">Página <strong>{pageIndex+1}</strong> de <strong>{pageCount}</strong></div>
            </div>
        </div>
    );
}
