// js/shopping.js
import { showToast } from './navigation.js';
import { addItemsToFridge } from './fridge.js';
import { supabase } from './supabase.js';

let shoppingItems = [];

export async function initShopping() {
    await loadShoppingFromDB();

    const input = document.getElementById('shopping-input');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim() !== '') {
            addItem(input.value.trim());
            input.value = ''; 
        }
    });

    // 🧹 Le bouton balai devient intelligent
    document.getElementById('btn-clear-purchased').addEventListener('click', async () => {
        const checkedItems = shoppingItems.filter(item => item.checked);
        
        if (checkedItems.length > 0) {
            // ⚠️ NOUVEAUTÉ : On isole UNIQUEMENT les articles destinés au frigo
            const foodItems = checkedItems.filter(item => item.is_food).map(item => item.name);
            
            // On envoie au frigo seulement s'il y a de la nourriture
            if (foodItems.length > 0) {
                await addItemsToFridge(foodItems);
            }
            
            // On supprime TOUT le caddie (nourriture + déodorant)
            const allCheckedNames = checkedItems.map(item => item.name);
            await supabase.from('shopping_list').delete().in('name', allCheckedNames);

            shoppingItems = shoppingItems.filter(item => !item.checked);
            renderShoppingList();
            
            if (foodItems.length > 0) {
                showToast(`${foodItems.length} article(s) transféré(s) au Frigo ! ❄️`);
            } else {
                showToast("Caddie vidé ! (Aucun article pour le frigo) 🧹");
            }
        } else {
            showToast("Le caddie est déjà vide !");
        }
    });
}

async function loadShoppingFromDB() {
    const { data, error } = await supabase.from('shopping_list').select('*').order('created_at', { ascending: false });
    if (!error && data) {
        shoppingItems = data;
        renderShoppingList();
    }
}

async function addItem(name) {
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    
    if (shoppingItems.some(item => item.name.toLowerCase() === formattedName.toLowerCase())) {
        showToast("Cet article est déjà dans ta liste !");
        return;
    }

    const newItem = {
        name: formattedName,
        checked: false,
        is_food: false // ⚠️ Ajout manuel = Faux par défaut (ex: Déodorant)
    };

    shoppingItems.unshift(newItem);
    renderShoppingList();
    showToast("Ajouté aux courses");

    await supabase.from('shopping_list').insert([newItem]);
    await loadShoppingFromDB();
}

export async function addMissingItems(itemsArray) {
    if (!itemsArray || itemsArray.length === 0) return;

    const newRows = [];
    
    itemsArray.forEach(name => {
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        const alreadyExists = shoppingItems.find(i => i.name.toLowerCase() === formattedName.toLowerCase());
        
        if (!alreadyExists) {
            // ⚠️ Depuis une recette = Vrai par défaut (Nourriture)
            const newItem = { name: formattedName, checked: false, is_food: true };
            shoppingItems.unshift(newItem);
            newRows.push(newItem);
        }
    });

    if (newRows.length > 0) {
        renderShoppingList();
        await supabase.from('shopping_list').insert(newRows);
        await loadShoppingFromDB();
    }
}

window.toggleShoppingItem = async function(id) {
    const item = shoppingItems.find(i => i.id === id);
    if (item) {
        item.checked = !item.checked;
        renderShoppingList();
        await supabase.from('shopping_list').update({ checked: item.checked }).eq('id', id);
    }
}

// ⚠️ NOUVEAUTÉ : Fonction pour basculer le mode "Frigo" manuellement
window.toggleFoodDest = async function(id) {
    const item = shoppingItems.find(i => i.id === id);
    if (item) {
        item.is_food = !item.is_food;
        renderShoppingList();
        await supabase.from('shopping_list').update({ is_food: item.is_food }).eq('id', id);
    }
}

window.deleteShoppingItem = async function(id) {
    shoppingItems = shoppingItems.filter(i => i.id !== id);
    renderShoppingList();
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
        li.className = `shopping-item ${item.checked ? 'checked' : ''}`;
        
        // ⚠️ NOUVEAUTÉ : Injection du bouton flocon de neige
        li.innerHTML = `
            <div class="item-left" onclick="toggleShoppingItem('${item.id}')">
                <div class="checkbox">✓</div>
                <span class="item-name">${item.name}</span>
            </div>
            <div style="display: flex; align-items: center;">
                <span class="fridge-toggle ${item.is_food ? 'active' : ''}" onclick="toggleFoodDest('${item.id}')" title="Transférer au frigo">❄️</span>
                <button class="btn-delete" onclick="deleteShoppingItem('${item.id}')">×</button>
            </div>
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