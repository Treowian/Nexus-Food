// js/swipe-engine.js
// js/swipe-engine.js
import { getStock } from './fridge.js';
import { getRecommendations } from './database.js';
import { addMissingItems } from './shopping.js';
import { initSearchEngine } from './components/search-engine.js'; // Import du moteur

let toutesLesRecettes = []; // Mémoire locale pour éviter de re-télécharger

export async function initSwipe() {
    const stack = document.getElementById('card-stack');
    if (!stack) return;
    
    stack.innerHTML = '<p style="text-align:center; margin-top:50px; color: var(--text-light);">Recherche des meilleures recettes...</p>'; 

    const monFrigo = getStock();
    toutesLesRecettes = await getRecommendations(monFrigo);

    // Initialisation des écouteurs du moteur de recherche
    initSearchEngine();

    // Premier affichage : on montre tout ('all' et texte vide '')
    applyFiltersAndRender('', 'all');
}

// ⚠️ NOUVELLE FONCTION EXPORTÉE : Filtre et reconstruit les cartes
export function applyFiltersAndRender(searchQuery, tag) {
    const stack = document.getElementById('card-stack');
    if (!stack) return;

    // Le filtrage magique (Texte + Tag)
    const recettesFiltrees = toutesLesRecettes.filter(recipe => {
        const matchText = recipe.title.toLowerCase().includes(searchQuery);
        
        let matchTag = true;
        if (tag !== 'all') {
            matchTag = recipe.tags && recipe.tags.includes(tag);
        }

        return matchText && matchTag;
    });

    stack.innerHTML = ''; // On nettoie la table

    if (recettesFiltrees.length === 0) {
        stack.innerHTML = '<p style="text-align:center; margin-top:50px;">Aucune recette ne correspond à ces critères.</p>';
        return;
    }

    // Reconstruction des cartes sur les recettes filtrées
    recettesFiltrees.reverse().forEach(recipe => {
        const card = document.createElement('article');
        card.className = 'recipe-card';
        card.dataset.missing = JSON.stringify(recipe.missingItems || []); 
        card.dataset.recipe = JSON.stringify(recipe); 
        
        let badgeColor = recipe.missingCount === 0 ? '#2ed573' : 'var(--primary-color)';
        let badgeText = recipe.missingCount === 0 ? '✨ Prêt à cuisiner !' : `⚠️ ${recipe.missingCount} manquant(s)`;

        card.innerHTML = `
            <img src="${recipe.img}" alt="${recipe.title}" class="card-image" draggable="false">
            <div class="card-overlay" style="position: absolute; bottom: 0; width: 100%; padding: 20px; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); color: white;">
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <span style="background: ${badgeColor}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${badgeText}</span>
                    <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">⏳ ${recipe.time}</span>
                </div>
                <h2>${recipe.title}</h2>
            </div>
        `;
        stack.appendChild(card);
    });

    attachSwipeEvents();
}

function attachSwipeEvents() {
    const cards = document.querySelectorAll('.recipe-card');
    if (cards.length === 0) return;

    const topCard = cards[cards.length - 1];

    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    let isDragging = false;

    topCard.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
        topCard.style.transition = 'none'; 
    }, { passive: true });

    topCard.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX - startX;
        currentY = e.touches[0].clientY - startY;
        const rotate = currentX * 0.05; 
        topCard.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotate}deg)`;
    }, { passive: true });

    topCard.addEventListener('touchend', () => {
        isDragging = false;
        topCard.style.transition = 'transform 0.3s ease-out'; 

        const threshold = window.innerWidth * 0.25; 

        // Détection du clic simple (Tap) pour ouvrir le mode Cuisson
        if (Math.abs(currentX) < 10 && Math.abs(currentY) < 10) {
            try {
                const recipeData = JSON.parse(topCard.dataset.recipe);
                openCookingMode(recipeData);
            } catch (err) {
                console.error("Erreur de lecture de la recette :", err);
            }
            return; 
        }

        // Gestion du Swipe Gauche/Droite
        if (currentX > threshold) {
            swipeCard(topCard, window.innerWidth, 'droite', topCard.dataset.missing);
        } else if (currentX < -threshold) {
            swipeCard(topCard, -window.innerWidth, 'gauche');
        } else {
            topCard.style.transform = `translate(0px, 0px) rotate(0deg)`;
        }
    });
}

function swipeCard(card, directionX, choix, missingData = "[]") {
    card.style.transform = `translate(${directionX}px, 100px) rotate(${directionX * 0.1}deg)`;
    card.style.opacity = '0';
    
    setTimeout(() => {
        card.remove();
        
        if(choix === 'droite') {
            import('./navigation.js').then(module => {
                if (missingData && missingData !== "[]") {
                    try {
                        const missingArray = JSON.parse(missingData);
                        addMissingItems(missingArray); 
                        module.showToast(`Recette validée ! ${missingArray.length} ingrédient(s) ajouté(s) aux courses 🛒`);
                    } catch (err) {
                        console.error("Erreur parsing missingData:", err);
                        module.showToast("Recette validée ! (Erreur d'ajout aux courses)");
                    }
                } else {
                    module.showToast("Recette validée ! Ton frigo contient déjà tout ✨");
                }
            });
        }
        
        attachSwipeEvents(); 
    }, 300);
}

// Fonction d'affichage du Modal de cuisson
function openCookingMode(recipe) {
    const modal = document.getElementById('recipe-modal');
    const content = document.getElementById('modal-content');
    
    if (!modal || !content) return;

    let ingredientsHTML = '<h3>Ingrédients</h3><div style="margin-bottom: 24px;">';
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ing => {
            ingredientsHTML += `
                <div class="ingredient-line">
                    <span>${ing.name}</span>
                    <span class="ingredient-qty">${ing.qty || '1'}</span>
                </div>
            `;
        });
    }
    ingredientsHTML += '</div>';

    let stepsHTML = '<h3>Préparation</h3>';
    if (recipe.steps && recipe.steps.length > 0) {
        recipe.steps.forEach((step, index) => {
            stepsHTML += `
                <div class="step-block">
                    <h4>Étape ${index + 1}</h4>
                    <p>${step}</p>
                </div>
            `;
        });
    } else {
        stepsHTML += '<p>Aucune instruction disponible.</p>';
    }

    content.innerHTML = `
        <img src="${recipe.img}" class="modal-header-img" alt="${recipe.title}">
        <div class="modal-body">
            <h2>${recipe.title}</h2>
            ${ingredientsHTML}
            ${stepsHTML}
        </div>
    `;

    modal.classList.add('show');

    document.getElementById('close-modal').onclick = () => {
        modal.classList.remove('show');
    };
}