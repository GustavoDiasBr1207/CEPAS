import React, { useState } from 'react';

/**
 * Componente Consulta
 * Permite ao usuário digitar o nome de qualquer tabela (ex: Familia, Monitor) 
 * e executa a consulta usando a rota genérica do backend: /api/dados/:tableName
 */
const Consulta = () => {
  const [tableName, setTableName] = useState('');
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(
    "Digite o nome da tabela (ex: Familia) e clique em Consultar."
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
      // Rota CORRIGIDA para /api/dados/!
      const url = `http://localhost:3001/api/dados/${tableName.toUpperCase()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        // Tenta ler o erro detalhado do backend
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

      const jsonData = await response.json();

      if (jsonData.length === 0) {
        setStatus("⚠️ Nenhum dado encontrado.");
      } else {
        // Filtra dados complexos para evitar erros de renderização
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
        setStatus(`✅ Consulta realizada com sucesso! ${filteredData.length} registros encontrados.`);
      }
    } catch (err) {
      console.error(err);
      // Tratamento de erro mais amigável
      setStatus(`❌ Erro na consulta! Verifique o nome da tabela e o status do backend. Detalhes: ${err.message}`);
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
      <div className="overflow-x-auto mt-6 shadow-lg rounded-lg">
        <table className="min-w-full bg-white border-collapse">
          <thead className="bg-blue-600 text-white">
            <tr>
              {columns.map((col) => (
                <th key={col} className="py-3 px-4 text-left font-semibold uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className={`border-b border-gray-200 ${rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-100 transition duration-150`}>
                {columns.map((col) => (
                  <td key={col} className="py-3 px-4 whitespace-nowrap text-gray-700">
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
    <div className="p-4 bg-gray-100 flex flex-col items-center">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl">
        <h1 className="text-3xl font-extrabold mb-4 text-center text-blue-800">
          Consulta Dinâmica (Oracle)
        </h1>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
            <input
              type="text"
              placeholder="Nome da tabela (ex: Familia)"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-grow border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-150"
              disabled={loading}
            />
            <button
              onClick={fetchData}
              disabled={loading || tableName.trim() === ''}
              className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg shadow-md transition-all duration-200 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            >
              {loading ? 'Consultando...' : 'Consultar Tabela'}
            </button>
        </div>

        <p className={`mt-4 font-semibold ${status.startsWith('❌') ? 'text-red-600' : status.startsWith('✅') ? 'text-green-600' : 'text-gray-700'}`}>{status}</p>

        {data.length > 0 && renderTable()}
      </div>
    </div>
  );
};

export default Consulta;
