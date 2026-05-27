// js/fridge.js
import { supabase } from './supabase.js';

const essentiels = ["Tomate", "Œuf", "Pâtes", "Oignon", "Ail", "Crème fraîche", "Beurre", "Fromage râpé", "Poulet"];
let monStock = new Map(); // On utilise Map pour lier le Nom à la Quantité

export async function initFridge() {
    await loadStockFromDB();
    renderEssentiels();
    
    const searchInput = document.getElementById('ingredient-search');
    const qtyInput = document.getElementById('ingredient-qty');

    // Fonction commune pour valider l'ajout
    const triggerFridgeAdd = async () => {
        if (searchInput.value.trim() !== '') {
            const qte = qtyInput.value.trim() || '1';
            await addOrUpdateIngredient(searchInput.value.trim(), qte);
            searchInput.value = ''; 
            qtyInput.value = '';
            searchInput.focus(); // Remet le focus pour enchaîner
        }
    };

    // On écoute la touche Entrée sur les DEUX champs
    if (searchInput) {
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') await triggerFridgeAdd();
        });
    }

    if (qtyInput) {
        qtyInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') await triggerFridgeAdd();
        });
    }
}

async function loadStockFromDB() {
    const { data, error } = await supabase.from('fridge').select('name, qty');
    if (!error && data) {
        monStock.clear();
        data.forEach(item => monStock.set(item.name, item.qty || '1'));
        renderStock();
    } else if (error) {
        console.error("Erreur de chargement du frigo:", error);
    }
}

async function addOrUpdateIngredient(ingredient, qty) {
    const formattedItem = ingredient.charAt(0).toUpperCase() + ingredient.slice(1);
    
    monStock.set(formattedItem, qty);
    updateUI();

    await supabase.from('fridge').upsert([{ name: formattedItem, qty: qty }], { onConflict: 'name' });
}

async function deleteIngredient(ingredient) {
    monStock.delete(ingredient);
    updateUI();
    await supabase.from('fridge').delete().eq('name', ingredient);
}

async function toggleEssentiel(ingredient) {
    if (monStock.has(ingredient)) {
        await deleteIngredient(ingredient);
    } else {
        await addOrUpdateIngredient(ingredient, '1');
    }
}

export async function addItemsToFridge(itemsObjectsArray) {
    const upsertRows = [];
    
    itemsObjectsArray.forEach(item => {
        const formattedItem = item.name.charAt(0).toUpperCase() + item.name.slice(1);
        monStock.set(formattedItem, item.qty || '1');
        upsertRows.push({ name: formattedItem, qty: item.qty || '1' });
    });
    
    updateUI();

    if (upsertRows.length > 0) {
        await supabase.from('fridge').upsert(upsertRows, { onConflict: 'name' });
    }
}

function updateUI() {
    renderStock();
    renderEssentiels();
}

export function getStock() {
    return monStock;
}

function renderEssentiels() {
    const container = document.getElementById('essential-tags');
    if (!container) return;
    container.innerHTML = ''; 

    essentiels.forEach(ingredient => {
        const isActive = monStock.has(ingredient);
        const btn = document.createElement('button');
        btn.className = `ingredient-tag ${isActive ? 'active' : ''}`;
        
        const qtyText = isActive ? ` (${monStock.get(ingredient)})` : '';
        btn.innerText = (isActive ? '✓ ' : '+ ') + ingredient + qtyText;
        
        btn.addEventListener('click', () => toggleEssentiel(ingredient));
        container.appendChild(btn);
    });
}

function renderStock() {
    const container = document.getElementById('my-stock-tags');
    if (!container) return;
    container.innerHTML = '';

    if (monStock.size === 0) {
        container.innerHTML = '<p class="empty-state">Ton frigo est vide.</p>';
        return;
    }

    monStock.forEach((qty, ingredient) => {
        const btn = document.createElement('button');
        btn.className = 'ingredient-tag active';
        btn.innerText = `✕ ${ingredient} (${qty})`;
        btn.addEventListener('click', () => deleteIngredient(ingredient));
        container.appendChild(btn);
    });
}