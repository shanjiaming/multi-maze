import { createClient } from '@supabase/supabase-js';

// Project: multi-maze (US Region)
const supabaseUrl = 'https://mgklxpcuujodjwsbusxz.supabase.co';
const supabaseKey = 'sb_publishable_plKCVT36EgZjTYrJpcoE8g_6Ct84bVf';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to check if backend is ready
export const isBackendReady = () => true;
