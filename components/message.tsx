'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon, PlayIcon, StopIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import { UseChatHelpers } from '@ai-sdk/react';

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
}: {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full">
            {message.experimental_attachments && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2"
              >
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4', {
                          'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                            message.role === 'user',
                        })}
                      >
                        {message.role === 'assistant' && part.text.includes('<thinking>') ? (
                          <ParsedMessage text={part.text} />
                        ) : (
                          <Markdown>{part.text}</Markdown>
                        )}
                      </div>
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        reload={reload}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === 'call') {
                  const { args } = toolInvocation;

                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getWeather'].includes(toolName),
                      })}
                    >
                      {toolName === 'getWeather' ? (
                        <Weather />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : null}
                    </div>
                  );
                }

                if (state === 'result') {
                  const { result } = toolInvocation;

                  return (
                    <div key={toolCallId}>
                      {toolName === 'getWeather' ? (
                        <Weather weatherAtLocation={result} />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview
                          isReadonly={isReadonly}
                          result={result}
                        />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolResult
                          type="update"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolResult
                          type="request-suggestions"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : (
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                      )}
                    </div>
                  );
                }
              }
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Přemýšlím o vašem problému...
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AudioLoadingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-audio-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.5 } }}
      data-role={role}
    >
      <div className="flex justify-center w-full">
        <div className="flex items-center gap-4 py-3 px-5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 shadow-sm">
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-blue-200 dark:ring-blue-700 bg-blue-100 dark:bg-blue-900/50">
            <div className="translate-y-px animate-pulse text-blue-600 dark:text-blue-400">
              <PlayIcon size={14} />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-blue-400 dark:bg-blue-500 animate-pulse"></div>
              <div className="h-2 w-2 rounded-full bg-blue-400 dark:bg-blue-500 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
              <div className="h-2 w-2 rounded-full bg-blue-400 dark:bg-blue-500 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
            </div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Preparing audio...</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AudioPlayingMessage = ({ onStopClick }: { onStopClick?: () => void }) => {
  const role = 'assistant';
  
  return (
    <motion.div
      data-testid="message-audio-playing"
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={role}
    >
      <div className="flex justify-center w-full">
        <div className="flex items-center gap-4 py-3 px-5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 shadow-sm">
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-blue-200 dark:ring-blue-700 bg-blue-100 dark:bg-blue-900/50">
            <div className="translate-y-px text-blue-600 dark:text-blue-400">
              <PlayIcon size={14} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-end gap-1 h-5">
              <div className="h-2 w-1.5 bg-blue-400 dark:bg-blue-400 rounded-full animate-[soundwave_0.8s_ease-in-out_infinite]" 
                   style={{ animationDelay: '0s' }}></div>
              <div className="h-3 w-1.5 bg-blue-500 dark:bg-blue-500 rounded-full animate-[soundwave_1.1s_ease-in-out_infinite]" 
                   style={{ animationDelay: '0.1s' }}></div>
              <div className="h-5 w-1.5 bg-blue-600 dark:bg-blue-600 rounded-full animate-[soundwave_0.7s_ease-in-out_infinite]" 
                   style={{ animationDelay: '0.15s' }}></div>
              <div className="h-4 w-1.5 bg-blue-500 dark:bg-blue-500 rounded-full animate-[soundwave_0.9s_ease-in-out_infinite]" 
                   style={{ animationDelay: '0.2s' }}></div>
              <div className="h-2 w-1.5 bg-blue-400 dark:bg-blue-400 rounded-full animate-[soundwave_0.8s_ease-in-out_infinite]" 
                   style={{ animationDelay: '0.25s' }}></div>
            </div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Playing audio response</span>
          </div>
          
          {onStopClick && (
            <button 
              onClick={onStopClick}
              className="ml-2 size-7 flex items-center justify-center rounded-full bg-blue-200 hover:bg-blue-300 dark:bg-blue-800 dark:hover:bg-blue-700 transition-colors text-blue-700 dark:text-blue-300"
            >
              <div className="text-blue-700 dark:text-blue-300">
                <StopIcon size={12} />
              </div>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const ParsedMessage = ({ text }: { text: string }) => {
  // Function to extract answer content from the message
  const extractAnswer = (message: string) => {
    const answerTagRegex = /<answer>(.*?)(?:<\/answer>|$)/s;
    const match = message.match(answerTagRegex);
    
    if (match && match[1]) {
      // Return the content between answer tags (or until end if no closing tag)
      return match[1].trim();
    }
    
    // No answer tag found, return Czech "thinking" message
    return "Přemýšlím o vašem problému...";
  };

  // Extract and display only the answer content
  const displayText = extractAnswer(text);

  return (
    <div data-testid="parsed-message-content" className="flex flex-col gap-4">
      <Markdown>{displayText}</Markdown>
    </div>
  );
};
