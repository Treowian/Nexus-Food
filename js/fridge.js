// js/fridge.js

// Notre base de données temporaire pour l'interface
const essentiels = ["Tomate", "Œuf", "Pâtes", "Oignon", "Ail", "Crème fraîche", "Beurre", "Fromage râpé", "Poulet"];
let monStock = new Set(); // Un Set évite les doublons automatiquement

export function initFridge() {
    renderEssentiels();
    
    // Gère la recherche par la touche "Entrée" sur le mobile
    const searchInput = document.getElementById('ingredient-search');
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
            toggleIngredient(searchInput.value.trim());
            searchInput.value = ''; // On vide le champ
        }
    });
}

function toggleIngredient(ingredient) {
    // Si on l'a, on l'enlève. Sinon, on l'ajoute.
    if (monStock.has(ingredient)) {
        monStock.delete(ingredient);
    } else {
        monStock.add(ingredient);
    }
    
    // On met à jour l'interface
    renderStock();
    renderEssentiels(); // Met à jour les couleurs des essentiels
}

function renderEssentiels() {
    const container = document.getElementById('essential-tags');
    container.innerHTML = ''; // On vide

    essentiels.forEach(ingredient => {
        const isActive = monStock.has(ingredient);
        const btn = document.createElement('button');
        
        btn.className = `ingredient-tag ${isActive ? 'active' : ''}`;
        btn.innerText = (isActive ? '✓ ' : '+ ') + ingredient;
        
        btn.addEventListener('click', () => toggleIngredient(ingredient));
        container.appendChild(btn);
    });
}

function renderStock() {
    const container = document.getElementById('my-stock-tags');
    container.innerHTML = '';

    if (monStock.size === 0) {
        container.innerHTML = '<p class="empty-state">Ton frigo est vide. Ajoute des ingrédients !</p>';
        return;
    }

    // On affiche tout ce qu'il y a dans le Set 'monStock'
    monStock.forEach(ingredient => {
        const btn = document.createElement('button');
        btn.className = 'ingredient-tag active';
        btn.innerText = '✕ ' + ingredient;
        
        btn.addEventListener('click', () => toggleIngredient(ingredient));
        container.appendChild(btn);
    });
}

// Permet aux autres fichiers de consulter le contenu du frigo
export function getStock() {
    return monStock;
}