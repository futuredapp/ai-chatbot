'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon } from './icons';
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
import { userMap } from '@/lib/ai/tools/request-money-transfer';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './ui/alert-dialog';

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
                        <Markdown>{part.text}</Markdown>
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
                      {toolName === 'requestMoneyTransfer' ? (
                        <MoneyTransferToolUI args={args} />
                      ) : toolName === 'requestFreezeCard' ? (
                        <FreezeCardToolUI args={args} />
                      ) : toolName === 'getWeather' ? (
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
                      {toolName === 'requestMoneyTransfer' ? (
                        <MoneyTransferResult result={result} />
                      ) : toolName === 'requestFreezeCard' ? (
                        <FreezeCardResult result={result} />
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
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// MoneyTransferConfirmation component
function MoneyTransferConfirmation({ userId, amount, onConfirm }: { userId: string; amount: number; onConfirm: () => void }) {
  const user = userMap[userId];
  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border bg-white shadow-md" style={{ borderColor: '#95AF00' }}>
      <div className="text-lg font-semibold text-[#95AF00]">Potvrdenie prevodu</div>
      <div className="text-base text-gray-800">
        Naozaj chcete poslať <span className="font-bold">{amount} €</span> používateľovi <span className="font-bold">{user?.name || userId}</span>?
      </div>
      {user && (
        <div className="text-sm text-gray-600">
          IBAN: <span className="font-mono">{user.eBankCode}</span>
        </div>
      )}
      <Button style={{ backgroundColor: '#95AF00', color: 'white' }} onClick={onConfirm}>
        Odoslať
      </Button>
    </div>
  );
}

// Dummy transaction dialog
function MoneyTransferDialog({ open, onOpenChange, userId, amount }: { open: boolean; onOpenChange: (open: boolean) => void; userId: string; amount: number }) {
  const user = userMap[userId];
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transakcia odoslaná</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="flex flex-col gap-2">
              <span>Odoslali ste <span className="font-bold">{amount} €</span> používateľovi <span className="font-bold">{user?.name || userId}</span>.</span>
              {user && <span>IBAN: <span className="font-mono">{user.eBankCode}</span></span>}
              <span className="text-[#95AF00] font-semibold">Transakcia bola úspešne spracovaná.</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction style={{ backgroundColor: '#95AF00', color: 'white' }}>Zavrieť</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Add the MoneyTransferToolUI component:
function MoneyTransferToolUI({ args }: { args: any }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  if (!args?.userId || !args?.amountInEuros) return null;
  return (
    <>
      <MoneyTransferConfirmation
        userId={args.userId}
        amount={args.amountInEuros}
        onConfirm={() => setDialogOpen(true)}
      />
      <MoneyTransferDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={args.userId}
        amount={args.amountInEuros}
      />
    </>
  );
}

// Add this component near the other money transfer components
function MoneyTransferResult({ result }: { result: { userId: string; amountInEuros: number } }) {
  const user = userMap[result.userId];
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <>
      <div className="flex flex-col gap-4 p-4 rounded-xl border bg-white shadow-md" style={{ borderColor: '#95AF00' }}>
        <div className="text-lg font-semibold text-[#95AF00]">Žiadosť o odoslanie peňazí</div>
        <div className="text-base text-gray-800">
          Chcete odoslať <span className="font-bold">{result.amountInEuros} €</span> používateľovi <span className="font-bold">{user?.name || result.userId}</span>?
        </div>
        {user && (
          <div className="text-sm text-gray-600">
            IBAN: <span className="font-mono">{user.eBankCode}</span>
          </div>
        )}
        <Button style={{ backgroundColor: '#95AF00', color: 'white' }} onClick={() => setDialogOpen(true)}>
          Potvrdiť odoslanie
        </Button>
      </div>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Poslať peniaze</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="flex flex-col gap-2">
                <span>Požiadavka na odoslanie <span className="font-bold">{result.amountInEuros} €</span> používateľovi <span className="font-bold">{user?.name || result.userId}</span>.</span>
                {user && <span>IBAN: <span className="font-mono">{user.eBankCode}</span></span>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction style={{ backgroundColor: '#95AF00', color: 'white' }}>Zavrieť</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// FreezeCardConfirmation component
function FreezeCardConfirmation({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border bg-white shadow-md" style={{ borderColor: '#E53935' }}>
      <div className="text-lg font-semibold text-[#E53935]">Chcete zablokovať svoju kartu?</div>
      <div className="text-base text-gray-800">
        Počas zablokovania karty nebude možné vykonávať žiadne platby ani výbery. Kartu môžete kedykoľvek opäť odblokovať v aplikácii.
      </div>
      <Button style={{ backgroundColor: '#E53935', color: 'white' }} onClick={onConfirm}>
        Zablokovať kartu
      </Button>
    </div>
  );
}

// FreezeCardDialog component
function FreezeCardDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Karta bola zablokovaná</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="flex flex-col gap-2">
              <span>Vaša karta bola úspešne zablokovaná. Nebude možné vykonávať žiadne platby ani výbery, kým ju opäť neodblokujete.</span>
              <span className="text-[#E53935] font-semibold">Kartu môžete kedykoľvek odblokovať v aplikácii.</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction style={{ backgroundColor: '#E53935', color: 'white' }}>Zavrieť</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// FreezeCardToolUI component
function FreezeCardToolUI({ args }: { args: any }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  // args can be used for future extension (e.g., card info)
  return (
    <>
      <FreezeCardConfirmation onConfirm={() => setDialogOpen(true)} />
      <FreezeCardDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

// FreezeCardResult component
function FreezeCardResult({ result }: { result: any }) {
  // result can be used for future extension (e.g., card info)
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <>
      <div className="flex flex-col gap-4 p-4 rounded-xl border bg-white shadow-md" style={{ borderColor: '#E53935' }}>
        <div className="text-lg font-semibold text-[#E53935]">Chcete zablokovať svoju kartu?</div>
        <div className="text-base text-gray-800">
        Počas zablokovania karty nebude možné vykonávať žiadne platby ani výbery. Kartu môžete kedykoľvek opäť odblokovať v aplikácii.
        </div>
        <Button style={{ backgroundColor: '#E53935', color: 'white' }} onClick={() => setDialogOpen(true)}>
          Zavrieť
        </Button>
      </div>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Karta bola zablokovaná</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="flex flex-col gap-2">
                <span>Vaša karta bola úspešne zablokovaná. Nebude možné vykonávať žiadne platby ani výbery, kým ju opäť neodblokujete.</span>
                <span className="text-[#E53935] font-semibold">Kartu môžete kedykoľvek odblokovať v aplikácii.</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction style={{ backgroundColor: '#E53935', color: 'white' }}>Zavrieť</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
