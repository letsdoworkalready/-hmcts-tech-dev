# HMCTS Task Manager - Backend

A Spring Boot REST API for the HMCTS caseworker task management system.

## Tech Stack

- Java 21
- Spring Boot 3.5
- Spring Data JPA + Hibernate 6
- SQLite (file-based database, no external server required)
- SpringDoc OpenAPI 2 (Swagger UI)
- Lombok

## Running Locally

### Prerequisites

- Java 21+
- Gradle (wrapper included)

### Start the API

```bash
./gradlew bootRun
```

The API starts on **http://localhost:4000**.

The SQLite database file is created automatically at `./data/tasks.db` relative to the working directory. The `data/` directory is included in the repository (via `.gitkeep`) so the app starts without any manual setup. The `.db` file itself is git-ignored.

### API Documentation (Swagger UI)

Once running, visit:

```
http://localhost:4000/swagger-ui/index.html
```

## API Endpoints

| Method   | Path                 | Description        | Required Headers |
| -------- | -------------------- | ------------------ | ---------------- |
| `POST`   | `/tasks`             | Create a task      | `X-Actor-Name`   |
| `GET`    | `/tasks`             | List all tasks     | -                |
| `GET`    | `/tasks/{id}`        | Get task by ID     | -                |
| `PUT`    | `/tasks/{id}`        | Update a task      | `X-Actor-Name`   |
| `PATCH`  | `/tasks/{id}/status` | Update task status | `X-Actor-Name`   |
| `DELETE` | `/tasks/{id}`        | Delete a task      | `X-Actor-Name`   |

### X-Actor-Name Header

Mutating requests (POST, PUT, PATCH, DELETE) require an `X-Actor-Name` header containing the caseworker's display name. This is used to populate the `createdBy` and `updatedBy` audit fields.

### Task Fields

| Field         | Type             | Notes                                        |
| ------------- | ---------------- | -------------------------------------------- |
| `title`       | `string`         | Required, max 255 characters                 |
| `description` | `string`         | Optional, max 1000 characters                |
| `status`      | `enum`           | `TODO`, `IN_PROGRESS`, or `DONE`             |
| `dueDateTime` | `OffsetDateTime` | ISO-8601 format, e.g. `2026-06-01T09:00:00Z` |
| `createdAt`   | `OffsetDateTime` | Set automatically                            |
| `createdBy`   | `string`         | Set from `X-Actor-Name` on creation          |
| `updatedAt`   | `OffsetDateTime` | Updated automatically                        |
| `updatedBy`   | `string`         | Set from `X-Actor-Name` on mutation          |

### Example: Create a Task

```bash
curl -X POST http://localhost:4000/tasks \
  -H "Content-Type: application/json" \
  -H "X-Actor-Name: Alice" \
  -d '{
    "title": "Review claim documents",
    "description": "Check all submitted evidence for case 12345",
    "status": "TODO",
    "dueDateTime": "2026-06-15T17:00:00Z"
  }'
```

## Running Tests

Automated checks use JUnit 5 and Gradle `Test` tasks.

| Command                 | What it covers                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `./gradlew test`        | **Unit tests** – task REST controller (`TaskControllerTest`), task service (`TaskServiceTest`), and a small sample unit test |
| `./gradlew integration` | **Integration tests** – web-layer test for the welcome/root controller (`GetWelcomeTest`)                                    |
| `./gradlew functional`  | **Functional test** – full Spring context; HTTP request via Rest Assured to the embedded server (sample checks `GET /`)      |
| `./gradlew smoke`       | **Smoke test** – same pattern as functional for a quick HTTP check on `GET /`                                                |

Run unit, integration, functional, and smoke in one go:

```bash
./gradlew test integration functional smoke
```

`./gradlew check` (and therefore `./gradlew build`) runs **unit** and **integration** tests. Functional and smoke are optional extras; run them explicitly when you want full HTTP coverage of the booted app (root path returns the welcome payload in the sample tests).

## Design Notes

- **SQLite** - The API uses an embedded database so local development and review need no separate database server. Commented **PostgreSQL** datasource settings in `application.yaml` show how the same JPA layer would target a shared database in a team or hosted environment.
- **Audit trail** - Every task stores `createdAt`, `createdBy`, `updatedAt`, and `updatedBy`. The caseworker display name for those fields comes from the **`X-Actor-Name`** header on write requests, aligned with the companion frontend’s welcome step and session-backed name.
- **Attestational actor for this exercise** - Write operations carry the caseworker display name in **`X-Actor-Name`**, populated from the companion app after the welcome step, so every change has traceable attribution in `createdBy` / `updatedBy` while keeping this repository focused on tasks and persistence. The same audit columns can later be driven by stronger identities when a product team extends the stack.
