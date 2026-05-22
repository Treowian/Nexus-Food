// js/supabase.js
// Import direct de la librairie Supabase depuis le web (ESM)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// ⚠️ À REMPLACER par tes vraies clés Supabase
const supabaseUrl = 'https://mherlbhfdeipvrztqexp.supabase.co/rest/v1/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oZXJsYmhmZGVpcHZyenRxZXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjI3MzAsImV4cCI6MjA5NTAzODczMH0.gJCPDiBxk-Q3r_lnRRjTE7RVmIQ_KeFCz66jRyCAAQo';

// Création et exportation du client de connexion
export const supabase = createClient(supabaseUrl, supabaseKey);