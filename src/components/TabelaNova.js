import React from 'react';
import './Tabela.css';

/**
 * Componente Tabela para exibir dados em formato tabular
 * @param {Array} data - Array de objetos com os dados
 * @param {Array} columns - Array de configurações das colunas
 * @param {Function} onRowClick - Função chamada ao clicar em uma linha (opcional)
 */
const Tabela = ({ data = [], columns = [], onRowClick }) => {
    if (!data || data.length === 0) {
        return (
            <div className="tabela-container">
                <div className="tabela-empty">
                    <p>Nenhum registro encontrado</p>
                </div>
            </div>
        );
    }

    // Se columns não foi fornecido, usar as chaves do primeiro objeto
    let columnConfig = columns;
    if (!columns || columns.length === 0) {
        const firstItem = data[0];
        columnConfig = Object.keys(firstItem).map(key => ({
            key,
            label: key,
            render: (value) => value
        }));
    }

    // Converte array simples de strings em configuração completa
    if (columns.length > 0 && typeof columns[0] === 'string') {
        columnConfig = columns.map(col => ({
            key: col,
            label: col,
            render: (value) => value || 'N/A'
        }));
    }

    const handleRowClick = (row, index) => {
        if (onRowClick) {
            onRowClick(row, index);
        }
    };

    return (
        <div className="tabela-container">
            <div className="tabela-wrapper">
                <table className="tabela">
                    <thead>
                        <tr>
                            {columnConfig.map((column, index) => (
                                <th key={index} className="tabela-header">
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr 
                                key={rowIndex} 
                                className={`tabela-row ${onRowClick ? 'clickable' : ''}`}
                                onClick={() => handleRowClick(row, rowIndex)}
                            >
                                {columnConfig.map((column, colIndex) => {
                                    const value = row[column.key];
                                    const displayValue = column.render 
                                        ? column.render(value, row, rowIndex)
                                        : value;
                                    
                                    return (
                                        <td key={colIndex} className="tabela-cell">
                                            {displayValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="tabela-footer">
                <span className="tabela-count">
                    Total: {data.length} registro{data.length !== 1 ? 's' : ''}
                </span>
            </div>
        </div>
    );
};

export default Tabela;