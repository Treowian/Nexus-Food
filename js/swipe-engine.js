// js/swipe-engine.js
import { getStock } from './fridge.js';
import { getRecommendations } from './database.js';
import { addMissingItems } from './shopping.js'; // ⚠️ On importe notre nouvelle fonction

export function initSwipe() {
    const stack = document.getElementById('card-stack');
    stack.innerHTML = ''; 

    const monFrigo = getStock();
    const recettesTriees = getRecommendations(monFrigo);

    if (recettesTriees.length === 0) {
        stack.innerHTML = '<p style="text-align:center; margin-top:50px;">Aucune recette trouvée.</p>';
        return;
    }

    recettesTriees.reverse().forEach(recipe => {
        const card = document.createElement('article');
        card.className = 'recipe-card';
        
        // ⚠️ ASTUCE ARCHITECTURE : On cache les ingrédients manquants dans l'élément HTML
        // On utilise un séparateur "|" car une virgule pourrait faire partie du nom d'un ingrédient
        card.dataset.missing = recipe.missingItems.join('|'); 
        
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

        if (currentX > threshold) {
            // ⚠️ On transmet la donnée "missing" à la fonction d'éjection
            swipeCard(topCard, window.innerWidth, 'droite', topCard.dataset.missing);
        } else if (currentX < -threshold) {
            swipeCard(topCard, -window.innerWidth, 'gauche');
        } else {
            topCard.style.transform = `translate(0px, 0px) rotate(0deg)`;
        }
    });
}

function swipeCard(card, directionX, choix, missingData = "") {
    card.style.transform = `translate(${directionX}px, 100px) rotate(${directionX * 0.1}deg)`;
    card.style.opacity = '0';
    
    setTimeout(() => {
        card.remove();
        
        // ⚠️ Si l'utilisateur a swipé à droite (Validé)
        if(choix === 'droite') {
            import('./navigation.js').then(module => {
                if (missingData) {
                    // On découpe notre chaîne de caractères pour recréer le tableau d'ingrédients
                    const missingArray = missingData.split('|').filter(item => item !== "");
                    addMissingItems(missingArray); // Envoi aux courses
                    module.showToast(`Recette validée ! ${missingArray.length} ingrédient(s) ajouté(s) aux courses 🛒`);
                } else {
                    module.showToast("Recette validée ! Ton frigo contient déjà tout ✨");
                }
            });
        }
        
        attachSwipeEvents(); 
    }, 300);
}