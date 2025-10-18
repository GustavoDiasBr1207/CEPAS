import React, { useState } from 'react';
import { Search, Loader } from 'lucide-react';
import * as consultaService from '../services/consultaService';
import DataTable from '../components/DataTable';

const allowedTables = ['Monitor', 'Area', 'Familia', 'Entrevista', 'Membro', 'Endereco', 'Animal', 'EstruturaHabitacao', 'RecursoSaneamento', 'EntrevistaMonitor', 'SaudeMembro', 'CriancaCepas'];

const ConsultaCadastros = ({ setPage }) => {
    const [table, setTable] = useState('Familia');
    const [id, setId] = useState('');
    const [data, setData] = useState(null);
    const [columns, setColumns] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [filters, setFilters] = useState({}); // { columnName: filterString }
    const [globalFilter, setGlobalFilter] = useState('');
    const [filteredData, setFilteredData] = useState(null);
    const [loading, setLoading] = useState(false); // retained for compatibility
    const [status, setStatus] = useState('Selecione uma tabela e clique em Consultar');

    const fetchTable = async () => {
        if (!table) return;
        if (!allowedTables.includes(table)) {
            setStatus('Tabela não permitida.');
            return;
        }
        setLoading(true);
        setStatus(`Consultando ${table}...`);
        setData(null);
        try {
            let result;
            if (id && id.toString().trim() !== '') {
                result = await consultaService.getRecord(table, id);
                setData(result);
                setColumns(Object.keys(result));
                setStatus('Registro encontrado');
            } else {
                result = await consultaService.getTable(table);
                setData(result);
                    if (Array.isArray(result) && result.length > 0) setColumns(Object.keys(result[0]));
                setStatus(`Foram encontrados ${Array.isArray(result) ? result.length : 1} registros.`);
                setHasSearched(true);
                    // Reset filters quando uma nova tabela for carregada
                    setFilters({});
                    setFilteredData(null);
            }
        } catch (err) {
            console.error(err);
            setStatus(`Erro: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (!Array.isArray(data)) return;
        const q = (globalFilter || '').toString().trim().toLowerCase();
        if (!q) { setFilteredData(null); return; }

        const result = data.filter(row => {
            // search across all values of the row
            return Object.values(row).some(v => {
                if (v === null || v === undefined) return false;
                try {
                    const s = (typeof v === 'object') ? JSON.stringify(v) : String(v);
                    return s.toLowerCase().includes(q);
                } catch (e) { return false; }
            });
        });
        setFilteredData(result);
    };

    const clearFilters = () => {
        setFilters({});
        setGlobalFilter('');
        setFilteredData(null);
    };

    const renderTable = () => {
        if (!data) return null;
        const source = Array.isArray(filteredData) ? filteredData : data;
            if (Array.isArray(source)) {
            if (source.length === 0) return <p>Nenhum registro encontrado.</p>;
            if (source.length > 10000) return <p className="text-yellow-600">Aviso: muitos registros ({source.length}). Considere filtrar por coluna ou usar paginação.</p>;
            const idCol = `ID_${table.toUpperCase()}`;
            return <DataTable columns={columns} data={source} initialPageSize={50} tableName={table} idColumnName={idCol} />;
        }

        // registro único
        return (
            <div className="mt-6 bg-white p-4 rounded-xl shadow">
                {Object.entries(data).map(([k,v]) => (
                    <div key={k} className="mb-2">
                        <strong className="text-gray-700">{k}:</strong> <span className="text-gray-800">{v !== null ? v.toString() : ''}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="page-wrapper font-sans">
            <div className="card transition-all duration-300">
                <h1 className="page-title mb-4 justify-center">
                    <Search className="h-8 w-8 text-green-600" />
                    <span>Consulta de Cadastros</span>
                </h1>

                <p className="text-center muted mb-6">Consulte registros por tabela ou por ID. O layout segue o estilo do Cadastro de Família.</p>

                <div className="spaced-row mb-4">
                    <select value={table} onChange={(e) => setTable(e.target.value)} className="flex-grow form-input text-lg">
                        {allowedTables.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <input type="text" placeholder="ID (opcional)" value={id} onChange={(e) => setId(e.target.value)} className="w-36 form-input" />

                    <button onClick={fetchTable} disabled={loading} className="primary-btn flex items-center justify-center text-lg">
                        {loading ? (
                            <>
                                <Loader className="h-5 w-5 mr-2 animate-spin" />
                                Consultando...
                            </>
                        ) : (
                            <>
                                <Search className="h-5 w-5 mr-2" />
                                Consultar
                            </>
                        )}
                    </button>
                </div>

                {hasSearched && (
                    <div>
                        <div className="flex items-center space-x-3 mt-3">
                            <input placeholder="Filtro geral..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="form-input flex-grow" />
                            <button onClick={applyFilters} className="primary-btn" disabled={columns.length === 0}>Aplicar filtros</button>
                            <button onClick={clearFilters} className="primary-btn" disabled={columns.length === 0}>Limpar filtros</button>
                        </div>
                        {columns.length === 0 && (
                            <p className="text-sm text-gray-500 mt-2">Nenhum filtro disponível para esta tabela.</p>
                        )}
                    </div>
                )}

                <p className="mt-2 text-sm text-gray-500">Status: {status}</p>

                

                {renderTable()}

                <div className="mt-6 flex justify-between">
                    <button onClick={() => setPage('home')} className="px-6 py-2 rounded-lg bg-gray-200">Voltar</button>
                </div>
            </div>
        </div>
    );
};

export default ConsultaCadastros;
