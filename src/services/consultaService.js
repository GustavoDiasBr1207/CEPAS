const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

export async function getTable(tableName) {
    const url = `${API_BASE_URL}/dados/${tableName}`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text().catch(() => 'Erro desconhecido');
        throw new Error(`Erro ${res.status}: ${text}`);
    }
    return res.json();
}

export async function getRecord(tableName, id) {
    const url = `${API_BASE_URL}/dados/${tableName}?id=${id}`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text().catch(() => 'Erro desconhecido');
        throw new Error(`Erro ${res.status}: ${text}`);
    }
    return res.json();
}
