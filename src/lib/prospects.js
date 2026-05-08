const fs = require('fs');
const path = require('path');

const PROSPECTS_FILE = path.join(process.cwd(), 'prospects.json');

// Inicializar archivo si no existe
if (!fs.existsSync(PROSPECTS_FILE)) {
    fs.writeFileSync(PROSPECTS_FILE, JSON.stringify([], null, 2));
}

function saveProspect(data) {
    try {
        const prospects = JSON.parse(fs.readFileSync(PROSPECTS_FILE, 'utf8'));
        
        // Buscar si ya existe el prospecto
        const index = prospects.findIndex(p => p.id === data.id);
        
        const newProspect = {
            id: data.id,
            name: data.name || 'Desconocido',
            lastMessage: data.lastMessage,
            timestamp: new Date().toISOString(),
            status: data.status || 'Interesado'
        };

        if (index !== -1) {
            // Actualizar existente
            prospects[index] = { ...prospects[index], ...newProspect };
        } else {
            // Agregar nuevo al inicio
            prospects.unshift(newProspect);
        }

        // Mantener solo los últimos 50 para no saturar
        const limitedProspects = prospects.slice(0, 50);
        
        fs.writeFileSync(PROSPECTS_FILE, JSON.stringify(limitedProspects, null, 2));
        return true;
    } catch (error) {
        console.error("Error saving prospect:", error);
        return false;
    }
}

function getProspects() {
    try {
        return JSON.parse(fs.readFileSync(PROSPECTS_FILE, 'utf8'));
    } catch (error) {
        return [];
    }
}

module.exports = {
    saveProspect,
    getProspects
};
