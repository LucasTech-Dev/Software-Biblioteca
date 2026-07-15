import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://akfwjvlwhvdabwgjbobi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JuyfXKDPMxjjhO5c9CUvLg_lnvEAe89";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);