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
            // ⚠️ On regarde "ing.name" au lieu de "ing"
            if (!userStock.has(ing.name)) {
                missingCount++;
                missingItems.push(ing.name);
            }
        });

        return { ...recette, missingCount, missingItems };
    });

    recettesCalculees.sort((a, b) => a.missingCount - b.missingCount);
    return recettesCalculees;
}