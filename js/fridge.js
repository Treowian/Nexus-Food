// js/fridge.js
import { supabase } from './supabase.js';

const essentiels = ["Tomate", "Œuf", "Pâtes", "Oignon", "Ail", "Crème fraîche", "Beurre", "Fromage râpé", "Poulet"];
let monStock = new Map(); // ⚠️ Set() devient Map() pour stocker [Nom -> Qté]

export async function initFridge() {
    await loadStockFromDB();
    renderEssentiels();
    
    const searchInput = document.getElementById('ingredient-search');
    const qtyInput = document.getElementById('ingredient-qty');

    const triggerFridgeAdd = async () => {
        if (searchInput.value.trim() !== '') {
            const qte = qtyInput.value.trim() || '1';
            await addOrUpdateIngredient(searchInput.value.trim(), qte);
            searchInput.value = ''; 
            qtyInput.value = '';
            searchInput.focus(); // Remet le curseur sur le nom
        }
    };

    // Entrée sur le nom
    searchInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') await triggerFridgeAdd();
    });

    // Entrée sur la quantité
    qtyInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') await triggerFridgeAdd();
    });

async function loadStockFromDB() {
    const { data, error } = await supabase.from('fridge').select('name, qty');
    if (!error && data) {
        monStock.clear();
        // On remplit la Map avec le nom et la quantité
        data.forEach(item => monStock.set(item.name, item.qty || '1'));
        renderStock();
    }
}

// Ajoute ou met à jour un ingrédient avec sa quantité
async function addOrUpdateIngredient(ingredient, qty) {
    const formattedItem = ingredient.charAt(0).toUpperCase() + ingredient.slice(1);
    
    monStock.set(formattedItem, qty);
    updateUI();

    // Upsert (Insère, ou met à jour si le nom existe déjà)
    await supabase.from('fridge').upsert([{ name: formattedItem, qty: qty }], { onConflict: 'name' });
}

// Supprime un ingrédient au clic sur sa bulle
async function deleteIngredient(ingredient) {
    monStock.delete(ingredient);
    updateUI();
    await supabase.from('fridge').delete().eq('name', ingredient);
}

// Fonction appelée par le bouton d'ajout rapide (les Essentiels)
async function toggleEssentiel(ingredient) {
    if (monStock.has(ingredient)) {
        await deleteIngredient(ingredient);
    } else {
        await addOrUpdateIngredient(ingredient, '1');
    }
}

// Fonction publique utilisée par le bouton balai des courses
export async function addItemsToFridge(itemsObjectsArray) {
    const upsertRows = [];
    
    itemsObjectsArray.forEach(item => {
        const formattedItem = item.name.charAt(0).toUpperCase() + item.name.slice(1);
        monStock.set(formattedItem, item.qty);
        upsertRows.push({ name: formattedItem, qty: item.qty });
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
    container.innerHTML = ''; 

    essentiels.forEach(ingredient => {
        const isActive = monStock.has(ingredient);
        const btn = document.createElement('button');
        btn.className = `ingredient-tag ${isActive ? 'active' : ''}`;
        
        // Si présent, on affiche sa quantité dans la bulle d'aide
        const qtyText = isActive ? ` (${monStock.get(ingredient)})` : '';
        btn.innerText = (isActive ? '✓ ' : '+ ') + ingredient + qtyText;
        
        btn.addEventListener('click', () => toggleEssentiel(ingredient));
        container.appendChild(btn);
    });
}

function renderStock() {
    const container = document.getElementById('my-stock-tags');
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