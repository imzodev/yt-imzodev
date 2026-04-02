/// <reference types="astro/client" />

import type { SupabaseClient, Session, User } from '@supabase/supabase-js';

declare namespace App {
  interface Locals {
    session: Session | null;
    user: User | null;
    supabase: SupabaseClient;
    userRole: string | null;
  }
}
