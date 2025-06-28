"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col w-full max-w-4xl py-8 mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Multi-Modal Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Chat with AI and upload images for multi-modal interactions
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4 mb-24">
        {messages.map((m) => (
          <Card
            key={m.id}
            className={
              m.role === "user" ? "ml-auto max-w-3xl" : "mr-auto max-w-3xl"
            }
          >
            <CardContent className="pt-6">
              <div className="whitespace-pre-wrap">
                <span className="font-semibold">
                  {m.role === "user" ? "User: " : "AI: "}
                </span>
                {m.content}
              </div>
              <div className="mt-4">
                {m?.experimental_attachments
                  ?.filter((attachment) =>
                    attachment?.contentType?.startsWith("image/")
                  )
                  .map((attachment, index) => (
                    <Image
                      key={`${m.id}-${index}`}
                      src={attachment.url}
                      width={500}
                      height={500}
                      alt={attachment.name ?? `attachment-${index}`}
                      className="rounded-lg border"
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          handleSubmit(event, {
            experimental_attachments: files,
          });

          setFiles(undefined);

          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
        className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-4xl mb-8 p-4"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  onChange={(event) => {
                    if (event.target.files) {
                      setFiles(event.target.files);
                    }
                  }}
                  multiple
                  ref={fileInputRef}
                />
                {files && (
                  <span className="text-sm text-muted-foreground">
                    {files.length} file(s) selected
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 p-3 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={input}
                  placeholder="Say something..."
                  onChange={handleInputChange}
                />
                <Button type="submit" disabled={!input.trim()}>
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
