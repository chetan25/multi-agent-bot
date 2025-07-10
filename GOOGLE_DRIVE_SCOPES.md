# Google Drive API Scopes Guide

This guide shows all available Google Drive API scopes and their specific permissions. You can choose the most restrictive scopes that meet your application's needs.

## 🎯 **Recommended Scopes (Minimal Permissions)**

For most applications, use these restrictive scopes:

```typescript
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file", // Access to files created by the app
  "https://www.googleapis.com/auth/drive.readonly", // Read-only access to existing files
  "https://www.googleapis.com/auth/documents.readonly", // Read-only access to Google Docs
  "https://www.googleapis.com/auth/spreadsheets.readonly", // Read-only access to Google Sheets
];
```

## 📋 **All Available Google Drive Scopes**

### **Drive Scopes**

| Scope                                                     | Permission Level   | Description                                 |
| --------------------------------------------------------- | ------------------ | ------------------------------------------- |
| `https://www.googleapis.com/auth/drive`                   | **Full Access**    | View and manage all files in Google Drive   |
| `https://www.googleapis.com/auth/drive.file`              | **App Files Only** | View and manage files created by this app   |
| `https://www.googleapis.com/auth/drive.readonly`          | **Read Only**      | View files in Google Drive                  |
| `https://www.googleapis.com/auth/drive.appdata`           | **App Data Only**  | View and manage its own configuration data  |
| `https://www.googleapis.com/auth/drive.metadata.readonly` | **Metadata Only**  | View metadata for files in Google Drive     |
| `https://www.googleapis.com/auth/drive.scripts`           | **Scripts**        | View and manage Google Apps Script projects |

### **Google Docs Scopes**

| Scope                                                | Permission Level | Description                           |
| ---------------------------------------------------- | ---------------- | ------------------------------------- |
| `https://www.googleapis.com/auth/documents`          | **Full Access**  | View and manage Google Docs documents |
| `https://www.googleapis.com/auth/documents.readonly` | **Read Only**    | View Google Docs documents            |

### **Google Sheets Scopes**

| Scope                                                   | Permission Level | Description                   |
| ------------------------------------------------------- | ---------------- | ----------------------------- |
| `https://www.googleapis.com/auth/spreadsheets`          | **Full Access**  | View and manage Google Sheets |
| `https://www.googleapis.com/auth/spreadsheets.readonly` | **Read Only**    | View Google Sheets            |

### **Google Slides Scopes**

| Scope                                                    | Permission Level | Description                   |
| -------------------------------------------------------- | ---------------- | ----------------------------- |
| `https://www.googleapis.com/auth/presentations`          | **Full Access**  | View and manage Google Slides |
| `https://www.googleapis.com/auth/presentations.readonly` | **Read Only**    | View Google Slides            |

## 🔒 **Scope Permission Matrix**

### **Read-Only Operations**

- ✅ List files and folders
- ✅ View file metadata
- ✅ Download file content
- ✅ View Google Docs/Sheets content
- ❌ Create new files
- ❌ Modify existing files
- ❌ Delete files
- ❌ Share files

### **File Creation Operations** (`drive.file`)

- ✅ Create new files and folders
- ✅ Upload files
- ✅ Modify files created by the app
- ✅ Delete files created by the app
- ❌ Access files not created by the app
- ❌ Modify files created by other apps

### **Full Access Operations** (`drive`)

- ✅ All read operations
- ✅ Create, modify, delete any file
- ✅ Share files with others
- ✅ Access all files in Drive
- ⚠️ **Requires app verification for external users**

## 🎯 **Scope Selection Guide**

### **For Voice Assistant (Recommended)**

```typescript
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file", // Create and manage app files
  "https://www.googleapis.com/auth/drive.readonly", // Read existing files
  "https://www.googleapis.com/auth/documents.readonly", // Read Google Docs
  "https://www.googleapis.com/auth/spreadsheets.readonly", // Read Google Sheets
];
```

**What this allows:**

- ✅ Read all files in user's Drive
- ✅ Create new files when user requests
- ✅ Modify files created by the app
- ✅ Voice commands to read file content
- ✅ Voice commands to create new files
- ❌ Cannot modify files created by other apps
- ❌ Cannot delete user's existing files

### **For Read-Only Applications**

```typescript
const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/documents.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];
```

### **For File Management Apps**

```typescript
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets",
];
```

### **For Full Access (Not Recommended)**

```typescript
const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets",
];
```

## 🔧 **How to Update Your Scopes**

### **1. Update Google Cloud Console**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "OAuth consent screen"
3. Click "Edit App"
4. Go to "Scopes" section
5. Remove old scopes and add new ones
6. Save changes

### **2. Update Your Code**

The scopes have already been updated in your code files:

- `src/lib/googleDriveTools.ts`
- `src/app/api/google/auth-url/route.ts`
- `src/app/api/google/test/route.ts`

### **3. Test the Changes**

1. Disconnect from Google Drive in your app
2. Reconnect to see the new permission request
3. Verify the consent screen shows the correct permissions

## 🚨 **Important Notes**

### **App Verification**

- **Full Drive access** (`drive` scope) requires app verification for external users
- **Restrictive scopes** (`drive.file`, `drive.readonly`) don't require verification
- Users will see "unverified app" warning with full access scopes

### **User Experience**

- **More restrictive scopes** = Better user trust
- **Fewer permissions** = Higher conversion rates
- **Clear permissions** = Better user understanding

### **Security Best Practices**

1. **Use the least privileged scopes** that meet your needs
2. **Avoid full Drive access** unless absolutely necessary
3. **Combine read-only with file creation** for most use cases
4. **Test with different scope combinations**

## 📝 **Example Use Cases**

### **Voice Assistant (Your App)**

```typescript
// Perfect for voice commands
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file", // "Create a new document"
  "https://www.googleapis.com/auth/drive.readonly", // "Read my budget file"
  "https://www.googleapis.com/auth/documents.readonly", // "Summarize this document"
  "https://www.googleapis.com/auth/spreadsheets.readonly", // "What's in my spreadsheet?"
];
```

### **File Backup App**

```typescript
// Only needs to read files
const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];
```

### **Document Editor**

```typescript
// Needs to create and edit documents
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets",
];
```

## ✅ **Benefits of Restrictive Scopes**

1. **Better User Trust** - Users see minimal permissions
2. **No App Verification Required** - Faster deployment
3. **Reduced Security Risk** - Limited access to user data
4. **Higher Conversion Rates** - Users more likely to grant access
5. **Compliance Friendly** - Meets data protection requirements

Your app now uses the most restrictive scopes that still provide full functionality for voice commands!
