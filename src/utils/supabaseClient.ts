import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

/**
 * Creates a standard admin/anon client based on ENV vars
 */
export const getAdminClient = () => {
    return createClient(supabaseUrl, supabaseKey);
};

/**
 * Creates a Supabase client that acts on behalf of the user using their JWT token
 * @param token The user's JWT Bearer token
 */
export const createAuthClient = (token: string) => {
    return createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });
};
