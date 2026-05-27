// js/app.js
import { initNavigation, showToast } from './navigation.js';
import { initSwipe } from './swipe-engine.js';
import { initFridge } from './fridge.js';
import { initShopping } from './shopping.js';

// Activation de la PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('PWA prête à être installée !'))
            .catch(err => console.error('Erreur PWA :', err));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Nexus Food : Séquence de démarrage initiée...');
    
    // 1. Initialisation de la navigation AVEC notre règle de rafraîchissement
    initNavigation((targetId) => {
        // Si l'utilisateur vient de cliquer sur l'onglet "Recettes"...
        if (targetId === 'view-recipes') {
            console.log("Rafraîchissement de la pile de recettes...");
            initSwipe(); // On régénère les cartes en lisant le frigo
        }
    });

    // 2. Initialisation des autres modules
    initSwipe(); // Premier chargement au démarrage
    initFridge();
    initShopping();

    showToast("Application prête ! 🚀");
});