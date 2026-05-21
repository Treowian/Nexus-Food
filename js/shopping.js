// js/shopping.js
import { showToast } from './navigation.js';

// Notre base de données temporaire pour les courses
let shoppingItems = [
    { id: 1, name: "Lait", checked: false },
    { id: 2, name: "Beurre", checked: true }
];

export function initShopping() {
    renderShoppingList();

    // 1. Ajouter un article via Entrée
    const input = document.getElementById('shopping-input');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim() !== '') {
            addItem(input.value.trim());
            input.value = ''; 
        }
    });

    // 2. Nettoyer le caddie (Bouton Balai)
    document.getElementById('btn-clear-purchased').addEventListener('click', () => {
        const checkedCount = shoppingItems.filter(item => item.checked).length;
        if (checkedCount > 0) {
            shoppingItems = shoppingItems.filter(item => !item.checked);
            renderShoppingList();
            showToast(`${checkedCount} article(s) supprimé(s)`);
        } else {
            showToast("Le caddie est déjà vide !");
        }
    });
}

function addItem(name) {
    const newItem = {
        id: Date.now(), // Un ID unique basé sur l'heure
        name: name,
        checked: false
    };
    shoppingItems.unshift(newItem); // Ajoute au tout début de la liste
    renderShoppingList();
    showToast("Ajouté aux courses");
}

// Fonction attachée à l'objet global window pour être appelée depuis le HTML généré
window.toggleShoppingItem = function(id) {
    const item = shoppingItems.find(i => i.id === id);
    if (item) {
        item.checked = !item.checked; // Inverse l'état
        renderShoppingList();
    }
}

window.deleteShoppingItem = function(id) {
    shoppingItems = shoppingItems.filter(i => i.id !== id);
    renderShoppingList();
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
        
        // Structure de notre ligne : [Coche + Nom] ----- [Poubelle]
        li.innerHTML = `
            <div class="item-left" onclick="toggleShoppingItem(${item.id})">
                <div class="checkbox">✓</div>
                <span class="item-name">${item.name}</span>
            </div>
            <button class="btn-delete" onclick="deleteShoppingItem(${item.id})">×</button>
        `;

        if (item.checked) {
            completedList.appendChild(li);
            hasCompleted = true;
        } else {
            activeList.appendChild(li);
        }
    });

    // Affiche ou masque le titre "Déjà dans le caddie"
    completedTitle.style.display = hasCompleted ? 'block' : 'none';
}

// Fonction publique pour recevoir les ingrédients manquants d'une recette
export function addMissingItems(itemsArray) {
    if (!itemsArray || itemsArray.length === 0) return;

    let addedCount = 0;
    
    itemsArray.forEach(name => {
        // On vérifie que l'article n'est pas DÉJÀ dans la liste (pour éviter les doublons)
        const alreadyExists = shoppingItems.find(i => i.name.toLowerCase() === name.toLowerCase() && !i.checked);
        
        if (!alreadyExists) {
            shoppingItems.unshift({ 
                id: Date.now() + Math.random(), // Génère un ID unique
                name: name, 
                checked: false 
            });
            addedCount++;
        }
    });

    // On rafraîchit l'interface uniquement si on a ajouté quelque chose
    if (addedCount > 0) {
        renderShoppingList();
    }
}