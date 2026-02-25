from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Supabase
    supabase_url: str
    supabase_service_key: str
    supabase_anon_key: str

    # App
    app_name: str = "Oryn API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # CORS
    allowed_origins: list[str] = ["*"]


settings = Settings()
