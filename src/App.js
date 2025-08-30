import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [tableName, setTableName] = useState('');
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(
    "Digite o nome da tabela e clique em Consultar."
  );

  const fetchData = async () => {
    if (!tableName) {
      setStatus("❌ Informe o nome da tabela!");
      return;
    }

    setLoading(true);
    setData([]);
    setColumns([]);
    setStatus(`Conectando ao backend e consultando a tabela ${tableName}...`);

    try {
      const response = await fetch(`http://localhost:5000/tabela/${tableName.toUpperCase()}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro de rede: ${response.statusText}. Detalhes: ${errorText}`);
      }

      const jsonData = await response.json();

      if (jsonData.length === 0) {
        setStatus("⚠️ Nenhum dado encontrado.");
      } else {
        // Filtra colunas que são objetos complexos (LOBs, streams etc.)
        const filteredData = jsonData.map(row => {
          const newRow = {};
          Object.entries(row).forEach(([key, value]) => {
            if (
              value !== null &&
              typeof value !== 'string' &&
              typeof value !== 'number' &&
              typeof value !== 'boolean'
            ) {
              newRow[key] = '[Objeto não renderizável]';
            } else {
              newRow[key] = value;
            }
          });
          return newRow;
        });

        setData(filteredData);
        setColumns(Object.keys(filteredData[0]));
        setStatus(`✅ Consulta realizada com sucesso!`);
      }
    } catch (err) {
      console.error(err);
      if (err.message.includes("ORA-28759")) {
        setStatus(
          `❌ Erro na consulta! O backend não conseguiu acessar a pasta da wallet.`
        );
      } else {
        setStatus(`❌ Erro na consulta! Detalhes: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') fetchData();
  };

  const renderTable = () => {
    if (!data || data.length === 0) return <p>Nenhum dado encontrado.</p>;

    return (
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {columns.map((col) => (
                <th key={col} className="py-2 px-4 border-b">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="py-2 px-4 border-b">
                    {row[col] !== null ? row[col].toString() : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4 min-h-screen bg-gray-100 flex flex-col items-center">
      <div className="bg-white p-6 rounded shadow w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-2 text-center">
          Consulta Dinâmica Oracle
        </h1>
        <input
          type="text"
          placeholder="Nome da tabela"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full border p-2 rounded mb-2"
          disabled={loading}
        />
        <button
          onClick={fetchData}
          disabled={loading || tableName.trim() === ''}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Consultando...' : 'Consultar'}
        </button>

        <p className="mt-4">{status}</p>

        {data.length > 0 && renderTable()}
      </div>
    </div>
  );
};

export default App;
