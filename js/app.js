// js/app.js
import { initNavigation, showToast } from './navigation.js';

// On attend que le HTML soit totalement lu par le navigateur
document.addEventListener('DOMContentLoaded', () => {
    console.log('Nexus Food : Séquence de démarrage initiée...');
    
    // 1. Initialisation de la navigation
    initNavigation();

    // Petit test pour vérifier que tout fonctionne
    showToast("Application prête ! 🚀");
});