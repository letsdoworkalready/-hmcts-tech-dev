# HMCTS Task Manager - Frontend + Backend

The GOV.UK-styled frontend for the HMCTS caseworker task management system.

## Development Environment

This repository includes a VS Code devcontainer configuration for consistent development environments. When opening this repo in GitHub Codespaces, the devcontainer will automatically set up:

- Java 21 (for the backend)
- Node.js 18 (for the frontend)
- Yarn package manager
- All required dependencies

To use the devcontainer in Codespaces:
1. Open the repo in Codespaces
2. VS Code will prompt to reopen in the devcontainer
3. Click "Reopen in Container" to proceed

This ensures both frontend and backend can run without manual environment setup.

## Application Flow

1. **Welcome screen** (`/welcome`) - caseworker enters their name before accessing the app.
2. **Tasks** (`/tasks`) - after sign-in you land on the **Kanban** board by default (three columns: To do, In progress, Done). Use the view control to open **List view** at `/tasks?view=list` for a sortable table with a **Filters** sidebar (status checkboxes and sort by due date).
3. **Create task** (`/tasks/new`) - form to create a new task.
4. **Edit task** (`/tasks/:id/edit`) - form to update task details or status.
5. **Delete task** - delete control on each task (Kanban cards and list rows) with a confirmation dialog.

The caseworker's name is stored in an HTTP-only server-side session cookie and sent as the `X-Actor-Name` header on all mutating API requests, populating the audit trail.

### Task views (Kanban and List)

**Kanban** is the default. **List** adds filters and due-date ordering for the same data.

![Kanban view - default board after sign-in](hmcts-dev-test-frontend/assets/kanbanView.png)

![List view - table with filters and sort](hmcts-dev-test-frontend/assets/listView.png)


## Design Decisions

- **Progressive enhancement and GOV.UK-friendly flows** - task create, update, and delete use standard HTML form POSTs handled entirely on the server, so the service remains usable without relying on client-side scripting for core actions.
- **Server-side API calls only** - the frontend proxies all API requests server-side via axios, which keeps the backend URL private and simplifies deployment without cross-origin browser configuration.
- **Session-backed caseworker context** - the caseworker’s name lives in an express-session cookie so each request behaves like a signed-in user for this exercise, giving a realistic task workflow without building a full user authentication stack.
- **Resilience and Validation** - form submissions include server-side validation (e.g. mandatory caseworker name). If the backend API becomes unavailable, the frontend gracefully catches the 500/503 errors and renders a GOV.UK styled error banner rather than crashing, ensuring a robust user experience.
