// js/navigation.js

// js/navigation.js

// On ajoute le paramètre "onNavigate"
export function initNavigation(onNavigate) {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            views.forEach(view => view.classList.remove('active'));

            item.classList.add('active');
            
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            // ⚠️ NOUVEAU : Si une fonction a été fournie, on l'appelle en lui donnant le nom du nouvel onglet
            if (typeof onNavigate === 'function') {
                onNavigate(targetId);
            }
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