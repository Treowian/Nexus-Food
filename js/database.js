// js/database.js
import { supabase } from './supabase.js';

// Va chercher les recettes en ligne au lieu d'un tableau local
async function fetchRecipes() {
    const { data, error } = await supabase.from('recipes').select('*');
    
    if (error) {
        console.error("Erreur de connexion aux recettes :", error);
        return [];
    }
    return data;
}

// Dans js/database.js
export async function getRecommendations(userStock) {
    const recettesBDD = await fetchRecipes();

    const recettesCalculees = recettesBDD.map(recette => {
        let missingCount = 0;
        let missingItems = [];

        recette.ingredients.forEach(ing => {
            if (!userStock.has(ing.name)) {
                missingCount++;
                // ⚠️ On stocke maintenant l'objet ingrédient complet (nom + qté)
                missingItems.push({ name: ing.name, qty: ing.qty });
            }
        });

        return { ...recette, missingCount, missingItems };
    });

    recettesCalculees.sort((a, b) => a.missingCount - b.missingCount);
    return recettesCalculees;
}