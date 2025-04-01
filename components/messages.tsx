import { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage, AudioLoadingMessage, AudioPlayingMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Overview } from './overview';
import { memo, useEffect } from 'react';
import { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import { UseChatHelpers } from '@ai-sdk/react';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  isAudioLoading?: boolean;
  isAudioPlaying?: boolean;
  outputMode?: 'text' | 'audio';
  stopAudio?: () => void;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  isArtifactVisible,
  isAudioLoading = false,
  isAudioPlaying = false,
  outputMode = 'text',
  stopAudio,
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();
    
  // Add debug logs to track audio states and conditions
  useEffect(() => {
    console.log('[DEBUG] Messages audio states:', {
      status: status.toString(),
      outputMode,
      messagesCount: messages.length,
      lastMessageRole: messages.length > 0 ? messages[messages.length - 1].role : 'none',
      isAudioLoading,
      isAudioPlaying,
      showAudioLoadingCondition: {
        statusIsReady: status === 'ready',
        statusIsError: status === 'error',
        outputModeIsAudio: outputMode === 'audio',
        hasMessages: messages.length > 0,
        lastMessageIsAssistant: messages.length > 0 && messages[messages.length - 1].role === 'assistant',
        audioIsLoading: isAudioLoading
      },
      showAudioPlayingCondition: {
        statusIsReady: status === 'ready',
        statusIsError: status === 'error',
        outputModeIsAudio: outputMode === 'audio',
        hasMessages: messages.length > 0,
        lastMessageIsAssistant: messages.length > 0 && messages[messages.length - 1].role === 'assistant',
        audioIsPlaying: isAudioPlaying
      }
    });
  }, [status, outputMode, messages, isAudioLoading, isAudioPlaying]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
    >
      {messages.length === 0 && <Overview />}

      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={status === 'streaming' && messages.length - 1 === index}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
        />
      ))}

      {status === 'submitted' &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && <ThinkingMessage />}
        
      {(() => {
        // Show audio loading message when not streaming/thinking but audio is loading
        const showAudioLoading = status !== 'streaming' && 
          status !== 'submitted' && 
          outputMode === 'audio' && 
          messages.length > 0 && 
          messages[messages.length - 1].role === 'assistant' && 
          isAudioLoading;
          
        if (showAudioLoading) {
          console.log('[DEBUG] Rendering AudioLoadingMessage with status:', status);
          return <AudioLoadingMessage />;
        }
        return null;
      })()}
        
      {(() => {
        // Show audio playing message when not streaming/thinking but audio is playing
        const showAudioPlaying = status !== 'streaming' &&
          status !== 'submitted' &&
          outputMode === 'audio' && 
          messages.length > 0 && 
          messages[messages.length - 1].role === 'assistant' && 
          isAudioPlaying;
          
        if (showAudioPlaying) {
          console.log('[DEBUG] Rendering AudioPlayingMessage with status:', status);
          return <AudioPlayingMessage onStopClick={stopAudio} />;
        }
        return null;
      })()}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.isAudioLoading !== nextProps.isAudioLoading) return false;
  if (prevProps.isAudioPlaying !== nextProps.isAudioPlaying) return false;

  return true;
});
