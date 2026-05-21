// js/database.js

// 1. Notre fausse base de données (Le prototype de tes futures tables Supabase)
const recettesBDD = [
    { 
        id: 1, 
        title: "Omelette au Fromage", 
        time: "10 min", 
        img: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=600&q=80",
        ingredients: ["Œuf", "Fromage râpé", "Beurre"] 
    },
    { 
        id: 2, 
        title: "Pâtes Tomate Basilic", 
        time: "15 min", 
        img: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=600&q=80",
        ingredients: ["Pâtes", "Tomate", "Ail"] 
    },
    { 
        id: 3, 
        title: "Poulet Rôti Oignons", 
        time: "45 min", 
        img: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=600&q=80",
        ingredients: ["Poulet", "Oignon", "Beurre"] 
    }
];

// 2. L'Algorithme de recommandation (Le cœur de l'app)
export function getRecommendations(userStock) {
    // Étape A : On calcule les manquants pour chaque recette
    const recettesCalculees = recettesBDD.map(recette => {
        let missingCount = 0;
        let missingItems = [];

        recette.ingredients.forEach(ing => {
            // Si l'ingrédient n'est pas dans le Set du frigo
            if (!userStock.has(ing)) {
                missingCount++;
                missingItems.push(ing);
            }
        });

        // On retourne la recette avec ses nouvelles stats
        return { ...recette, missingCount, missingItems };
    });

    // Étape B : On trie de la plus réalisable à la moins réalisable
    // Celles avec 0 manquant apparaîtront en premier
    recettesCalculees.sort((a, b) => a.missingCount - b.missingCount);

    return recettesCalculees;
}