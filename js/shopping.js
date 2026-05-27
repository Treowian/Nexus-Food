// js/shopping.js
import { showToast } from './navigation.js';
import { addItemsToFridge } from './fridge.js';
import { supabase } from './supabase.js';

let shoppingItems = [];

export async function initShopping() {
    await loadShoppingFromDB();

    const input = document.getElementById('shopping-input');
    const qtyInput = document.getElementById('shopping-qty');

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim() !== '') {
            const qty = qtyInput.value.trim() || '1';
            addItem(input.value.trim(), qty);
            input.value = ''; 
            qtyInput.value = '';
        }
    });

    document.getElementById('btn-clear-purchased').addEventListener('click', async () => {
        const checkedItems = shoppingItems.filter(item => item.checked);
        
        if (checkedItems.length > 0) {
            // ⚠️ On extrait le NOM et la QUANTITÉ pour les envoyer au frigo
            const foodItems = checkedItems.filter(item => item.is_food).map(item => ({ name: item.name, qty: item.qty }));
            
            if (foodItems.length > 0) {
                await addItemsToFridge(foodItems);
            }
            
            const allCheckedNames = checkedItems.map(item => item.name);
            await supabase.from('shopping_list').delete().in('name', allCheckedNames);

            shoppingItems = shoppingItems.filter(item => !item.checked);
            renderShoppingList();
            
            if (foodItems.length > 0) {
                showToast(`${foodItems.length} article(s) transféré(s) au Frigo ! ❄️`);
            } else {
                showToast("Caddie vidé ! 🧹");
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

async function addItem(name, qty) {
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    
    if (shoppingItems.some(item => item.name.toLowerCase() === formattedName.toLowerCase())) {
        showToast("Cet article est déjà dans ta liste !");
        return;
    }

    const newItem = { name: formattedName, checked: false, is_food: false, qty: qty };
    shoppingItems.unshift(newItem);
    renderShoppingList();

    await supabase.from('shopping_list').insert([newItem]);
    await loadShoppingFromDB();
}

// Reçoit les manquants sous forme d'objets [{name, qty}] depuis le Swipe
export async function addMissingItems(itemsObjectsArray) {
    if (!itemsObjectsArray || itemsObjectsArray.length === 0) return;

    const newRows = [];
    
    itemsObjectsArray.forEach(item => {
        const formattedName = item.name.charAt(0).toUpperCase() + item.name.slice(1);
        const alreadyExists = shoppingItems.find(i => i.name.toLowerCase() === formattedName.toLowerCase());
        
        if (!alreadyExists) {
            const newItem = { name: formattedName, checked: false, is_food: true, qty: item.qty };
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
        
        // ⚠️ Modification UX : On affiche la quantité à côté du nom avec un petit badge gris épuré
        li.innerHTML = `
            <div class="item-left" onclick="toggleShoppingItem('${item.id}')">
                <div class="checkbox">✓</div>
                <span class="item-name">${item.name}</span>
                <span style="background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 6px; font-size: 0.8rem; color: var(--text-light); font-weight: bold; margin-left: 4px;">${item.qty || '1'}</span>
            </div>
            <div style="display: flex; align-items: center;">
                <span class="fridge-toggle ${item.is_food ? 'active' : ''}" onclick="toggleFoodDest('${item.id}')">❄️</span>
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