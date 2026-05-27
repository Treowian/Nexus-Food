// js/components/search-engine.js
import { applyFiltersAndRender } from '../swipe-engine.js';

let currentSearchQuery = '';
let currentTag = 'all';

export function initSearchEngine() {
    const searchInput = document.getElementById('recipe-search-input');
    const filterButtons = document.querySelectorAll('.filter-tag');

    if (!searchInput) return;

    // 1. Écoute de la barre de recherche (Texte)
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.toLowerCase().trim();
        applyFiltersAndRender(currentSearchQuery, currentTag);
    });

    // 2. Écoute des pilules de catégories (Tags)
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Désactive visuellement toutes les pilules
            filterButtons.forEach(b => b.classList.remove('active'));
            // Active celle cliquée
            e.target.classList.add('active');

            // Met à jour le tag ciblé (ex: "végétarien")
            currentTag = e.target.dataset.tag;
            applyFiltersAndRender(currentSearchQuery, currentTag);
        });
    });
}