// js/navigation.js

export function initNavigation() {
    // On sélectionne tous les boutons du bas et toutes nos vues (main)
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // 1. On retire l'état "actif" de tous les boutons et de toutes les vues
            navItems.forEach(nav => nav.classList.remove('active'));
            views.forEach(view => view.classList.remove('active'));

            // 2. On active uniquement le bouton cliqué
            item.classList.add('active');

            // 3. On affiche la vue correspondante grâce à l'attribut data-target
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// Petit bonus : Le Toast (Notification) réutilisable partout
export function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = message;
    toast.classList.add('show');
    
    // On le cache automatiquement après 3 secondes
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}