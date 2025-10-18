import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import './DataTable.css';

// DataTable: columns (array), data (array of objects), initialPageSize
export default function DataTable({ columns = [], data = [], initialPageSize = 50, tableName = '', idColumnName = '' }) {
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(initialPageSize);
    // No internal per-column filters here: parent component (ConsultaCadastros)
    // is responsible for filtering and passes the resulting `data` prop.
    const pageCount = Math.max(1, Math.ceil((data && data.length) / pageSize));
    const page = (data || []).slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

    // Parent controls filtering; DataTable only manages pagination.

    function downloadCSV(rows) {
        if (!rows || !rows.length) return;
        const cols = columns;

        function escapeField(v) {
            if (v === null || v === undefined) return '';
            let s;
            if (typeof v === 'object') {
                try { s = JSON.stringify(v); } catch (e) { s = String(v); }
            } else {
                s = String(v);
            }
            // double quotes
            s = s.replace(/"/g, '""');
            if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) return `"${s}"`;
            return s;
        }

        const lines = [cols.map(c => escapeField(c)).join(',')];
        rows.forEach(r => {
            const vals = cols.map(c => {
                const v = r && Object.prototype.hasOwnProperty.call(r, c) ? r[c] : undefined;
                // detect lob-like objects and avoid serializing internal stream state into CSV
                if (v && typeof v === 'object' && (v._readableState || v._writableState || v._impl)) {
                    return escapeField('[LOB]');
                }
                return escapeField(v);
            });
            lines.push(vals.join(','));
        });

        // Use CRLF for Windows/Excel and prepend BOM for UTF-8 compatibility
        const csvContent = '\uFEFF' + lines.join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // sanitize filename (remove colons) for Windows
        const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
        a.download = `export_${timestamp}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // modal state for viewing large objects
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState('');

    function isLobLike(v) {
        return v && typeof v === 'object' && (v._readableState || v._writableState || v._impl);
    }

    async function openModalFor(v, row) {
        // If it's a lob-like object, try to fetch the textual content from backend
        if (isLobLike(v) && tableName && idColumnName && row && row[idColumnName] !== undefined) {
            try {
                const id = row[idColumnName];
                const field = columns.find(c => c.toUpperCase().includes('OBSERV')) || null;
                const fieldName = field || '';
                if (!fieldName) {
                    setModalContent('Campo LOB detectado, mas não foi possível resolver o nome do campo.');
                    setModalOpen(true);
                    return;
                }
                const resp = await fetch(`/api/dados/${tableName}/${id}/field/${fieldName}`);
                if (!resp.ok) throw new Error(`Status ${resp.status}`);
                const text = await resp.text();
                setModalContent(text);
                setModalOpen(true);
                return;
            } catch (e) {
                setModalContent(`Erro ao buscar conteúdo do LOB: ${e.message}`);
                setModalOpen(true);
                return;
            }
        }

        try {
            const s = typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v);
            setModalContent(s);
        } catch (e) {
            setModalContent(String(v));
        }
        setModalOpen(true);
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-600">Registros: <strong>{data ? data.length : 0}</strong></div>
                </div>
                <div className="flex items-center space-x-2">
                    <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }} className="border rounded-md p-1">
                        {[10,25,50,100].map(s => <option key={s} value={s}>{s} / página</option>)}
                    </select>
                    <button onClick={() => downloadCSV(data)} className="bg-green-600 text-white px-3 py-1 rounded-md flex items-center space-x-2 hover:bg-green-700">
                        <Download className="w-4 h-4" />
                        <span>Exportar CSV</span>
                    </button>
                </div>
            </div>

            <div className="data-table-wrapper border border-gray-200 shadow-md">
                <table className="data-table bg-white">
                    <thead className="bg-green-700 text-white sticky top-0 z-10">
                        <tr>
                            {columns.map(col => (
                                <th key={col} className="py-3 px-3 text-left text-sm font-semibold border-r border-green-600 last:border-r-0">{col}</th>
                            ))}
                        </tr>
                        {/* per-column filters removed — parent page provides global filtering controls */}
                    </thead>
                    <tbody>
                        {page.map((row, idx) => (
                            <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-green-50'} hover:bg-green-100 border-t border-gray-100`}>
                                {columns.map(col => {
                                    const raw = row[col];
                                    const display = raw === null || raw === undefined ? '' : (typeof raw === 'object' ? JSON.stringify(raw) : String(raw));
                                    if (isLobLike(raw)) {
                                        return (
                                            <td key={col} className="text-sm text-gray-800 border-r border-gray-200 last:border-r-0">
                                                <span>[LOB]</span>
                                                <button className="cell-view-btn" onClick={() => openModalFor(raw, row)}>Ver</button>
                                            </td>
                                        );
                                    }
                                    // Use title attribute to show full content on hover when truncated
                                    return <td key={col} className="text-sm text-gray-800 border-r border-gray-200 last:border-r-0" title={display}>{display}</td>;
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <div className="dt-modal-backdrop" onClick={() => setModalOpen(false)}>
                    <div className="dt-modal" onClick={(e) => e.stopPropagation()}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <strong>Visualização</strong>
                            <button onClick={() => setModalOpen(false)} className="cell-view-btn">Fechar</button>
                        </div>
                        <pre>{modalContent}</pre>
                    </div>
                </div>
            )}

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
