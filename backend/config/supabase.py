from supabase import create_client, Client
from .settings import settings


def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_key)


def get_supabase_anon_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_anon_key)


# Service-role client for backend operations (bypasses RLS)
supabase: Client = get_supabase_client()
