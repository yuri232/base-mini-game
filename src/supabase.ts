import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://fwtgdwbjwdeglxyybyku.supabase.co"
const supabaseAnonKey = "sb_publishable_jFx12ak_nYAxPgf-VNET-g_uDZKNtIg"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
