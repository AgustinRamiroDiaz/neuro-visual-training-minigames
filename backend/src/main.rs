#[macro_use]
extern crate rocket;

use chrono::{DateTime, Utc};
use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::{Header, Method, Status};
use rocket::request::Request;
use rocket::response::{Responder, Response};
use rocket::serde::json::{json, Json, Value};
use rocket::{Build, Rocket, State};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPoolOptions;
use sqlx::{FromRow, PgPool};
use std::env;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow)]
struct User {
    id: Uuid,
    username: String,
    display_name: Option<String>,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct CreateUserRequest {
    username: String,
    display_name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct LoginRequest {
    username: String,
}

#[derive(Debug, Serialize, FromRow)]
struct UserPreferences {
    user_id: Uuid,
    preferences: Value,
    updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct SavePreferencesRequest {
    preferences: Value,
}

#[derive(Debug, Serialize, FromRow)]
struct PlayHistoryRecord {
    id: Uuid,
    client_id: String,
    user_id: Uuid,
    timestamp: DateTime<Utc>,
    game_id: String,
    game_name: String,
    metadata: Value,
}

#[derive(Debug, Deserialize)]
struct CreateHistoryRecordRequest {
    id: Option<String>,
    timestamp: DateTime<Utc>,
    game_id: String,
    game_name: String,
    metadata: Value,
}

#[derive(Debug, Serialize)]
struct SyncResponse {
    user: User,
    preferences: Value,
    history: Vec<PlayHistoryRecord>,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
}

#[derive(Debug)]
struct ApiError {
    status: Status,
    message: String,
}

impl ApiError {
    fn bad_request(message: impl Into<String>) -> Self {
        Self {
            status: Status::BadRequest,
            message: message.into(),
        }
    }

    fn not_found(message: impl Into<String>) -> Self {
        Self {
            status: Status::NotFound,
            message: message.into(),
        }
    }

    fn conflict(message: impl Into<String>) -> Self {
        Self {
            status: Status::Conflict,
            message: message.into(),
        }
    }

    fn internal(error: impl std::fmt::Display) -> Self {
        Self {
            status: Status::InternalServerError,
            message: error.to_string(),
        }
    }
}

impl<'r> Responder<'r, 'static> for ApiError {
    fn respond_to(self, request: &'r Request<'_>) -> rocket::response::Result<'static> {
        Response::build_from(Json(ErrorResponse { error: self.message }).respond_to(request)?)
            .status(self.status)
            .ok()
    }
}

#[get("/health")]
fn health() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}

#[post("/users", data = "<request>")]
async fn create_user(
    pool: &State<PgPool>,
    request: Json<CreateUserRequest>,
) -> Result<Json<User>, ApiError> {
    let username = request.username.trim();

    if username.is_empty() {
        return Err(ApiError::bad_request("username is required"));
    }

    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (username, display_name)
        VALUES ($1, $2)
        RETURNING id, username, display_name, created_at
        "#,
    )
    .bind(username)
    .bind(request.display_name.as_deref())
    .fetch_one(pool.inner())
    .await
    .map_err(map_insert_user_error)?;

    sqlx::query(
        r#"
        INSERT INTO user_preferences (user_id, preferences)
        VALUES ($1, '{}'::jsonb)
        ON CONFLICT (user_id) DO NOTHING
        "#,
    )
    .bind(user.id)
    .execute(pool.inner())
    .await
    .map_err(ApiError::internal)?;

    Ok(Json(user))
}

#[post("/login", data = "<request>")]
async fn login(pool: &State<PgPool>, request: Json<LoginRequest>) -> Result<Json<User>, ApiError> {
    let username = request.username.trim();

    if username.is_empty() {
        return Err(ApiError::bad_request("username is required"));
    }

    let user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, display_name, created_at
        FROM users
        WHERE username = $1
        "#,
    )
    .bind(username)
    .fetch_optional(pool.inner())
    .await
    .map_err(ApiError::internal)?
    .ok_or_else(|| ApiError::not_found("user not found"))?;

    Ok(Json(user))
}


#[get("/users/<user_id>/preferences")]
async fn get_preferences(
    pool: &State<PgPool>,
    user_id: &str,
) -> Result<Json<UserPreferences>, ApiError> {
    let user_id = parse_user_id(user_id)?;
    ensure_user_exists(pool.inner(), user_id).await?;

    let preferences = upsert_empty_preferences(pool.inner(), user_id).await?;

    Ok(Json(preferences))
}

#[put("/users/<user_id>/preferences", data = "<request>")]
async fn save_preferences(
    pool: &State<PgPool>,
    user_id: &str,
    request: Json<SavePreferencesRequest>,
) -> Result<Json<UserPreferences>, ApiError> {
    let user_id = parse_user_id(user_id)?;
    ensure_user_exists(pool.inner(), user_id).await?;

    let preferences = sqlx::query_as::<_, UserPreferences>(
        r#"
        INSERT INTO user_preferences (user_id, preferences, updated_at)
        VALUES ($1, $2, now())
        ON CONFLICT (user_id)
        DO UPDATE SET preferences = EXCLUDED.preferences, updated_at = now()
        RETURNING user_id, preferences, updated_at
        "#,
    )
    .bind(user_id)
    .bind(&request.preferences)
    .fetch_one(pool.inner())
    .await
    .map_err(ApiError::internal)?;

    Ok(Json(preferences))
}

#[get("/users/<user_id>/history")]
async fn list_history(
    pool: &State<PgPool>,
    user_id: &str,
) -> Result<Json<Vec<PlayHistoryRecord>>, ApiError> {
    let user_id = parse_user_id(user_id)?;
    ensure_user_exists(pool.inner(), user_id).await?;

    let history = get_history(pool.inner(), user_id).await?;

    Ok(Json(history))
}

#[post("/users/<user_id>/history", data = "<request>")]
async fn create_history_record(
    pool: &State<PgPool>,
    user_id: &str,
    request: Json<CreateHistoryRecordRequest>,
) -> Result<Json<PlayHistoryRecord>, ApiError> {
    let user_id = parse_user_id(user_id)?;
    ensure_user_exists(pool.inner(), user_id).await?;
    let client_id = request
        .id
        .as_deref()
        .filter(|id| !id.trim().is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    let record = sqlx::query_as::<_, PlayHistoryRecord>(
        r#"
        INSERT INTO play_history (client_id, user_id, timestamp, game_id, game_name, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, client_id, user_id, timestamp, game_id, game_name, metadata
        "#,
    )
    .bind(client_id)
    .bind(user_id)
    .bind(request.timestamp)
    .bind(request.game_id.trim())
    .bind(request.game_name.trim())
    .bind(&request.metadata)
    .fetch_one(pool.inner())
    .await
    .map_err(ApiError::internal)?;

    Ok(Json(record))
}

#[put("/users/<user_id>/history", data = "<request>")]
async fn replace_history(
    pool: &State<PgPool>,
    user_id: &str,
    request: Json<Vec<CreateHistoryRecordRequest>>,
) -> Result<Json<Vec<PlayHistoryRecord>>, ApiError> {
    let user_id = parse_user_id(user_id)?;
    ensure_user_exists(pool.inner(), user_id).await?;

    let mut transaction = pool.inner().begin().await.map_err(ApiError::internal)?;

    sqlx::query("DELETE FROM play_history WHERE user_id = $1")
        .bind(user_id)
        .execute(&mut *transaction)
        .await
        .map_err(ApiError::internal)?;

    for record in request.iter() {
        let client_id = record
            .id
            .as_deref()
            .filter(|id| !id.trim().is_empty())
            .map(str::to_string)
            .unwrap_or_else(|| Uuid::new_v4().to_string());

        sqlx::query(
            r#"
            INSERT INTO play_history (client_id, user_id, timestamp, game_id, game_name, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
        )
        .bind(client_id)
        .bind(user_id)
        .bind(record.timestamp)
        .bind(record.game_id.trim())
        .bind(record.game_name.trim())
        .bind(&record.metadata)
        .execute(&mut *transaction)
        .await
        .map_err(ApiError::internal)?;
    }

    transaction.commit().await.map_err(ApiError::internal)?;
    let history = get_history(pool.inner(), user_id).await?;

    Ok(Json(history))
}

#[get("/users/<user_id>/sync")]
async fn get_sync(pool: &State<PgPool>, user_id: &str) -> Result<Json<SyncResponse>, ApiError> {
    let user_id = parse_user_id(user_id)?;
    let user = get_user(pool.inner(), user_id).await?;
    let preferences = upsert_empty_preferences(pool.inner(), user_id).await?;
    let history = get_history(pool.inner(), user_id).await?;

    Ok(Json(SyncResponse {
        user,
        preferences: preferences.preferences,
        history,
    }))
}

#[options("/<_..>")]
fn cors_preflight() -> Status {
    Status::NoContent
}

fn parse_user_id(user_id: &str) -> Result<Uuid, ApiError> {
    Uuid::parse_str(user_id).map_err(|_| ApiError::bad_request("invalid user id"))
}

async fn get_user(pool: &PgPool, user_id: Uuid) -> Result<User, ApiError> {
    sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, display_name, created_at
        FROM users
        WHERE id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
    .map_err(ApiError::internal)?
    .ok_or_else(|| ApiError::not_found("user not found"))
}

async fn ensure_user_exists(pool: &PgPool, user_id: Uuid) -> Result<(), ApiError> {
    get_user(pool, user_id).await.map(|_| ())
}

async fn upsert_empty_preferences(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<UserPreferences, ApiError> {
    sqlx::query_as::<_, UserPreferences>(
        r#"
        INSERT INTO user_preferences (user_id, preferences)
        VALUES ($1, '{}'::jsonb)
        ON CONFLICT (user_id)
        DO UPDATE SET user_id = EXCLUDED.user_id
        RETURNING user_id, preferences, updated_at
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map_err(ApiError::internal)
}

async fn get_history(pool: &PgPool, user_id: Uuid) -> Result<Vec<PlayHistoryRecord>, ApiError> {
    sqlx::query_as::<_, PlayHistoryRecord>(
        r#"
        SELECT id, client_id, user_id, timestamp, game_id, game_name, metadata
        FROM play_history
        WHERE user_id = $1
        ORDER BY timestamp DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
    .map_err(ApiError::internal)
}

fn map_insert_user_error(error: sqlx::Error) -> ApiError {
    if let sqlx::Error::Database(database_error) = &error {
        if database_error.constraint() == Some("users_username_key") {
            return ApiError::conflict("username already exists");
        }
    }

    ApiError::internal(error)
}

async fn build_rocket() -> Rocket<Build> {
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://neuro:neuro@localhost:5432/neuro_training".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("failed to connect to postgres");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("failed to run database migrations");

    rocket::build()
        .manage(pool)
        .attach(Cors)
        .mount(
            "/api",
            routes![
                health,
                create_user,
                login,
                get_preferences,
                save_preferences,
                list_history,
                create_history_record,
                replace_history,
                get_sync,
                cors_preflight
            ],
        )
}

#[launch]
async fn rocket() -> Rocket<Build> {
    build_rocket().await
}

struct Cors;

#[rocket::async_trait]
impl Fairing for Cors {
    fn info(&self) -> Info {
        Info {
            name: "CORS",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        let requested_headers = request
            .headers()
            .get_one("Access-Control-Request-Headers")
            .unwrap_or("authorization, content-type");

        response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
        response.set_header(Header::new("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS"));
        response.set_header(Header::new("Access-Control-Allow-Headers", requested_headers));
        response.set_header(Header::new("Access-Control-Max-Age", "86400"));

        if request.method() == Method::Options {
            response.set_status(Status::NoContent);
        }
    }
}
