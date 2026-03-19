import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jylqektxrseflcfpwhwd.supabase.co';
// Using the default publishable key
const supabaseKey = 'sb_publishable_NsoVrVYbZpfgC4ESl5Pqww_bwiKL9DG';

export const supabase = createClient(supabaseUrl, supabaseKey);
