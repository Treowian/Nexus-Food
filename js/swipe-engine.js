// js/swipe-engine.js
import { getStock } from './fridge.js';
import { getRecommendations } from './database.js';
import { addMissingItems } from './shopping.js';

// Dictionnaire d'affinement
const categoriesTree = {
    "plat": {
        label: "Plat Principal",
        subs: [
            { id: "chaud", label: "🔥 Un bon plat chaud" },
            { id: "froid", label: "❄️ Quelque chose de froid" },
            { id: "viande", label: "🥩 Avec de la viande" },
            { id: "poisson", label: "🐟 Côté mer / Poisson" },
            { id: "végé", label: "🥦 100% Végétarien" }
        ]
    },
    "apero": {
        label: "Apéro & Entrée",
        subs: [
            { id: "partager", label: "🧀 Un truc à partager / Tapas" },
            { id: "individuel", label: "🥄 Une entrée individuelle" },
            { id: "boissons", label: "🍹 Boissons & Cocktails" }
        ]
    },
    "sucre": {
        label: "Dessert & Goûter",
        subs: [
            { id: "chocolat", label: "🍫 Tout chocolat" },
            { id: "fruite", label: "🍓 Fruité & Léger" },
            { id: "petitdej", label: "🥐 Brunch & Petit-déj" }
        ]
    },
    "healthy": {
        label: "Healthy & Léger",
        subs: [
            { id: "chaud", label: "🥣 Soupes & Bowls chauds" },
            { id: "froid", label: "🥬 Grandes Salades fraîches" },
            { id: "proteine", label: "💪 Assiettes Hyper-protéinées" }
        ]
    },
    "express": {
        label: "Express (La flemme)",
        subs: [
            { id: "sanscuisson", label: "🚫 Recettes sans cuisson" },
            { id: "onepot", label: "🍳 One-Pot (Une seule poêle)" },
            { id: "surlepouce", label: "🥪 Sandwichs & Sur le pouce" }
        ]
    }
};

let toutesLesRecettes = []; 
let activeMainCat = '';     

export async function initSwipe() {
    const step1Container = document.getElementById('step-1-container');
    const step2Container = document.getElementById('step-2-container');
    const step3Container = document.getElementById('step-3-container');
    
    const circleButtons = document.querySelectorAll('.circle-btn');
    const btnSkip = document.getElementById('btn-skip-to-all');
    const btnBackTo1 = document.getElementById('btn-back-to-1');
    const btnReset = document.getElementById('btn-reset-funnel');

    if (!step1Container) return;

    if (step2Container) step2Container.style.display = 'none';
    if (step3Container) step3Container.style.display = 'none';
    if (step1Container) step1Container.style.display = 'flex';

    const monFrigo = getStock();
    toutesLesRecettes = await getRecommendations(monFrigo);

    console.log("Données reçues de Supabase :", toutesLesRecettes);

    circleButtons.forEach(btn => {
        btn.onclick = () => {
            activeMainCat = btn.dataset.cat;
            openStep2(activeMainCat);
        };
    });

    if (btnSkip) {
        btnSkip.onclick = () => launchSwipeSession('all', 'all', 'Toutes', 'Recettes');
    }

    if (btnBackTo1) {
        btnBackTo1.onclick = () => {
            step2Container.style.display = 'none';
            step1Container.style.display = 'flex';
        };
    }

    if (btnReset) {
        btnReset.onclick = () => {
            step3Container.style.display = 'none';
            step2Container.style.display = 'none';
            step1Container.style.display = 'flex';
        };
    }
}

function openStep2(catId) {
    const step1Container = document.getElementById('step-1-container');
    const step2Container = document.getElementById('step-2-container');
    const step2Title = document.getElementById('step-2-title');
    const step2List = document.getElementById('step-2-list');

    const catData = categoriesTree[catId];
    if (!catData) return;

    step2Title.innerText = `${catData.label}... plutôt ?`;
    step2List.innerHTML = ''; 

    catData.subs.forEach(sub => {
        const btn = document.createElement('button');
        btn.className = 'sub-row-btn';
        btn.innerHTML = `<span>${sub.label}</span><span class="sub-row-arrow">➔</span>`;
        
        btn.onclick = () => {
            launchSwipeSession(catId, sub.id, catData.label, sub.label.split(' ').slice(1).join(' '));
        };
        
        step2List.appendChild(btn);
    });

    step1Container.style.display = 'none';
    step2Container.style.display = 'flex';
}

function launchSwipeSession(mainTag, subTag, mainLabel, subLabel) {
    document.getElementById('step-1-container').style.display = 'none';
    document.getElementById('step-2-container').style.display = 'none';
    document.getElementById('step-3-container').style.display = 'flex';

    document.getElementById('crumb-main').innerText = mainLabel;
    document.getElementById('crumb-sub').innerText = subLabel;

    const stack = document.getElementById('card-stack');
    stack.innerHTML = ''; 

    const recettesFiltrees = toutesLesRecettes.filter(recipe => {
        if (mainTag === 'all') return true; 
        const containsMain = recipe.tags && recipe.tags.includes(mainTag);
        const containsSub = recipe.tags && recipe.tags.includes(subTag);
        return containsMain && containsSub;
    });

    if (recettesFiltrees.length === 0) {
        stack.innerHTML = '<p style="text-align:center; margin-top:100px; color: var(--text-light); padding: 20px;">Aucune recette ne correspond exactement à cette combinaison pour le moment. 👨‍🍳</p>';
        return;
    }

    recettesFiltrees.reverse().forEach(recipe => {
        const card = document.createElement('article');
        card.className = 'recipe-card';
        card.dataset.missing = JSON.stringify(recipe.missingItems || []); 
        card.dataset.recipe = JSON.stringify(recipe); 
        
        let badgeColor = recipe.missingCount === 0 ? '#2ed573' : 'var(--primary-color)';
        let badgeText = recipe.missingCount === 0 ? '✨ Prêt !' : `⚠️ ${recipe.missingCount} manquant(s)`;

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

    cards.forEach(card => {
        let startX = 0;
        let startY = 0;
        let isDragging = false;

        card.addEventListener('mousedown', startDrag);
        card.addEventListener('touchstart', startDrag, {passive: true});

        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, {passive: false});

        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);

        function startDrag(e) {
            if (e.target.closest('button')) return; // Ignore clics sur boutons
            isDragging = true;
            startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
            startY = e.type.includes('mouse') ? e.pageY : e.touches[0].pageY;
            card.style.transition = 'none';
        }

        function drag(e) {
            if (!isDragging) return;
            const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
            const currentY = e.type.includes('mouse') ? e.pageY : e.touches[0].pageY;
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            
            // Rotation légère pendant le swipe
            const rotate = deltaX * 0.05;
            card.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg)`;
            
            // Empêcher le scroll vertical de la page si on swipe horizontalement
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                e.preventDefault();
            }
        }

        function endDrag(e) {
            if (!isDragging) return;
            isDragging = false;
            
            const currentX = e.type.includes('mouse') ? e.pageX : (e.changedTouches ? e.changedTouches[0].pageX : startX);
            const deltaX = currentX - startX;

            card.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            
            if (deltaX > 100) {
                // Swipe Droit
                card.style.transform = `translate(${window.innerWidth}px, 0) rotate(20deg)`;
                card.style.opacity = '0';
                setTimeout(() => swipeCard(card, 'droite'), 300);
            } else if (deltaX < -100) {
                // Swipe Gauche
                card.style.transform = `translate(-${window.innerWidth}px, 0) rotate(-20deg)`;
                card.style.opacity = '0';
                setTimeout(() => swipeCard(card, 'gauche'), 300);
            } else {
                // Retour au centre (si click ou pas assez swipé)
                card.style.transform = 'translate(0px, 0px) rotate(0deg)';
                if (Math.abs(deltaX) < 10) {
                    const recipeData = JSON.parse(card.dataset.recipe);
                    openCookingMode(recipeData);
                }
            }
        }
    });
}

function swipeCard(card, choix) {
    card.remove();
    
    if(choix === 'droite') {
        import('./navigation.js').then(module => {
            module.showToast("Recette ajoutée au Menu 📅");
        });
        
        import('./menu.js').then(menuModule => {
            const recipeData = JSON.parse(card.dataset.recipe);
            menuModule.addToMenu(recipeData);
        });
    }
}

export function openCookingMode(recipe) {
    const modal = document.getElementById('recipe-modal');
    const content = document.getElementById('modal-content');
    
    if (!modal || !content) return;

    let ingredientsHTML = '';
    if(recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ing => {
            ingredientsHTML += `<li>${ing.name} ${ing.qty ? `<span style="color:var(--text-light)">(${ing.qty})</span>` : ''}</li>`;
        });
    }

    let stepsHTML = '';
    if(recipe.steps && recipe.steps.length > 0) {
        recipe.steps.forEach((step, index) => {
            stepsHTML += `<p><strong>Étape ${index + 1} :</strong> ${step}</p>`;
        });
    }

    content.innerHTML = `
        <img src="${recipe.img}" alt="${recipe.title}" style="width:100%; height:250px; object-fit:cover; border-radius:12px 12px 0 0;">
        <div style="padding:20px;">
            <h2 style="margin-top:0; color:var(--text-color);">${recipe.title}</h2>
            <div style="margin-bottom:20px;">
                <span style="background:var(--bg-color); padding:6px 12px; border-radius:16px; font-size:0.9rem; font-weight:bold;">⏳ ${recipe.time}</span>
            </div>
            
            <h3 style="color:var(--primary-color);">Ingrédients</h3>
            <ul style="padding-left:20px; line-height:1.6; color:var(--text-color);">
                ${ingredientsHTML}
            </ul>

            <h3 style="color:var(--primary-color); margin-top:24px;">Préparation</h3>
            <div style="line-height:1.6; color:var(--text-color);">
                ${stepsHTML}
            </div>
        </div>
    `;

    modal.classList.add('show');

    const btnClose = document.getElementById('close-modal');
    btnClose.onclick = () => {
        modal.classList.remove('show');
    };
}