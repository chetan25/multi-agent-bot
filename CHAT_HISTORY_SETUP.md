# Chat History Setup Guide

This guide explains how to set up the chat history persistence feature for the multi-agent chatbot.

## Features Implemented

### 1. Chat History Persistence

- All chat messages are now stored in Supabase database
- Each chat conversation is organized into threads
- Thread IDs follow the pattern: `userId-sequentialNumber` (e.g., "user123-1", "user123-2")

### 2. Automatic Thread Creation

- **First Chat**: Automatically creates a thread when user first accesses the chat
- **New Conversations**: Every "New Chat" action creates a new sequential thread
- **No Active Thread**: Automatically creates a thread if user tries to send a message without one
- **Always Active**: Users always have an active thread to chat with

### 3. Thread Management

- Users can create new chat threads
- Thread titles can be edited
- Threads can be deleted (with confirmation)
- Thread list shows message count and last updated time

### 4. Updated UI Components

- **ChatHeader**: Contains hamburger menu, title, and new chat button
- **ThreadDrawer**: Side drawer showing all user's chat threads
- **Enhanced ChatComponent**: Integrated with thread management

## Database Setup

### 1. Run the Migration

Execute the SQL migration in your Supabase SQL editor:

```sql
-- Copy and paste the contents of supabase-migration.sql
```

### 2. Database Schema

#### `chat_threads` Table

- `id`: UUID primary key
- `userId`: References auth.users(id) - **Note: Uses camelCase**
- `threadId`: Unique thread identifier (userId-sequentialNumber) - **Note: Uses camelCase**
- `title`: Thread title (editable)
- `messageCount`: Number of messages in thread - **Note: Uses camelCase**
- `createdAt`: Thread creation timestamp - **Note: Uses camelCase**
- `updatedAt`: Last update timestamp - **Note: Uses camelCase**

#### `chat_messages` Table

- `id`: UUID primary key
- `threadId`: References chat_threads(threadId) - **Note: Uses camelCase**
- `userId`: References auth.users(id) - **Note: Uses camelCase**
- `role`: 'user' or 'assistant'
- `content`: Message content
- `attachments`: JSONB field for file attachments
- `createdAt`: Message creation timestamp - **Note: Uses camelCase**

### 3. Row Level Security (RLS)

- Users can only access their own threads and messages
- Automatic cleanup when users are deleted
- Secure by default

## Usage

### Automatic Thread Creation

1. **First Visit**: When a user first visits the chat page, a thread is automatically created
2. **No Active Thread**: If a user tries to send a message without an active thread, one is created automatically
3. **New Chat Button**: Clicking "New Chat" creates a new sequential thread
4. **Thread Switching**: Users can switch between existing threads via the drawer

### Thread ID Generation

- **First thread**: `userId-1`
- **Second thread**: `userId-2`
- **Third thread**: `userId-3`
- And so on...

### Managing Threads

1. Click the hamburger menu to open the thread drawer
2. View all your chat threads with message counts and timestamps
3. Click on any thread to load it
4. Edit thread titles by clicking the edit icon
5. Delete threads by clicking the trash icon

## Technical Implementation

### Key Components

- `ChatService`: Handles all database operations
- `useChatThreadStore`: Zustand store for thread state management
- `ThreadDrawer`: UI component for thread management
- `ChatHeader`: Updated header with navigation controls

### Automatic Thread Creation Logic

```typescript
// Auto-create thread when user is authenticated and has no active thread
useEffect(() => {
  if (user?.id && !currentThread && hasAnyConfiguredProvider) {
    ensureActiveThread();
  }
}, [user?.id, currentThread, hasAnyConfiguredProvider]);

// Auto-create thread if none exists during message submission
if (!currentThread) {
  await createNewThread(user.id);
  // Retry the submission
  onSubmit(e);
}
```

### Message Persistence

- Messages are automatically saved to the database
- Thread statistics are updated in real-time
- Messages are loaded when switching between threads

### Error Handling

- Graceful error handling for database operations
- User-friendly error messages
- Automatic retry mechanisms

## Environment Variables

Ensure your Supabase environment variables are properly configured:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing

1. **First Chat Test**: Visit `/integrations/chat` - should automatically create a thread
2. **Send Message Test**: Try sending a message - should work without manual thread creation
3. **New Chat Test**: Click "New Chat" - should create a new sequential thread
4. **Thread Switching**: Use the drawer to switch between threads
5. **Thread Management**: Edit titles and delete threads
6. **Sequential Numbers**: Verify thread IDs follow the pattern `userId-1`, `userId-2`, etc.

## Troubleshooting

### Common Issues

1. **Threads not loading**: Check RLS policies and user authentication
2. **Messages not saving**: Verify database connection and permissions
3. **UI not updating**: Check Zustand store state management
4. **API errors with field names**: Ensure database schema uses camelCase column names
5. **"No active thread" error**: Should be resolved with automatic thread creation

### Debug Mode

Enable console logging to debug issues:

- Thread creation/loading
- Message saving
- Database operations
- State management

### API Call Issues

If you see API calls like:

```
https://your-project.supabase.co/rest/v1/chat_threads?select=*&userId=eq.user-id&order=updatedAt.desc
```

This is the **correct** format. The issue you encountered was because:

1. The original database schema used snake_case (`user_id`, `thread_id`)
2. But the TypeScript code used camelCase (`userId`, `threadId`)
3. This mismatch caused Supabase to generate incorrect queries

The updated schema now uses camelCase consistently, so the API calls will work correctly.

## Future Enhancements

Potential improvements:

- Thread search functionality
- Thread categories/tags
- Message search within threads
- Thread export/import
- Thread sharing (with permissions)
- Message reactions/annotations
