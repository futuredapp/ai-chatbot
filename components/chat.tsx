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

// Function to extract answer content from a message
const extractAnswer = (message: string) => {
  const answerTagRegex = /<answer>(.*?)(?:<\/answer>|$)/s;
  const match = message.match(answerTagRegex);
  
  if (match && match[1]) {
    // Return the content between answer tags (or until end if no closing tag)
    return match[1].trim();
  }
  
  // No answer tag found, return the original message
  return message;
};

// Function to process message parts for database storage
const processMessagePartsForStorage = (parts: any[]) => {
  if (!parts || !Array.isArray(parts)) return parts;
  
  return parts.map(part => {
    if (part.type === 'text' && typeof part.text === 'string') {
      // Extract only the answer content for storage
      return {
        ...part,
        text: extractAnswer(part.text)
      };
    }
    return part;
  });
};

// Define output mode type
type OutputMode = 'text' | 'audio';

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
  // Add state for output mode
  const [outputMode, setOutputMode] = useState<OutputMode>('audio');
  // Add ref for audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track if audio is currently playing
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  // Track if audio is currently loading
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  console.log('[DEBUG] Chat component init with params:', { 
    id, 
    selectedChatModel, 
    initialMessagesCount: initialMessages?.length || 0,
    selectedVisibilityType, 
    isReadonly,
    outputMode
  });

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
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: async (message) => {
      console.log('[DEBUG] useChat onFinish triggered');
      console.log('[DEBUG] Output mode:', outputMode);
      console.log('[DEBUG] Message:', message);
      console.log('[DEBUG] Current status:', status);
      
      // If in audio mode, generate and play audio from the completed message
      if (message.role === 'assistant' && outputMode === 'audio') {
        try {
          console.log('[DEBUG] Setting isAudioLoading to true');
          setIsAudioLoading(true);
          
          // Extract answer content for TTS
          let textForTTS = '';
          
          if (typeof message.content === 'string') {
            textForTTS = extractAnswer(message.content);
          } else if (message.parts && message.parts.length > 0) {
            // Find the text part
            const textParts = message.parts.filter(part => part.type === 'text');
            if (textParts.length > 0 && 'text' in textParts[0]) {
              textForTTS = extractAnswer(textParts[0].text);
            }
          }
          
          console.log('[DEBUG] Requesting TTS for answer content:', textForTTS.substring(0, 50) + '...');
          
          // Create a new audio context for streaming
          if (!audioRef.current) {
            audioRef.current = new Audio();
            console.log('[DEBUG] Created new Audio element');
          }
          
          // Prepare the TTS request
          console.log('[DEBUG] Fetching TTS from API...');
          const ttsResponse = await fetch('/api/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: textForTTS }),
          });
          
          if (!ttsResponse.ok) {
            throw new Error(`TTS API error: ${ttsResponse.status}`);
          }
          
          // Create object URL from the audio blob
          console.log('[DEBUG] TTS fetch successful, creating blob...');
          const audioBlob = await ttsResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          console.log('[DEBUG] Audio URL created:', !!audioUrl);
          
          console.log('[DEBUG] Setting audio states for playback');
          setIsAudioLoading(false);
          setIsAudioPlaying(true);
          
          // Set audio source and play
          console.log('[DEBUG] Setting up audio element');
          audioRef.current.src = audioUrl;
          audioRef.current.onended = () => {
            console.log('[DEBUG] Audio playback ended');
            setIsAudioPlaying(false);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
          };
          audioRef.current.onerror = (e) => {
            console.error('[DEBUG] Audio element error:', e);
            setIsAudioPlaying(false);
            setIsAudioLoading(false);
            toast.error('Failed to play audio response');
            if (audioUrl) URL.revokeObjectURL(audioUrl);
          };
          
          console.log('[DEBUG] Starting audio playback');
          audioRef.current.play().catch((error) => {
            console.error('[DEBUG] Error playing audio:', error);
            setIsAudioPlaying(false);
            setIsAudioLoading(false);
            toast.error('Failed to play audio response');
          });
        } catch (error) {
          console.error('[DEBUG] TTS error:', error);
          setIsAudioPlaying(false);
          setIsAudioLoading(false);
          toast.error('Failed to generate audio response');
        }
      }
      
      // Always update history regardless of mode
      mutate('/api/history');
    },
    onError: (error) => {
      console.error('[DEBUG] useChat onError:', error);
      toast.error('An error occured, please try again!');
    },
  });

  useEffect(() => {
    console.log('[DEBUG] Chat status:', status);
    
    // If audio is playing and user starts a new message, stop current audio
    if (status === 'streaming' && isAudioPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  }, [status, isAudioPlaying]);

  // Debug effect for audio states
  useEffect(() => {
    console.log('[DEBUG] Audio states updated:', {
      isAudioLoading,
      isAudioPlaying,
      outputMode,
      status,
      hasAudioRef: !!audioRef.current
    });
  }, [isAudioLoading, isAudioPlaying, outputMode, status]);

  useEffect(() => {
    console.log('[DEBUG] Messages updated, count:', messages.length);
    
    // If switching from audio to text mode while audio is playing, stop it
    if (outputMode === 'text' && isAudioPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  }, [messages, outputMode, isAudioPlaying]);

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

  // Function to handle audio playback stop
  const stopAudio = () => {
    if (audioRef.current && isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
      setIsAudioLoading(false);
    }
  };

  // Add effect for output mode changes
  useEffect(() => {
    console.log('[DEBUG] Output mode changed:', outputMode);
    
    // If switched to audio mode and there's a recent assistant message
    if (outputMode === 'audio' &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'assistant' &&
        status !== 'streaming' &&
        status !== 'submitted') {
      console.log('[DEBUG] In audio mode with completed message, can trigger TTS');
    }
    
    // If switched to text mode, stop any audio playback
    if (outputMode === 'text') {
      stopAudio();
    }
  }, [outputMode, messages, status, stopAudio]);

  // Helper to safely get message content for logging
  const getMessageContent = (message: UIMessage): string => {
    if (!message) return 'undefined message';
    
    if (message.content) {
      return message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
    }
    
    if (message.parts && message.parts.length > 0) {
      const textParts = message.parts.filter(part => part.type === 'text');
      if (textParts.length > 0 && 'text' in textParts[0]) {
        const text = textParts[0].text;
        return text.substring(0, 50) + (text.length > 50 ? '...' : '');
      }
    }
    
    return 'No text content';
  };
  
  // Add debug logs for messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log('[DEBUG] Last message:', {
        id: lastMessage.id,
        role: lastMessage.role,
        content: getMessageContent(lastMessage),
        hasContent: !!lastMessage.content,
        hasParts: !!lastMessage.parts && lastMessage.parts.length > 0
      });
    }
  }, [messages]);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />
        
        {/* Add output mode toggle */}
        {!isReadonly && (
          <div className="flex items-center justify-end space-x-2 px-4 py-2 border-b">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className={`px-3 py-1 rounded text-sm ${
                  outputMode === 'text' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}
                onClick={() => {
                  setOutputMode('audio');
                  stopAudio();
                }}
              >
                Text
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded text-sm ${
                  outputMode === 'audio' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}
                onClick={() => setOutputMode('audio')}
              >
                Audio
              </button>
            </div>
          </div>
        )}

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
          isAudioLoading={isAudioLoading}
          isAudioPlaying={isAudioPlaying}
          outputMode={outputMode}
          stopAudio={stopAudio}
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
                  // Stop any playing audio when submitting a new message
                  stopAudio();
                  handleSubmit(e);
                } catch (error) {
                  console.error('[DEBUG] Error in handleSubmit:', error);
                  toast.error('Error submitting message');
                }
              }}
              status={status}
              stop={() => {
                // Stop audio if playing when stopping AI response
                stopAudio();
                stop();
              }}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
        
        {/* Hidden audio element for playing TTS responses */}
        <audio ref={audioRef} style={{ display: 'none' }} />
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
}
