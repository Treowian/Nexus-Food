// js/shopping.js
import { showToast } from './navigation.js';
import { addItemsToFridge } from './fridge.js';
import { supabase } from './supabase.js'; // Import de la connexion

let shoppingItems = [];

export async function initShopping() {
    // 1. Chargement initial des courses depuis la base de données
    await loadShoppingFromDB();

    const input = document.getElementById('shopping-input');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim() !== '') {
            addItem(input.value.trim());
            input.value = ''; 
        }
    });

    // Nettoyer le caddie (Bouton Balai) et envoyer au Frigo
    document.getElementById('btn-clear-purchased').addEventListener('click', async () => {
        const checkedItems = shoppingItems.filter(item => item.checked);
        
        if (checkedItems.length > 0) {
            const itemNames = checkedItems.map(item => item.name);
            
            // On envoie au frigo (qui gère sa propre base Supabase)
            await addItemsToFridge(itemNames);
            
            // Suppression en masse sur Supabase pour les articles cochés
            // L'opérateur 'in' permet de supprimer toutes les lignes dont le nom est dans notre tableau
            await supabase.from('shopping_list').delete().in('name', itemNames);

            // Mise à jour locale
            shoppingItems = shoppingItems.filter(item => !item.checked);
            renderShoppingList();
            
            showToast(`${checkedItems.length} article(s) transféré(s) au Frigo ! ❄️`);
        } else {
            showToast("Le caddie est déjà vide !");
        }
    });
}

// Charger les données de Supabase
async function loadShoppingFromDB() {
    const { data, error } = await supabase.from('shopping_list').select('*').order('created_at', { ascending: false });
    if (!error && data) {
        shoppingItems = data;
        renderShoppingList();
    }
}

// Ajouter un article (ex: Déodorant, Poulet...)
async function addItem(name) {
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    
    // Éviter les doublons visuels immédiats
    if (shoppingItems.some(item => item.name.toLowerCase() === formattedName.toLowerCase())) {
        showToast("Cet article est déjà dans ta liste !");
        return;
    }

    const newItem = {
        name: formattedName,
        checked: false
    };

    // Optimistic UI : Ajout local pour une réactivité instantanée
    shoppingItems.unshift(newItem);
    renderShoppingList();
    showToast("Ajouté aux courses");

    // Sauvegarde en base de données
    await supabase.from('shopping_list').insert([newItem]);
    
    // On recharge pour récupérer l'ID généré par Supabase (nécessaire pour le cocher/supprimer plus tard)
    await loadShoppingFromDB();
}

// Recevoir les ingrédients manquants depuis le Swipe de recettes
export async function addMissingItems(itemsArray) {
    if (!itemsArray || itemsArray.length === 0) return;

    const newRows = [];
    
    itemsArray.forEach(name => {
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        const alreadyExists = shoppingItems.find(i => i.name.toLowerCase() === formattedName.toLowerCase());
        
        if (!alreadyExists) {
            const newItem = { name: formattedName, checked: false };
            shoppingItems.unshift(newItem);
            newRows.push(newItem);
        }
    });

    if (newRows.length > 0) {
        renderShoppingList();
        // Envoi groupé sur Supabase
        await supabase.from('shopping_list').insert(newRows);
        await loadShoppingFromDB();
    }
}

// Inverser l'état coché/décoché (Mise à jour)
window.toggleShoppingItem = async function(id) {
    const item = shoppingItems.find(i => i.id === id);
    if (item) {
        item.checked = !item.checked;
        renderShoppingList();

        // ⚠️ NOUVEAU : On met à jour la ligne sur Supabase (.update) en ciblant son ID (.eq)
        await supabase.from('shopping_list')
            .update({ checked: item.checked })
            .eq('id', id);
    }
}

// Supprimer un article définitivement via la croix
window.deleteShoppingItem = async function(id) {
    shoppingItems = shoppingItems.filter(i => i.id !== id);
    renderShoppingList();

    // Suppression sur Supabase
    await supabase.from('shopping_list').delete().eq('id', id);
}

function renderShoppingList() {
    const activeList = document.getElementById('shopping-list-active');
    const completedList = document.getElementById('shopping-list-completed');
    const completedTitle = document.getElementById('completed-title');

    activeList.innerHTML = '';
    completedList.innerHTML = '';

    let hasCompleted = false;

    shoppingItems.forEach(item => {
        const li = document.createElement('li');
        // On s'assure d'utiliser des guillemets simples pour entourer l'ID s'il s'agit d'un UUID de Supabase
        li.className = `shopping-item ${item.checked ? 'checked' : ''}`;
        
        li.innerHTML = `
            <div class="item-left" onclick="toggleShoppingItem('${item.id}')">
                <div class="checkbox">✓</div>
                <span class="item-name">${item.name}</span>
            </div>
            <button class="btn-delete" onclick="deleteShoppingItem('${item.id}')">×</button>
        `;

        if (item.checked) {
            completedList.appendChild(li);
            hasCompleted = true;
        } else {
            activeList.appendChild(li);
        }
    });

    completedTitle.style.display = hasCompleted ? 'block' : 'none';
}