# AI Backend + Login Design

## Goal

Upgrade the existing Vite + React site into a public-facing web app with:
- email registration/login/logout
- user-isolated AI chat history under the `/ai` module
- multiple conversations per user with create/switch behavior
- per-conversation memory only (no cross-conversation long-term memory)
- backend-only model access through the provided relay API
- file, image, and audio input support

This design intentionally prioritizes a simple first production version over a highly abstract architecture.

## Chosen approach

Use:
- **Frontend:** existing Vite + React app
- **Backend:** Express server added to this repository
- **Database:** PostgreSQL
- **Auth:** email + password with server-managed session cookie
- **AI integration:** backend relay to the provided OpenAI-compatible relay endpoint using model `gpt-5`

This approach is preferred because the current project already includes `express`, the AI key must stay on the server, and public deployment with per-user chat history is better served by PostgreSQL than SQLite or JSON files.

## Existing project context

The current app is a React single-page application using `react-router-dom` routes from `src/App.tsx`:
- `/` → marketing homepage
- `/shop` → catalog experience
- `/recycle` → recycling workflow and map lookup
- `/ai` → currently a static AI assistant UI mock

The current AI page in `src/pages/AIAssistant.tsx` already has the right visual shell for:
- collapsible sidebar
- “new chat” action
- chat history list
- message area
- text input area
- buttons for file, image, and voice affordances

So the implementation should preserve the existing page structure and turn it into a real authenticated chat client instead of replacing the whole UI.

## Architecture

### Frontend responsibilities

The React frontend will:
- render auth screens or auth modals
- show login entry on the top-left of the homepage
- maintain logged-in UI state
- list the current user’s conversations in the AI sidebar
- create new conversations
- load messages for the selected conversation
- upload files before or during message send
- submit user prompts to the backend
- render AI responses and attachment states

### Backend responsibilities

The Express backend will:
- handle registration, login, logout, and session validation
- own all access to the relay AI API
- persist users, conversations, messages, and attachments in PostgreSQL
- validate that every conversation/message request belongs to the authenticated user
- receive and store uploaded attachments
- extract or prepare attachment content for AI requests
- transcribe audio to text before saving/sending when voice input is used

### Database responsibilities

PostgreSQL will be the source of truth for:
- users
- sessions or session backing data
- conversations
- messages
- attachment metadata

## Core product behavior

### Auth

First release includes:
- register with email + password
- login with email + password
- logout

It explicitly does **not** include password reset or email verification in the first version.

### Conversation model

Each user has their own isolated set of conversations.

A conversation contains:
- title
- owner user id
- timestamps
- ordered messages

The AI remembers only the current conversation by replaying or reconstructing the message history for that conversation when generating a response.

There is no user-wide long-term memory in the first version.

### Sidebar behavior

The `/ai` page sidebar should support:
- creating a new conversation
- listing prior conversations for the logged-in user
- selecting an older conversation to reopen it

Selecting a conversation loads only that conversation’s messages.

### Attachments

First release supports three input families:
- image
- file
- audio

Processing strategy:
- **Images:** store as attachments and include in the model request using the backend adapter’s supported image-input shape.
- **Files:** accept a restricted set of safe/common formats first; extract readable text when possible and feed that extracted text to the model.
- **Audio:** upload audio file to the backend, transcribe it server-side, then insert the transcription as a user message in the conversation.

## Data model

### `users`
Stores account identity.

Fields:
- `id`
- `email` (unique)
- `password_hash`
- `created_at`
- `updated_at`

### `conversations`
Stores user-owned chat threads.

Fields:
- `id`
- `user_id`
- `title`
- `created_at`
- `updated_at`
- optional `last_message_at`

### `messages`
Stores ordered conversation messages.

Fields:
- `id`
- `conversation_id`
- `role` (`user` or `assistant`)
- `content`
- `created_at`

If needed later, this table can grow fields for model metadata or generation status, but they are not required in the first version.

### `attachments`
Stores uploaded asset metadata.

Fields:
- `id`
- `message_id`
- `kind` (`image`, `file`, `audio`)
- `original_name`
- `mime_type`
- `size_bytes`
- `storage_path` or public/proxied URL
- optional `extracted_text`
- `created_at`

## Key request flows

### Register
1. User submits email and password.
2. Backend validates payload.
3. Backend hashes password.
4. Backend creates `users` row.
5. Backend creates authenticated session and returns success.

### Login
1. User submits email and password.
2. Backend validates credentials.
3. Backend establishes authenticated session cookie.
4. Frontend refreshes user state.

### Create conversation
1. Authenticated user clicks “new chat”.
2. Frontend calls backend create endpoint.
3. Backend creates an empty conversation owned by that user.
4. Frontend selects it in the sidebar and opens the empty thread.

### Load conversation history
1. Frontend requests the current user’s conversation list.
2. Backend returns only conversations owned by that user.
3. Frontend requests a selected conversation’s messages.
4. Backend validates ownership and returns ordered messages plus attachment metadata.

### Send message
1. Frontend ensures a conversation exists.
2. Optional attachments are uploaded first or included in a multipart message flow.
3. Backend validates session and conversation ownership.
4. Backend stores the user message.
5. Backend loads the conversation history.
6. Backend builds the relay-model request using that conversation’s history only.
7. Backend sends the request to the relay API using server-side env vars.
8. Backend stores the assistant reply.
9. Backend returns the reply to the frontend.
10. Frontend appends the assistant message to the active thread.

### Voice input
1. User uploads or records audio.
2. Frontend sends the audio file to the backend.
3. Backend transcribes audio to text.
4. Backend saves the transcription as a user message in the chosen conversation.
5. Backend optionally continues directly into the normal AI reply flow.

## API surface

The exact route names can be adjusted during implementation, but the backend should expose four groups.

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Conversations
- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/:id`

### Messages
- `GET /api/conversations/:id/messages`
- `POST /api/conversations/:id/messages`

### Uploads
- `POST /api/uploads`
- or specialized endpoints such as `POST /api/uploads/image`, `POST /api/uploads/file`, `POST /api/uploads/audio`

The first version should prefer a small, clear API over over-generalization.

## Security and privacy boundaries

- The relay `base_url`, `key`, and model config must live in backend environment variables only.
- The frontend must never receive the raw relay key.
- Passwords must be stored only as hashes.
- All protected routes must require an authenticated session.
- All conversation/message lookups must verify the resource belongs to the current user.
- Upload validation must enforce allowed MIME types and size limits.
- The app should not trust client-provided ownership ids.

Because the provided key was shared in chat, it should be rotated before public launch even if it is temporarily used for development.

## UI integration points

### Homepage
Add a login entry in the top-left area of the homepage. After login, this area can change to account actions such as current email and logout.

### AI page
`src/pages/AIAssistant.tsx` should be upgraded from mock state to real data wiring:
- replace mock history with fetched conversations
- replace mock messages with fetched messages
- wire “new chat” to the create conversation endpoint
- wire text input submit to the send-message endpoint
- wire paperclip/image/mic actions to upload flows
- show loading and error states for network requests

The existing layout should remain recognizable.

## File storage

For the first version, uploaded assets may be stored on the server filesystem with metadata in PostgreSQL, provided deployment makes persistent disk available.

If the deployment target does not guarantee persistent local storage, switch attachment storage to object storage without changing the higher-level API contract.

This means implementation should keep file storage behind one backend storage module boundary.

## Error handling

The product should distinguish these categories:
- auth failures (not logged in / invalid credentials)
- authorization failures (conversation does not belong to user)
- validation failures (bad file type, empty message, oversized upload)
- AI upstream failures (relay unavailable or model error)
- transcription failures

Frontend copy can stay simple; the important design point is keeping these categories separate in backend responses.

## Testing focus

The first implementation plan should cover tests for:
- register/login/logout flows
- route protection
- ownership checks on conversations
- creating and listing conversations
- sending a message and persisting both sides of the exchange
- attachment validation
- audio transcription request flow boundaries

Frontend verification should include:
- homepage login entry works
- user can create a conversation
- user can switch between past conversations
- one user cannot see another user’s history
- attachments can be added from the AI page UI

## Out of scope for first version

These are intentionally excluded from the first release:
- password reset
- email verification
- cross-conversation long-term memory
- live voice call mode
- multi-user shared threads
- admin moderation console
- advanced retrieval / vector database memory

## Recommended implementation direction

Build this in vertical slices:
1. auth + session foundation
2. conversation/message persistence
3. AI relay integration
4. file/image/audio upload pipeline
5. AI page wiring
6. homepage login entry and user state polishing

This keeps the `/ai` UI usable early while reducing integration risk.
