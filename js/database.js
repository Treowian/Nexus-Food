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

// L'algorithme devient asynchrone (async)
export async function getRecommendations(userStock) {
    // On attend (await) que Supabase nous renvoie les recettes
    const recettesBDD = await fetchRecipes();

    const recettesCalculees = recettesBDD.map(recette => {
        let missingCount = 0;
        let missingItems = [];

        recette.ingredients.forEach(ing => {
            if (!userStock.has(ing)) {
                missingCount++;
                missingItems.push(ing);
            }
        });

        return { ...recette, missingCount, missingItems };
    });

    recettesCalculees.sort((a, b) => a.missingCount - b.missingCount);
    return recettesCalculees;
}