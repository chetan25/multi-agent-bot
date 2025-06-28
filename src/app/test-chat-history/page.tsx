"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useChatThreadStore } from "@/lib/stores/chatThreadStore";
import { chatService } from "@/lib/chatService";

export default function TestChatHistoryPage() {
  const { user } = useAuth();
  const { threads, currentThread, currentMessages, loading, error } =
    useChatThreadStore();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const testCreateThread = async () => {
    if (!user?.id) {
      addTestResult("❌ No user found - cannot test");
      return;
    }

    try {
      addTestResult("🔄 Creating test thread...");
      const thread = await chatService.createThread({
        userId: user.id,
        title: `Test Thread ${Date.now()}`,
      });
      addTestResult(`✅ Thread created: ${thread.threadId}`);
    } catch (error) {
      addTestResult(`❌ Failed to create thread: ${error}`);
    }
  };

  const testLoadThreads = async () => {
    if (!user?.id) {
      addTestResult("❌ No user found - cannot test");
      return;
    }

    try {
      addTestResult("🔄 Loading user threads...");
      const userThreads = await chatService.getUserThreads(user.id);
      addTestResult(`✅ Loaded ${userThreads.length} threads`);
    } catch (error) {
      addTestResult(`❌ Failed to load threads: ${error}`);
    }
  };

  const testSaveMessage = async () => {
    if (!user?.id || !currentThread) {
      addTestResult("❌ No user or current thread - cannot test");
      return;
    }

    try {
      addTestResult("🔄 Saving test message...");
      const message = await chatService.saveMessage({
        threadId: currentThread.threadId,
        userId: user.id,
        role: "user",
        content: `Test message ${Date.now()}`,
      });
      addTestResult(`✅ Message saved: ${message.id}`);
    } catch (error) {
      addTestResult(`❌ Failed to save message: ${error}`);
    }
  };

  const testCreateMultipleThreads = async () => {
    if (!user?.id) {
      addTestResult("❌ No user found - cannot test");
      return;
    }

    try {
      addTestResult("🔄 Creating multiple test threads...");

      // Create 3 threads in sequence
      for (let i = 1; i <= 3; i++) {
        const thread = await chatService.createThread({
          userId: user.id,
          title: `Sequential Test Thread ${i}`,
        });
        addTestResult(`✅ Thread ${i} created: ${thread.threadId}`);

        // Verify the thread number is correct
        const expectedNumber = i;
        const actualNumber = parseInt(thread.threadId.split("-").pop() || "0");
        if (actualNumber === expectedNumber) {
          addTestResult(`✅ Thread ${i} has correct number: ${actualNumber}`);
        } else {
          addTestResult(
            `❌ Thread ${i} has wrong number: expected ${expectedNumber}, got ${actualNumber}`
          );
        }
      }

      // Test the utility method
      const nextNumber = await chatService.getNextThreadNumber(user.id);
      addTestResult(`✅ Next thread number should be: ${nextNumber}`);
    } catch (error) {
      addTestResult(`❌ Failed to create multiple threads: ${error}`);
    }
  };

  const testAutoThreadCreation = async () => {
    if (!user?.id) {
      addTestResult("❌ No user found - cannot test");
      return;
    }

    try {
      addTestResult("🔄 Testing auto thread creation...");

      // Clear current thread to simulate no active thread
      addTestResult("🔄 Clearing current thread...");

      // Get current thread count
      const initialThreads = await chatService.getUserThreads(user.id);
      addTestResult(`📊 Initial thread count: ${initialThreads.length}`);

      // Create a new thread (this should be auto-created)
      const newThread = await chatService.createThread({
        userId: user.id,
        title: "Auto-created Test Thread",
      });
      addTestResult(`✅ Auto-created thread: ${newThread.threadId}`);

      // Verify thread number is sequential
      const threadNumber = parseInt(newThread.threadId.split("-").pop() || "0");
      const expectedNumber = initialThreads.length + 1;
      if (threadNumber === expectedNumber) {
        addTestResult(`✅ Thread number is correct: ${threadNumber}`);
      } else {
        addTestResult(
          `❌ Thread number is wrong: expected ${expectedNumber}, got ${threadNumber}`
        );
      }

      // Get updated thread count
      const updatedThreads = await chatService.getUserThreads(user.id);
      addTestResult(`📊 Updated thread count: ${updatedThreads.length}`);
    } catch (error) {
      addTestResult(`❌ Failed to test auto thread creation: ${error}`);
    }
  };

  const testMessageParity = async () => {
    if (!user?.id) {
      addTestResult("❌ No user found - cannot test");
      return;
    }

    try {
      addTestResult("🔄 Testing message parity (1:1 save ratio)...");

      // Create a test thread
      const thread = await chatService.createThread({
        userId: user.id,
        title: "Message Parity Test Thread",
      });
      addTestResult(`✅ Created test thread: ${thread.threadId}`);

      // Get initial message count
      const initialMessages = await chatService.getThreadMessages(
        thread.threadId
      );
      const initialCount = initialMessages.length;
      addTestResult(`📊 Initial message count: ${initialCount}`);

      // Save a test message
      const testMessage = {
        threadId: thread.threadId,
        userId: user.id,
        role: "user" as const,
        content: `Test message ${Date.now()}`,
      };

      addTestResult("🔄 Saving test message...");
      const savedMessage = await chatService.saveMessage(testMessage);
      addTestResult(`✅ Message saved with ID: ${savedMessage.id}`);

      // Get updated message count
      const updatedMessages = await chatService.getThreadMessages(
        thread.threadId
      );
      const updatedCount = updatedMessages.length;
      addTestResult(`📊 Updated message count: ${updatedCount}`);

      // Verify 1:1 parity
      const expectedCount = initialCount + 1;
      if (updatedCount === expectedCount) {
        addTestResult(
          `✅ Message parity verified: ${initialCount} + 1 = ${updatedCount}`
        );
      } else {
        addTestResult(
          `❌ Message parity failed: expected ${expectedCount}, got ${updatedCount}`
        );
      }

      // Check for duplicate messages
      const duplicateMessages = updatedMessages.filter(
        (msg, index, arr) =>
          arr.findIndex(
            (m) => m.content === msg.content && m.role === msg.role
          ) !== index
      );

      if (duplicateMessages.length === 0) {
        addTestResult("✅ No duplicate messages found");
      } else {
        addTestResult(
          `❌ Found ${duplicateMessages.length} duplicate messages`
        );
      }

      // Clean up - delete the test thread
      await chatService.deleteThread(thread.threadId);
      addTestResult("🧹 Cleaned up test thread");
    } catch (error) {
      addTestResult(`❌ Failed to test message parity: ${error}`);
    }
  };

  const testStreamingMessageHandling = async () => {
    if (!user?.id) {
      addTestResult("❌ No user found - cannot test");
      return;
    }

    try {
      addTestResult("🔄 Testing streaming message handling...");

      // Create a test thread
      const thread = await chatService.createThread({
        userId: user.id,
        title: "Streaming Test Thread",
      });
      addTestResult(`✅ Created test thread: ${thread.threadId}`);

      // Get initial message count
      const initialMessages = await chatService.getThreadMessages(
        thread.threadId
      );
      const initialCount = initialMessages.length;
      addTestResult(`📊 Initial message count: ${initialCount}`);

      // Simulate a user message (should be saved immediately)
      const userMessage = {
        threadId: thread.threadId,
        userId: user.id,
        role: "user" as const,
        content: `Test user message ${Date.now()}`,
      };

      addTestResult("🔄 Saving user message...");
      const savedUserMessage = await chatService.saveMessage(userMessage);
      addTestResult(`✅ User message saved with ID: ${savedUserMessage.id}`);

      // Simulate an assistant message (should be saved once)
      const assistantMessage = {
        threadId: thread.threadId,
        userId: user.id,
        role: "assistant" as const,
        content: `This is a test assistant response ${Date.now()}`,
      };

      addTestResult("🔄 Saving assistant message...");
      const savedAssistantMessage = await chatService.saveMessage(
        assistantMessage
      );
      addTestResult(
        `✅ Assistant message saved with ID: ${savedAssistantMessage.id}`
      );

      // Try to save the same assistant message again (should be detected as duplicate)
      addTestResult("🔄 Attempting to save duplicate assistant message...");
      const duplicateMessage = await chatService.saveMessage(assistantMessage);
      addTestResult(
        `✅ Duplicate detection worked: returned existing message ID: ${duplicateMessage.id}`
      );

      // Get final message count
      const finalMessages = await chatService.getThreadMessages(
        thread.threadId
      );
      const finalCount = finalMessages.length;
      addTestResult(`📊 Final message count: ${finalCount}`);

      // Verify 1:1 parity (should be 2 messages: 1 user + 1 assistant)
      const expectedCount = initialCount + 2;
      if (finalCount === expectedCount) {
        addTestResult(
          `✅ Message parity verified: ${initialCount} + 2 = ${finalCount}`
        );
      } else {
        addTestResult(
          `❌ Message parity failed: expected ${expectedCount}, got ${finalCount}`
        );
      }

      // Check for duplicate messages
      const duplicateMessages = finalMessages.filter(
        (msg, index, arr) =>
          arr.findIndex(
            (m) => m.content === msg.content && m.role === msg.role
          ) !== index
      );

      if (duplicateMessages.length === 0) {
        addTestResult("✅ No duplicate messages found");
      } else {
        addTestResult(
          `❌ Found ${duplicateMessages.length} duplicate messages`
        );
      }

      // Verify message roles
      const userMessages = finalMessages.filter((m) => m.role === "user");
      const assistantMessages = finalMessages.filter(
        (m) => m.role === "assistant"
      );
      addTestResult(
        `📊 User messages: ${userMessages.length}, Assistant messages: ${assistantMessages.length}`
      );

      // Clean up - delete the test thread
      await chatService.deleteThread(thread.threadId);
      addTestResult("🧹 Cleaned up test thread");
    } catch (error) {
      addTestResult(`❌ Failed to test streaming message handling: ${error}`);
    }
  };

  const testSimulatedStreaming = async () => {
    if (!user?.id) {
      addTestResult("❌ No user found - cannot test");
      return;
    }

    try {
      addTestResult("🔄 Testing simulated streaming behavior...");

      // Create a test thread
      const thread = await chatService.createThread({
        userId: user.id,
        title: "Simulated Streaming Test Thread",
      });
      addTestResult(`✅ Created test thread: ${thread.threadId}`);

      // Get initial message count
      const initialMessages = await chatService.getThreadMessages(
        thread.threadId
      );
      const initialCount = initialMessages.length;
      addTestResult(`📊 Initial message count: ${initialCount}`);

      // Simulate a user message (should be saved immediately)
      const userMessage = {
        threadId: thread.threadId,
        userId: user.id,
        role: "user" as const,
        content: `Test user message for streaming simulation ${Date.now()}`,
      };

      addTestResult("🔄 Saving user message...");
      const savedUserMessage = await chatService.saveMessage(userMessage);
      addTestResult(`✅ User message saved with ID: ${savedUserMessage.id}`);

      // Simulate streaming assistant message by creating multiple messages with incremental content
      const baseContent = "This is a simulated streaming response";
      const streamingParts = [
        baseContent,
        baseContent + " that",
        baseContent + " that gets",
        baseContent + " that gets longer",
        baseContent + " that gets longer over",
        baseContent + " that gets longer over time",
        baseContent + " that gets longer over time as",
        baseContent + " that gets longer over time as the",
        baseContent + " that gets longer over time as the AI",
        baseContent + " that gets longer over time as the AI responds.",
      ];

      addTestResult("🔄 Simulating streaming assistant message...");

      // Save the first part (should be saved)
      const firstPart = {
        threadId: thread.threadId,
        userId: user.id,
        role: "assistant" as const,
        content: streamingParts[0],
      };

      const savedFirstPart = await chatService.saveMessage(firstPart);
      addTestResult(`✅ First part saved with ID: ${savedFirstPart.id}`);

      // Try to save the same content again (should be detected as duplicate)
      const duplicateFirstPart = await chatService.saveMessage(firstPart);
      addTestResult(
        `✅ Duplicate detection worked for first part: ${duplicateFirstPart.id}`
      );

      // Save the final complete message (should be saved as new)
      const finalMessage = {
        threadId: thread.threadId,
        userId: user.id,
        role: "assistant" as const,
        content: streamingParts[streamingParts.length - 1],
      };

      const savedFinalMessage = await chatService.saveMessage(finalMessage);
      addTestResult(`✅ Final message saved with ID: ${savedFinalMessage.id}`);

      // Try to save the final message again (should be detected as duplicate)
      const duplicateFinalMessage = await chatService.saveMessage(finalMessage);
      addTestResult(
        `✅ Duplicate detection worked for final message: ${duplicateFinalMessage.id}`
      );

      // Get final message count
      const finalMessages = await chatService.getThreadMessages(
        thread.threadId
      );
      const finalCount = finalMessages.length;
      addTestResult(`📊 Final message count: ${finalCount}`);

      // Verify we have the expected messages
      const expectedCount = initialCount + 3; // 1 user + 2 assistant (first part + final)
      if (finalCount === expectedCount) {
        addTestResult(
          `✅ Message count verified: ${initialCount} + 3 = ${finalCount}`
        );
      } else {
        addTestResult(
          `❌ Message count failed: expected ${expectedCount}, got ${finalCount}`
        );
      }

      // Check for duplicate messages
      const duplicateMessages = finalMessages.filter(
        (msg, index, arr) =>
          arr.findIndex(
            (m) => m.content === msg.content && m.role === msg.role
          ) !== index
      );

      if (duplicateMessages.length === 0) {
        addTestResult("✅ No duplicate messages found");
      } else {
        addTestResult(
          `❌ Found ${duplicateMessages.length} duplicate messages`
        );
      }

      // Verify message roles and content
      const userMessages = finalMessages.filter((m) => m.role === "user");
      const assistantMessages = finalMessages.filter(
        (m) => m.role === "assistant"
      );
      addTestResult(
        `📊 User messages: ${userMessages.length}, Assistant messages: ${assistantMessages.length}`
      );

      // Check that we have both the first part and final message
      const hasFirstPart = assistantMessages.some(
        (m) => m.content === streamingParts[0]
      );
      const hasFinalMessage = assistantMessages.some(
        (m) => m.content === streamingParts[streamingParts.length - 1]
      );

      if (hasFirstPart && hasFinalMessage) {
        addTestResult("✅ Both first part and final message are present");
      } else {
        addTestResult(
          `❌ Missing messages: first part: ${hasFirstPart}, final: ${hasFinalMessage}`
        );
      }

      // Clean up - delete the test thread
      await chatService.deleteThread(thread.threadId);
      addTestResult("🧹 Cleaned up test thread");
    } catch (error) {
      addTestResult(`❌ Failed to test simulated streaming: ${error}`);
    }
  };

  const testNewThreadMessageClearing = async () => {
    if (!user?.id) {
      addTestResult("❌ No user found - cannot test");
      return;
    }

    try {
      addTestResult("🔄 Testing new thread message clearing...");

      // Create a test thread
      const thread1 = await chatService.createThread({
        userId: user.id,
        title: "Thread 1 - Should have messages",
      });
      addTestResult(`✅ Created first thread: ${thread1.threadId}`);

      // Add some messages to the first thread
      const message1 = {
        threadId: thread1.threadId,
        userId: user.id,
        role: "user" as const,
        content: "Hello from thread 1",
      };

      const message2 = {
        threadId: thread1.threadId,
        userId: user.id,
        role: "assistant" as const,
        content: "Hi there! This is thread 1 response",
      };

      await chatService.saveMessage(message1);
      await chatService.saveMessage(message2);
      addTestResult("✅ Added messages to first thread");

      // Verify first thread has messages
      const thread1Messages = await chatService.getThreadMessages(
        thread1.threadId
      );
      addTestResult(`📊 Thread 1 has ${thread1Messages.length} messages`);

      // Create a second thread (this should clear messages from UI)
      const thread2 = await chatService.createThread({
        userId: user.id,
        title: "Thread 2 - Should be empty",
      });
      addTestResult(`✅ Created second thread: ${thread2.threadId}`);

      // Verify second thread has no messages
      const thread2Messages = await chatService.getThreadMessages(
        thread2.threadId
      );
      addTestResult(
        `📊 Thread 2 has ${thread2Messages.length} messages (should be 0)`
      );

      if (thread2Messages.length === 0) {
        addTestResult("✅ New thread correctly has no messages");
      } else {
        addTestResult(
          `❌ New thread incorrectly has ${thread2Messages.length} messages`
        );
      }

      // Switch back to first thread and verify messages are still there
      await chatService.getThreadMessages(thread1.threadId);
      addTestResult("✅ Switched back to first thread");

      const thread1MessagesAfter = await chatService.getThreadMessages(
        thread1.threadId
      );
      addTestResult(
        `📊 Thread 1 still has ${thread1MessagesAfter.length} messages after switching`
      );

      if (thread1MessagesAfter.length === thread1Messages.length) {
        addTestResult("✅ Thread 1 messages preserved correctly");
      } else {
        addTestResult(
          `❌ Thread 1 messages changed: was ${thread1Messages.length}, now ${thread1MessagesAfter.length}`
        );
      }

      // Clean up - delete both test threads
      await chatService.deleteThread(thread1.threadId);
      await chatService.deleteThread(thread2.threadId);
      addTestResult("🧹 Cleaned up test threads");
    } catch (error) {
      addTestResult(`❌ Failed to test new thread message clearing: ${error}`);
    }
  };

  const testThreadSwitchingMessageIsolation = async () => {
    if (!user?.id) {
      addTestResult("❌ No user found - cannot test");
      return;
    }

    try {
      addTestResult("🔄 Testing thread switching message isolation...");

      // Create two test threads with different messages
      const thread1 = await chatService.createThread({
        userId: user.id,
        title: "Thread 1 - Messages A",
      });
      const thread2 = await chatService.createThread({
        userId: user.id,
        title: "Thread 2 - Messages B",
      });
      addTestResult(
        `✅ Created threads: ${thread1.threadId}, ${thread2.threadId}`
      );

      // Add unique messages to thread 1
      const thread1Messages = [
        {
          threadId: thread1.threadId,
          userId: user.id,
          role: "user" as const,
          content: "Hello from thread 1",
        },
        {
          threadId: thread1.threadId,
          userId: user.id,
          role: "assistant" as const,
          content: "Hi! This is thread 1 response",
        },
      ];

      // Add unique messages to thread 2
      const thread2Messages = [
        {
          threadId: thread2.threadId,
          userId: user.id,
          role: "user" as const,
          content: "Hello from thread 2",
        },
        {
          threadId: thread2.threadId,
          userId: user.id,
          role: "assistant" as const,
          content: "Hi! This is thread 2 response",
        },
      ];

      // Save messages to both threads
      for (const msg of thread1Messages) {
        await chatService.saveMessage(msg);
      }
      for (const msg of thread2Messages) {
        await chatService.saveMessage(msg);
      }
      addTestResult("✅ Added unique messages to both threads");

      // Verify thread 1 has its messages
      const loadedThread1Messages = await chatService.getThreadMessages(
        thread1.threadId
      );
      addTestResult(`📊 Thread 1 has ${loadedThread1Messages.length} messages`);

      // Verify thread 2 has its messages
      const loadedThread2Messages = await chatService.getThreadMessages(
        thread2.threadId
      );
      addTestResult(`📊 Thread 2 has ${loadedThread2Messages.length} messages`);

      // Check that messages are unique to each thread
      const thread1Contents = loadedThread1Messages
        .map((m) => m.content)
        .sort();
      const thread2Contents = loadedThread2Messages
        .map((m) => m.content)
        .sort();

      const thread1Expected = [
        "Hello from thread 1",
        "Hi! This is thread 1 response",
      ].sort();
      const thread2Expected = [
        "Hello from thread 2",
        "Hi! This is thread 2 response",
      ].sort();

      if (JSON.stringify(thread1Contents) === JSON.stringify(thread1Expected)) {
        addTestResult("✅ Thread 1 has correct messages");
      } else {
        addTestResult(
          `❌ Thread 1 has wrong messages: ${JSON.stringify(thread1Contents)}`
        );
      }

      if (JSON.stringify(thread2Contents) === JSON.stringify(thread2Expected)) {
        addTestResult("✅ Thread 2 has correct messages");
      } else {
        addTestResult(
          `❌ Thread 2 has wrong messages: ${JSON.stringify(thread2Contents)}`
        );
      }

      // Check for message isolation (no cross-contamination)
      const allThread1Contents = loadedThread1Messages.map((m) => m.content);
      const allThread2Contents = loadedThread2Messages.map((m) => m.content);

      const crossContamination = allThread1Contents.some((content) =>
        allThread2Contents.includes(content)
      );

      if (!crossContamination) {
        addTestResult("✅ No message cross-contamination between threads");
      } else {
        addTestResult("❌ Found message cross-contamination between threads");
      }

      // Test switching between threads multiple times
      addTestResult("🔄 Testing multiple thread switches...");

      for (let i = 0; i < 3; i++) {
        // Switch to thread 1
        await chatService.getThreadMessages(thread1.threadId);
        const switch1Messages = await chatService.getThreadMessages(
          thread1.threadId
        );
        addTestResult(
          `📊 Switch ${i + 1} to Thread 1: ${switch1Messages.length} messages`
        );

        // Switch to thread 2
        await chatService.getThreadMessages(thread2.threadId);
        const switch2Messages = await chatService.getThreadMessages(
          thread2.threadId
        );
        addTestResult(
          `📊 Switch ${i + 1} to Thread 2: ${switch2Messages.length} messages`
        );

        // Verify message counts remain consistent
        if (
          switch1Messages.length === loadedThread1Messages.length &&
          switch2Messages.length === loadedThread2Messages.length
        ) {
          addTestResult(`✅ Switch ${i + 1}: Message counts consistent`);
        } else {
          addTestResult(`❌ Switch ${i + 1}: Message counts inconsistent`);
        }
      }

      // Clean up - delete both test threads
      await chatService.deleteThread(thread1.threadId);
      await chatService.deleteThread(thread2.threadId);
      addTestResult("🧹 Cleaned up test threads");
    } catch (error) {
      addTestResult(`❌ Failed to test thread switching isolation: ${error}`);
    }
  };

  const testThreadSwitchingMessageFetching = async () => {
    if (!user?.id) {
      addTestResult("❌ No user found - cannot test");
      return;
    }

    try {
      addTestResult("🔄 Testing thread switching message fetching...");

      // Create two test threads with different messages
      const thread1 = await chatService.createThread({
        userId: user.id,
        title: "Thread 1 - Fetch Test",
      });
      const thread2 = await chatService.createThread({
        userId: user.id,
        title: "Thread 2 - Fetch Test",
      });
      addTestResult(
        `✅ Created threads: ${thread1.threadId}, ${thread2.threadId}`
      );

      // Add messages to thread 1
      const thread1Messages = [
        {
          threadId: thread1.threadId,
          userId: user.id,
          role: "user" as const,
          content: "Message 1 from thread 1",
        },
        {
          threadId: thread1.threadId,
          userId: user.id,
          role: "assistant" as const,
          content: "Response 1 from thread 1",
        },
        {
          threadId: thread1.threadId,
          userId: user.id,
          role: "user" as const,
          content: "Message 2 from thread 1",
        },
      ];

      // Add messages to thread 2
      const thread2Messages = [
        {
          threadId: thread2.threadId,
          userId: user.id,
          role: "user" as const,
          content: "Message 1 from thread 2",
        },
        {
          threadId: thread2.threadId,
          userId: user.id,
          role: "assistant" as const,
          content: "Response 1 from thread 2",
        },
      ];

      // Save messages to both threads
      for (const msg of thread1Messages) {
        await chatService.saveMessage(msg);
      }
      for (const msg of thread2Messages) {
        await chatService.saveMessage(msg);
      }
      addTestResult("✅ Added messages to both threads");

      // Test fetching messages for thread 1
      addTestResult("🔄 Testing fetch for thread 1...");
      const fetchedThread1Messages = await chatService.getThreadMessages(
        thread1.threadId
      );
      addTestResult(
        `📊 Thread 1 fetched ${fetchedThread1Messages.length} messages`
      );

      if (fetchedThread1Messages.length === thread1Messages.length) {
        addTestResult("✅ Thread 1 message count matches");
      } else {
        addTestResult(
          `❌ Thread 1 message count mismatch: expected ${thread1Messages.length}, got ${fetchedThread1Messages.length}`
        );
      }

      // Test fetching messages for thread 2
      addTestResult("🔄 Testing fetch for thread 2...");
      const fetchedThread2Messages = await chatService.getThreadMessages(
        thread2.threadId
      );
      addTestResult(
        `📊 Thread 2 fetched ${fetchedThread2Messages.length} messages`
      );

      if (fetchedThread2Messages.length === thread2Messages.length) {
        addTestResult("✅ Thread 2 message count matches");
      } else {
        addTestResult(
          `❌ Thread 2 message count mismatch: expected ${thread2Messages.length}, got ${fetchedThread2Messages.length}`
        );
      }

      // Test switching between threads multiple times
      addTestResult("🔄 Testing multiple thread switches with fetching...");

      for (let i = 0; i < 3; i++) {
        // Switch to thread 1 and fetch
        const switch1Messages = await chatService.getThreadMessages(
          thread1.threadId
        );
        addTestResult(
          `📊 Switch ${i + 1} to Thread 1: fetched ${
            switch1Messages.length
          } messages`
        );

        // Switch to thread 2 and fetch
        const switch2Messages = await chatService.getThreadMessages(
          thread2.threadId
        );
        addTestResult(
          `📊 Switch ${i + 1} to Thread 2: fetched ${
            switch2Messages.length
          } messages`
        );

        // Verify message contents are correct
        const thread1Contents = switch1Messages.map((m) => m.content).sort();
        const thread2Contents = switch2Messages.map((m) => m.content).sort();

        const expectedThread1Contents = thread1Messages
          .map((m) => m.content)
          .sort();
        const expectedThread2Contents = thread2Messages
          .map((m) => m.content)
          .sort();

        if (
          JSON.stringify(thread1Contents) ===
          JSON.stringify(expectedThread1Contents)
        ) {
          addTestResult(`✅ Switch ${i + 1}: Thread 1 contents correct`);
        } else {
          addTestResult(`❌ Switch ${i + 1}: Thread 1 contents incorrect`);
        }

        if (
          JSON.stringify(thread2Contents) ===
          JSON.stringify(expectedThread2Contents)
        ) {
          addTestResult(`✅ Switch ${i + 1}: Thread 2 contents correct`);
        } else {
          addTestResult(`❌ Switch ${i + 1}: Thread 2 contents incorrect`);
        }
      }

      // Test that messages are properly isolated (no cross-contamination)
      const allThread1Contents = fetchedThread1Messages.map((m) => m.content);
      const allThread2Contents = fetchedThread2Messages.map((m) => m.content);

      const crossContamination = allThread1Contents.some((content) =>
        allThread2Contents.includes(content)
      );

      if (!crossContamination) {
        addTestResult("✅ No message cross-contamination between threads");
      } else {
        addTestResult("❌ Found message cross-contamination between threads");
      }

      // Clean up - delete both test threads
      await chatService.deleteThread(thread1.threadId);
      await chatService.deleteThread(thread2.threadId);
      addTestResult("🧹 Cleaned up test threads");
    } catch (error) {
      addTestResult(
        `❌ Failed to test thread switching message fetching: ${error}`
      );
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat History Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">User Status</h3>
              <p>User ID: {user?.id || "Not authenticated"}</p>
              <p>Email: {user?.email || "N/A"}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Store Status</h3>
              <p>Loading: {loading ? "Yes" : "No"}</p>
              <p>Error: {error || "None"}</p>
              <p>Threads count: {threads.length}</p>
              <p>Current thread: {currentThread?.title || "None"}</p>
              <p>Current messages: {currentMessages.length}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Test Actions</h3>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={testCreateThread} variant="outline">
                  Create Test Thread
                </Button>
                <Button onClick={testLoadThreads} variant="outline">
                  Load Threads
                </Button>
                <Button onClick={testSaveMessage} variant="outline">
                  Save Test Message
                </Button>
                <Button onClick={testCreateMultipleThreads} variant="outline">
                  Create Multiple Threads
                </Button>
                <Button onClick={testAutoThreadCreation} variant="outline">
                  Test Auto Thread Creation
                </Button>
                <Button onClick={testMessageParity} variant="outline">
                  Test Message Parity
                </Button>
                <Button
                  onClick={testStreamingMessageHandling}
                  variant="outline"
                >
                  Test Streaming Message Handling
                </Button>
                <Button onClick={testSimulatedStreaming} variant="outline">
                  Test Simulated Streaming
                </Button>
                <Button
                  onClick={testNewThreadMessageClearing}
                  variant="outline"
                >
                  Test New Thread Message Clearing
                </Button>
                <Button
                  onClick={testThreadSwitchingMessageIsolation}
                  variant="outline"
                >
                  Test Thread Switching Message Isolation
                </Button>
                <Button
                  onClick={testThreadSwitchingMessageFetching}
                  variant="outline"
                >
                  Test Thread Switching Message Fetching
                </Button>
                <Button onClick={clearTestResults} variant="outline">
                  Clear Results
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Test Results</h3>
              <div className="bg-gray-100 p-4 rounded-md max-h-60 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500">
                    No test results yet. Run some tests above.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {testResults.map((result, index) => (
                      <div key={index} className="text-sm font-mono">
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Current Threads</h3>
              <div className="space-y-2">
                {threads.map((thread) => (
                  <div key={thread.threadId} className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">{thread.title}</p>
                    <p className="text-sm text-gray-600">
                      ID: {thread.threadId} | Messages: {thread.messageCount} |
                      Updated: {new Date(thread.updatedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
