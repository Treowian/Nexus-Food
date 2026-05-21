// js/app.js
import { initNavigation, showToast } from './navigation.js';
import { initSwipe } from './swipe-engine.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Nexus Food : Séquence de démarrage initiée...');
    
    initNavigation();
    initSwipe(); // On initialise la création et la physique des cartes

    showToast("Application prête ! 🚀");
});