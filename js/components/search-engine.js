// js/components/search-engine.js

let currentSearchQuery = '';
let currentTag = 'all';

// On reçoit la fonction de rendu en paramètre (renderCallback)
export function initSearchEngine(renderCallback) {
    const searchInput = document.getElementById('recipe-search-input');
    const filterButtons = document.querySelectorAll('.filter-tag');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.toLowerCase().trim();
        // On utilise la fonction qu'on nous a donnée
        renderCallback(currentSearchQuery, currentTag);
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            currentTag = e.target.dataset.tag;
            renderCallback(currentSearchQuery, currentTag);
        });
    });
}