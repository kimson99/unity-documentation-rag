# Testing Guide - New Features

## Features Added:

### 1. Home/Dashboard Page (/)
- Welcome message with user name
- Quick navigation cards to Chat, Files, and Indexing
- System information

### 2. Files Management Page (/files)
- Upload Unity documentation files (.txt, .html, .md)
- View uploaded files with their IDs
- Multiple file upload support

### 3. Indexing Management Page (/indexing)
- Start indexing jobs with file IDs
- Monitor indexing status in real-time
- Auto-refresh every 5 seconds
- View individual file indexing progress

### 4. Improved Chat Page (/chat)
- Better UI with message bubbles
- User messages on right (blue), AI on left (gray)
- Loading indicator with animated dots
- Empty state message

### 5. Updated Sidebar
- Real navigation links (Home, Chat, Files, Indexing)
- Clean design with proper icons
- User info at bottom with logout

## How to Test:

### Test 1: Navigation
1. Login to the app
2. Check sidebar has: Home, Chat, Files, Indexing
3. Click each menu item and verify page loads
4. Verify user info shows in sidebar footer

### Test 2: File Upload
1. Go to /files page
2. Click "Choose Files" and select .txt, .html, or .md files
3. Click "Upload" button
4. Verify success toast appears
5. Check uploaded files list shows file IDs

### Test 3: Indexing
1. Copy file IDs from Files page
2. Go to /indexing page
3. Paste file IDs (comma-separated) into input
4. Click "Start Indexing"
5. Verify indexing status card appears
6. Watch status update automatically
7. Click "Refresh" to manually update

### Test 4: Chat with RAG
1. First, upload and index some Unity documentation
2. Go to /chat page
3. Ask a question like "How do I create a GameObject in Unity?"
4. Verify AI responds with relevant information
5. Check message bubbles display correctly
6. Verify loading indicator shows while waiting

### Test 5: Home Dashboard
1. Go to / (home page)
2. Verify welcome message shows your name
3. Click on each card (Chat, Files, Indexing)
4. Verify navigation works

## Expected Behavior:

- All pages should load without errors
- Navigation should work smoothly
- File upload should accept only .txt, .html, .md
- Indexing should show real-time status
- Chat should stream responses
- Sidebar should highlight active page

## Common Issues:

1. **File upload fails**: Check backend is running and file types are supported
2. **Indexing stuck**: Check Redis and PostgreSQL are running
3. **Chat not responding**: Verify GOOGLE_API_KEY is set correctly
4. **Navigation broken**: Check routes.ts is updated correctly
