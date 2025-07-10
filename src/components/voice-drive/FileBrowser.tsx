"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Play,
  Settings,
  FileText,
  FolderOpen,
  WifiOff,
  Loader2,
  ArrowLeft,
  Home,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useGoogleDrive } from "@/contexts/GoogleDriveContext";
import { googleDriveApi, GoogleDriveFile } from "@/lib/googleDriveApi";

export function FileBrowser() {
  const { isConnected, isChecking } = useGoogleDrive();
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState("root");
  const [folderPath, setFolderPath] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Load files when component mounts or when connection status changes
  useEffect(() => {
    if (isConnected && !isChecking) {
      loadFiles();
    }
  }, [isConnected, isChecking, currentFolder]);

  const loadFiles = async () => {
    if (!isConnected) return;

    setLoading(true);
    setError(null);

    try {
      const result = await googleDriveApi.listFiles(currentFolder);
      setFiles(result.files);
    } catch (err) {
      console.error("Error loading files:", err);
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadFiles();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await googleDriveApi.searchFiles(searchQuery);
      setFiles(result.files);
    } catch (err) {
      console.error("Error searching files:", err);
      setError(err instanceof Error ? err.message : "Failed to search files");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/vnd.google-apps.folder") {
      return <FolderOpen className="h-4 w-4 text-yellow-500" />;
    } else if (mimeType.includes("document")) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else if (mimeType.includes("spreadsheet")) {
      return <FileText className="h-4 w-4 text-green-500" />;
    } else if (mimeType.includes("pdf")) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (mimeType.includes("image")) {
      return <FileText className="h-4 w-4 text-purple-500" />;
    } else {
      return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (size?: string) => {
    if (!size) return "";
    const bytes = parseInt(size);
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  // Show loading state while checking connection
  if (isChecking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            My Drive
          </CardTitle>
          <CardDescription>Checking Google Drive connection...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">
            Please wait while we verify your Google Drive connection.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show disabled state when not connected
  if (!isConnected) {
    return (
      <Card className="opacity-75">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <WifiOff className="h-6 w-6 text-gray-400" />
                My Drive
              </CardTitle>
              <CardDescription>
                Connect to Google Drive to view your files
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700 mb-3">
              File browser is disabled. Please connect your Google Drive account
              first.
            </p>
            <div className="text-xs text-gray-500">
              Once connected, you'll be able to:
              <ul className="mt-2 space-y-1">
                <li>• Browse your Google Drive files</li>
                <li>• Search through documents</li>
                <li>• Manage files and folders</li>
                <li>• Use voice commands to control files</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {currentFolder !== "root" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (folderPath.length > 0) {
                      const newPath = folderPath.slice(0, -1);
                      const newFolder =
                        newPath.length > 0
                          ? newPath[newPath.length - 1].id
                          : "root";
                      setCurrentFolder(newFolder);
                      setFolderPath(newPath);
                    } else {
                      setCurrentFolder("root");
                      setFolderPath([]);
                    }
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <Home className="h-4 w-4" />
              My Drive
              {folderPath.length > 0 && (
                <span className="text-sm text-gray-500">
                  {folderPath.map((folder, index) => (
                    <span key={folder.id}>
                      <span className="mx-2">/</span>
                      <button
                        className="hover:text-blue-600"
                        onClick={() => {
                          const newPath = folderPath.slice(0, index + 1);
                          setCurrentFolder(folder.id);
                          setFolderPath(newPath);
                        }}
                      >
                        {folder.name}
                      </button>
                    </span>
                  ))}
                </span>
              )}
            </CardTitle>
            <CardDescription>{files.length} items</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search files..."
              className="w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button variant="outline" size="sm" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">
                Loading files...
              </span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No files found</p>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => {
                  if (file.mimeType === "application/vnd.google-apps.folder") {
                    setCurrentFolder(file.id);
                    setFolderPath([
                      ...folderPath,
                      { id: file.id, name: file.name },
                    ]);
                  } else if (file.webViewLink) {
                    window.open(file.webViewLink, "_blank");
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file.mimeType)}
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} •{" "}
                      {formatDate(file.modifiedTime)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
