// js/fridge.js
import { supabase } from './supabase.js';

const essentiels = ["Tomate", "Œuf", "Pâtes", "Oignon", "Ail", "Crème fraîche", "Beurre", "Fromage râpé", "Poulet"];
let monStock = new Set(); 

export async function initFridge() {
    // 1. On charge le vrai stock depuis Supabase au démarrage
    await loadStockFromDB();
    
    renderEssentiels();
    
    const searchInput = document.getElementById('ingredient-search');
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
            toggleIngredient(searchInput.value.trim());
            searchInput.value = ''; 
        }
    });
}

// Va chercher les ingrédients sauvegardés
async function loadStockFromDB() {
    const { data, error } = await supabase.from('fridge').select('name');
    if (!error && data) {
        monStock.clear();
        data.forEach(item => monStock.add(item.name));
        renderStock();
    }
}

// Gère le clic (Ajout/Suppression)
async function toggleIngredient(ingredient) {
    // Formatage propre : "tomate" -> "Tomate"
    const formattedItem = ingredient.charAt(0).toUpperCase() + ingredient.slice(1);
    
    if (monStock.has(formattedItem)) {
        // 1. Mise à jour immédiate de l'interface (Optimistic UI)
        monStock.delete(formattedItem);
        updateUI();
        // 2. Suppression en base de données en arrière-plan
        await supabase.from('fridge').delete().eq('name', formattedItem);
    } else {
        // 1. Mise à jour immédiate
        monStock.add(formattedItem);
        updateUI();
        // 2. Sauvegarde en base de données
        await supabase.from('fridge').insert([{ name: formattedItem }]);
    }
}

// Fonction utilisée par le bouton balai des courses
export async function addItemsToFridge(itemsArray) {
    const newItems = [];
    
    itemsArray.forEach(item => {
        const formattedItem = item.charAt(0).toUpperCase() + item.slice(1);
        if (!monStock.has(formattedItem)) {
            monStock.add(formattedItem);
            newItems.push({ name: formattedItem }); // Prépare l'envoi groupé
        }
    });
    
    updateUI();

    // Envoi de tous les nouveaux articles d'un coup à Supabase
    if (newItems.length > 0) {
        await supabase.from('fridge').insert(newItems);
    }
}

// Raccourci pour rafraîchir les deux listes
function updateUI() {
    renderStock();
    renderEssentiels();
}

export function getStock() {
    return monStock;
}

/* --- FONCTIONS D'AFFICHAGE (Inchangées) --- */
function renderEssentiels() {
    const container = document.getElementById('essential-tags');
    container.innerHTML = ''; 

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

    monStock.forEach(ingredient => {
        const btn = document.createElement('button');
        btn.className = 'ingredient-tag active';
        btn.innerText = '✕ ' + ingredient;
        btn.addEventListener('click', () => toggleIngredient(ingredient));
        container.appendChild(btn);
    });
}