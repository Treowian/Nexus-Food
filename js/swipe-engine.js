// js/swipe-engine.js
import { getStock } from './fridge.js';
import { getRecommendations } from './database.js';
import { addMissingItems } from './shopping.js';

// 1. Définition de l'arbre de décision (Dictionnaire d'affinement)
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

let toutesLesRecettes = []; // Cache global des recommandations triées par le frigo
let activeMainCat = '';     // Stocke la catégorie principale choisie (ex: 'plat')

export async function initSwipe() {
    // Éléments HTML
    const step1Container = document.getElementById('step-1-container');
    const step2Container = document.getElementById('step-2-container');
    const step3Container = document.getElementById('step-3-container');
    
    const circleButtons = document.querySelectorAll('.circle-btn');
    const btnSkip = document.getElementById('btn-skip-to-all');
    const btnBackTo1 = document.getElementById('btn-back-to-1');
    const btnReset = document.getElementById('btn-reset-funnel');

    if (!step1Container) return;

    // Chargement initial et tri en arrière-plan selon le vrai frigo
    const monFrigo = getStock();
    toutesLesRecettes = await getRecommendations(monFrigo);

    // Événement Étape 1 : Clic sur une grosse bulle d'envie
    circleButtons.forEach(btn => {
        btn.onclick = () => {
            activeMainCat = btn.dataset.cat;
            openStep2(activeMainCat);
        };
    });

    // Événement Étape 1 : Bouton "Tout voir"
    if (btnSkip) {
        btnSkip.onclick = () => launchSwipeSession('all', 'all', 'Toutes', 'Recettes');
    }

    // Événement Étape 2 : Bouton retour vers l'étape 1
    if (btnBackTo1) {
        btnBackTo1.onclick = () => {
            step2Container.style.display = 'none';
            step1Container.style.display = 'flex';
        };
    }

    // Événement Étape 3 : Bouton croix pour réinitialiser tout le parcours
    if (btnReset) {
        btnReset.onclick = () => {
            step3Container.style.display = 'none';
            step2Container.style.display = 'none';
            step1Container.style.display = 'flex';
        };
    }
}

// Ouvre l'étape 2 et génère les lignes d'affinement dynamiquement
function openStep2(catId) {
    const step1Container = document.getElementById('step-1-container');
    const step2Container = document.getElementById('step-2-container');
    const step2Title = document.getElementById('step-2-title');
    const step2List = document.getElementById('step-2-list');

    const catData = categoriesTree[catId];
    if (!catData) return;

    // Mise à jour du titre
    step2Title.innerText = `${catData.label}... plutôt ?`;
    step2List.innerHTML = ''; // Nettoyage de la liste précédente

    // Injection dynamique des sous-catégories définies dans le dictionnaire
    catData.subs.forEach(sub => {
        const btn = document.createElement('button');
        btn.className = 'sub-row-btn';
        btn.innerHTML = `<span>${sub.label}</span><span class="sub-row-arrow">➔</span>`;
        
        // Au clic, on déclenche le filtrage final et la session de swipe !
        btn.onclick = () => {
            launchSwipeSession(catId, sub.id, catData.label, sub.label.split(' ').slice(1).join(' '));
        };
        
        step2List.appendChild(btn);
    });

    // Animation visuelle (changement de calque)
    step1Container.style.display = 'none';
    step2Container.style.display = 'flex';
}

// Étape 3 : Filtre et affiche la pile de cartes finale
function launchSwipeSession(mainTag, subTag, mainLabel, subLabel) {
    document.getElementById('step-1-container').style.display = 'none';
    document.getElementById('step-2-container').style.display = 'none';
    document.getElementById('step-3-container').style.display = 'flex';

    // Mise à jour du fil d'Ariane (breadcrumbs)
    document.getElementById('crumb-main').innerText = mainLabel;
    document.getElementById('crumb-sub').innerText = subLabel;

    const stack = document.getElementById('card-stack');
    stack.innerHTML = ''; // Nettoyage

    // 🧠 LE FILTRAGE MAGIQUE MULTI-NIVEAU
    const recettesFiltrees = toutesLesRecettes.filter(recipe => {
        if (mainTag === 'all') return true; // Cas du bouton "Tout voir"
        
        // La recette doit contenir le tag principal ET le sous-tag
        const containsMain = recipe.tags && recipe.tags.includes(mainTag);
        const containsSub = recipe.tags && recipe.tags.includes(subTag);
        
        return containsMain && containsSub;
    });

    if (recettesFiltrees.length === 0) {
        stack.innerHTML = '<p style="text-align:center; margin-top:100px; color: var(--text-light); padding: 20px;">Aucune recette ne correspond exactement à cette combinaison pour le moment. 👨‍🍳</p>';
        return;
    }

    // Affichage physique des cartes filtrées
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

// ... CONSERVE STRICTEMENT LE RESTE DE TON FICHIER (attachSwipeEvents, swipeCard, openCookingMode) ...