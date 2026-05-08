const fs = require('fs');
const path = require('path');

const CLIENTS_FILE = path.join(process.cwd(), 'clients.json');

// Inicializar si no existe
if (!fs.existsSync(CLIENTS_FILE)) {
    const initialData = [
        {
            id: '1',
            name: 'Kenedy',
            email: 'kenedy@gmail.com',
            payment: 50,
            startDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        }
    ];
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(initialData, null, 2));
}

function getClients() {
    try {
        return JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf8'));
    } catch (err) {
        return [];
    }
}

function updateClient(id, updates) {
    try {
        const clients = getClients();
        const index = clients.findIndex(c => c.id === id);
        if (index !== -1) {
            clients[index] = { ...clients[index], ...updates };
            fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));
            return true;
        }
        return false;
    } catch (err) {
        return false;
    }
}

function addClient(client) {
    try {
        const clients = getClients();
        const newClient = {
            id: Date.now().toString(),
            ...client,
            startDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        };
        clients.unshift(newClient);
        fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));
        return newClient;
    } catch (err) {
        return null;
    }
}

module.exports = {
    getClients,
    updateClient,
    addClient
};
