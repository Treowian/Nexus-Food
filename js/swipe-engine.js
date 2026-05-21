// js/swipe-engine.js

export function initSwipe() {
    const stack = document.getElementById('card-stack');
    
    // 1. Fausses données pour tester la mécanique
    const mockRecipes = [
        { id: 1, title: "Pâtes au Pesto", time: "15 min", img: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=600&q=80" },
        { id: 2, title: "Burger Maison", time: "25 min", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80" },
        { id: 3, title: "Salade César", time: "10 min", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80" }
    ];

    // 2. Génération des cartes dans le DOM
    stack.innerHTML = ''; // On vide le texte de chargement
    // On inverse l'ordre pour que le premier élément apparaisse au-dessus de la pile (z-index visuel)
    mockRecipes.reverse().forEach(recipe => {
        const card = document.createElement('article');
        card.className = 'recipe-card';
        card.innerHTML = `
            <img src="${recipe.img}" alt="${recipe.title}" class="card-image" draggable="false">
            <div class="card-overlay" style="position: absolute; bottom: 0; width: 100%; padding: 20px; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); color: white;">
                <span style="background: var(--primary-color); padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">⏳ ${recipe.time}</span>
                <h2 style="margin-top: 8px;">${recipe.title}</h2>
            </div>
        `;
        stack.appendChild(card);
    });

    // 3. Activation de la physique sur les cartes
    attachSwipeEvents();
}

function attachSwipeEvents() {
    const cards = document.querySelectorAll('.recipe-card');
    if (cards.length === 0) return;

    // On n'écoute les événements QUE sur la carte du dessus
    const topCard = cards[cards.length - 1];

    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    let isDragging = false;

    // Le doigt touche l'écran
    topCard.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
        topCard.style.transition = 'none'; // On coupe l'animation CSS pour que la carte colle au doigt
    }, { passive: true });

    // Le doigt bouge
    topCard.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        currentX = e.touches[0].clientX - startX;
        currentY = e.touches[0].clientY - startY;
        
        // Mathématiques : on incline légèrement la carte (10 degrés max) en fonction du déplacement
        const rotate = currentX * 0.05; 
        
        // Utilisation du GPU (transform) pour une fluidité absolue
        topCard.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotate}deg)`;
    }, { passive: true });

    // Le doigt quitte l'écran
    topCard.addEventListener('touchend', () => {
        isDragging = false;
        topCard.style.transition = 'transform 0.3s ease-out'; // On réactive l'animation

        const threshold = window.innerWidth * 0.25; // Il faut swiper au moins 25% de l'écran

        if (currentX > threshold) {
            // Swipe Validé (Droite)
            swipeCard(topCard, window.innerWidth, 'droite');
        } else if (currentX < -threshold) {
            // Swipe Rejeté (Gauche)
            swipeCard(topCard, -window.innerWidth, 'gauche');
        } else {
            // Pas assez swipé -> On annule, retour au centre
            topCard.style.transform = `translate(0px, 0px) rotate(0deg)`;
        }
    });
}

function swipeCard(card, directionX, choix) {
    // Éjection de la carte hors de l'écran
    card.style.transform = `translate(${directionX}px, 100px) rotate(${directionX * 0.1}deg)`;
    card.style.opacity = '0';
    
    // Après l'animation, on détruit la carte et on active la suivante
    setTimeout(() => {
        card.remove();
        console.log(`Action : Carte swipée à ${choix}`);
        
        // Import dynamique du Toast pour notifier l'utilisateur si validé
        if(choix === 'droite') {
            import('./navigation.js').then(module => module.showToast("Recette validée ! 😋"));
        }
        
        attachSwipeEvents(); // On attache les événements à la nouvelle carte du dessus
    }, 300);
}