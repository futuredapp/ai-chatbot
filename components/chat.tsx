'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const chatInitialized = useRef(false);

  console.log('[DEBUG] Chat component init with params:', { 
    id, 
    selectedChatModel, 
    initialMessagesCount: initialMessages?.length || 0,
    selectedVisibilityType, 
    isReadonly 
  });

  // Validate model name
  useEffect(() => {
    console.log(`[DEBUG] Checking chat model: "${selectedChatModel}"`);
    if (!selectedChatModel) {
      console.error('[DEBUG] Chat model name is empty or undefined');
    }
  }, [selectedChatModel]);

  const chatOptions = {
    id,
    body: { id, selectedChatModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onResponse: async (response: Response) => {
      console.log('[DEBUG] API onResponse status:', response.status);
      try {
        // Clone the response to read it without consuming the stream
        const cloned = response.clone();
        
        // Try to read response headers
        console.log('[DEBUG] API response headers:', {
          contentType: response.headers.get('content-type'),
          status: response.status,
          statusText: response.statusText
        });

        // If it's an error response, try to get more details
        if (!response.ok) {
          try {
            const errorText = await cloned.text();
            console.error('[DEBUG] API error response body:', errorText);
          } catch (textError) {
            console.error('[DEBUG] Could not read error response body:', textError);
          }
        }
      } catch (parseError) {
        console.error('[DEBUG] Error parsing API response:', parseError);
      }
    },
    onFinish: () => {
      console.log('[DEBUG] useChat onFinish triggered');
      mutate('/api/history');
    },
    onError: (error: Error) => {
      console.error('[DEBUG] useChat onError:', error);
      // Try to extract more info from the error
      console.error('[DEBUG] Error details:', {
        name: error.name,
        message: error.message,
        cause: error.cause,
        stack: error.stack
      });
      toast.error('An error occured, please try again!');
    },
  };
  
  console.log('[DEBUG] Chat options:', {
    id: chatOptions.id,
    bodyId: chatOptions.body.id,
    bodyModel: chatOptions.body.selectedChatModel,
    initialMessagesCount: chatOptions.initialMessages?.length || 0
  });

  try {
    const {
      messages,
      setMessages,
      handleSubmit,
      input,
      setInput,
      append,
      status,
      stop,
      reload,
      isLoading,
      error
    } = useChat(chatOptions);

    useEffect(() => {
      if (!chatInitialized.current) {
        console.log('[DEBUG] useChat hook initialized successfully');
        chatInitialized.current = true;
      }
    }, []);

    useEffect(() => {
      console.log('[DEBUG] Chat status:', status);
      if (status === 'error' && error) {
        console.error('[DEBUG] useChat error state:', error);
      }
    }, [status, error]);

    useEffect(() => {
      console.log('[DEBUG] Messages updated, count:', messages.length);
      if (messages.length > 0) {
        console.log('[DEBUG] Last message:', {
          id: messages[messages.length - 1].id,
          role: messages[messages.length - 1].role,
          contentLength: messages[messages.length - 1].content?.length || 0
        });
      }
    }, [messages]);

    useEffect(() => {
      console.log('[DEBUG] Loading state:', isLoading);
    }, [isLoading]);

    const { data: votes, error: votesError } = useSWR<Array<Vote>>(
      messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
      fetcher,
    );

    useEffect(() => {
      if (votesError) {
        console.error('[DEBUG] Error fetching votes:', votesError);
      }
      if (votes) {
        console.log('[DEBUG] Votes loaded, count:', votes.length);
      }
    }, [votes, votesError]);

    const [attachments, setAttachments] = useState<Array<Attachment>>([]);
    const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

    return (
      <>
        <div className="flex flex-col min-w-0 h-dvh bg-background">
          <ChatHeader
            chatId={id}
            selectedModelId={selectedChatModel}
            selectedVisibilityType={selectedVisibilityType}
            isReadonly={isReadonly}
          />

          <Messages
            chatId={id}
            status={status}
            votes={votes}
            messages={messages}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            isArtifactVisible={isArtifactVisible}
          />

          <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
            {!isReadonly && (
              <MultimodalInput
                chatId={id}
                input={input}
                setInput={setInput}
                handleSubmit={(e) => {
                  console.log('[DEBUG] Form submitted with input length:', input.length);
                  console.log('[DEBUG] Attachments count:', attachments.length);
                  try {
                    handleSubmit(e);
                  } catch (error) {
                    console.error('[DEBUG] Error in handleSubmit:', error);
                    toast.error('Error submitting message');
                  }
                }}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                setMessages={setMessages}
                append={append}
              />
            )}
          </form>
        </div>

        <Artifact
          chatId={id}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          status={status}
          stop={stop}
          attachments={attachments}
          setAttachments={setAttachments}
          append={append}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          votes={votes}
          isReadonly={isReadonly}
        />
      </>
    );
  } catch (error) {
    console.error('[DEBUG] Error initializing useChat hook:', error);
    return <div className="p-4">Error initializing chat: {String(error)}</div>;
  }
}
