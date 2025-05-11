// /lib/fetchPersonas.ts

import { supabase } from './supabaseClient';

export const fetchPersonas = async () => {
    const { data, error } = await supabase.from('Persona').select('*');

    if (error) {
        console.error('Error fetching personas:', error);
        throw error;
    }

    return data;
};