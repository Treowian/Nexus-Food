// js/menu.js
import { supabase } from './supabase.js';
import { openCookingMode } from './swipe-engine.js';
import { getStock } from './fridge.js'; 
import { addMissingItems } from './shopping.js'; 

let myMenu = [];

export async function initMenu() {
    await loadMenuFromDB();
}

async function loadMenuFromDB() {
    const { data, error } = await supabase.from('weekly_menu').select('*').order('created_at', { ascending: false });
    if (!error && data) {
        myMenu = data;
        renderMenu();
    }
}

export async function addToMenu(recipeData) {
    if (myMenu.some(item => item.recipe.title === recipeData.title)) return;

    const newItem = { recipe: recipeData };
    myMenu.unshift(newItem); 
    renderMenu();

    await supabase.from('weekly_menu').insert([{ recipe: recipeData }]);
    await loadMenuFromDB(); 
}

window.deleteFromMenu = async function(id) {
    myMenu = myMenu.filter(item => item.id !== id);
    renderMenu();
    await supabase.from('weekly_menu').delete().eq('id', id);
}

window.openRecipeFromMenu = function(id) {
    const item = myMenu.find(i => i.id === id);
    if (item) {
        openCookingMode(item.recipe);
    }
}

function renderMenu() {
    const container = document.getElementById('menu-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (myMenu.length === 0) {
        container.innerHTML = '<p class="empty-state">Ton menu est vide. Swipe des recettes à droite pour le remplir ! 🍽️</p>';
        return;
    }

    myMenu.forEach(item => {
        const recipe = item.recipe;
        const card = document.createElement('div');
        card.style.cssText = 'display: flex; align-items: center; background: var(--card-bg); border-radius: 12px; padding: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); gap: 12px; position: relative; cursor: pointer;';
        
        card.innerHTML = `
            <img src="${recipe.img}" alt="${recipe.title}" style="width: 70px; height: 70px; border-radius: 8px; object-fit: cover;">
            <div style="flex: 1;" onclick="openRecipeFromMenu('${item.id}')">
                <h4 style="margin: 0; font-size: 1rem; color: var(--text-color);">${recipe.title}</h4>
                <span style="font-size: 0.8rem; color: var(--text-light);">⏳ ${recipe.time}</span>
            </div>
            <button onclick="deleteFromMenu('${item.id}')" style="background: none; border: none; font-size: 1.2rem; color: #ff4757; padding: 10px; cursor: pointer;">✕</button>
        `;
        
        container.appendChild(card);
    });
}

// LE CALCULATEUR DE COURSES INTELLIGENT (Par Unité)
window.generateShoppingList = async function() {
    if (myMenu.length === 0) {
        import('./navigation.js').then(m => m.showToast("Ton menu est vide !"));
        return;
    }

    const monFrigo = getStock();
    const allMissing = [];

    // On analyse les recettes du menu
    myMenu.forEach(item => {
        item.recipe.ingredients.forEach(ing => {
            // L'ingrédient est-il déjà dans le frigo ?
            const isInFridge = monFrigo.some(f => f.name.toLowerCase() === ing.name.toLowerCase());
            
            if (!isInFridge) {
                // S'il manque, on regarde s'il est déjà dans notre future liste de courses
                const existing = allMissing.find(m => m.name.toLowerCase() === ing.name.toLowerCase());
                
                if (existing) {
                    // S'il y est déjà, on ajoute +1 à la quantité (ex: 2 articles à acheter)
                    existing.qty += 1;
                } else {
                    // Sinon on l'ajoute pour la première fois avec une quantité de 1
                    allMissing.push({ name: ing.name, qty: 1 });
                }
            }
        });
    });

    if (allMissing.length > 0) {
        addMissingItems(allMissing);
        import('./navigation.js').then(m => {
            m.showToast(`🛒 ${allMissing.length} articles ajoutés !`);
            document.querySelector('[data-target="view-shopping"]').click();
        });
    } else {
        import('./navigation.js').then(m => m.showToast(`✨ Ton frigo contient déjà tout pour ce menu !`));
    }
}