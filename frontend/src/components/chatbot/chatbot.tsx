'use client';

import { useState, useRef, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { handleChat } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Bot, Send, User, MessageSquarePlus } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';

type Message = {
  sender: 'user' | 'bot';
  text: string;
};

const initialState = {
  response: null,
  error: null,
};

function ChatSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending}>
      <Send className="h-4 w-4" />
      <span className="sr-only">Send</span>
    </Button>
  );
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, formAction, isPending] = useActionState(handleChat, initialState);
  const [inputVal, setInputVal] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.response) {
      setMessages((prev) => [...prev, { sender: 'bot', text: state.response as string }]);
    }
  }, [state]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages, isPending]);

  const handleFormSubmit = (formData: FormData) => {
    const query = (formData.get('query') as string || inputVal).trim();
    if (query) {
      setMessages((prev) => [...prev, { sender: 'user', text: query }]);
      const fd = new FormData();
      fd.append('query', query);
      formAction(fd);
      setInputVal('');
      formRef.current?.reset();
    }
  };

  const handleQuickQuestion = (q: string) => {
    setMessages((prev) => [...prev, { sender: 'user', text: q }]);
    const fd = new FormData();
    fd.append('query', q);
    formAction(fd);
  };

  const suggestions = [
    "What clubs are present on the website?",
    "What players are present on the website?",
    "Who plays football?",
    "Football speed benchmarks",
  ];

  return (
    <>
      <Button 
        size="icon" 
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-40"
        onClick={() => setOpen(true)}
        aria-label="Open Chatbot"
      >
        <MessageSquarePlus className="h-7 w-7" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col p-0">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle className="font-headline flex items-center gap-2">
              <Bot /> AI Assistant
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
            <div className="space-y-6 py-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 border-2 border-primary">
                    <AvatarFallback><Bot size={16}/></AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm">Hello! I'm the Sportlight AI assistant. How can I help you today?</p>
                </div>
              </div>

              {messages.length === 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground font-medium">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleQuickQuestion(s)}
                        className="text-xs bg-muted/70 hover:bg-muted text-foreground px-3 py-1.5 rounded-full border border-border/60 transition-colors text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index} className={cn("flex items-start gap-3", message.sender === 'user' && 'justify-end')}>
                  {message.sender === 'bot' && (
                    <Avatar className="w-8 h-8 border-2 border-primary shrink-0">
                        <AvatarFallback><Bot size={16}/></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "rounded-lg p-3 max-w-[80%]",
                    message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                  </div>
                   {message.sender === 'user' && (
                    <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback><User size={16}/></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isPending && (
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 border-2 border-primary shrink-0">
                    <AvatarFallback><Bot size={16} className="animate-spin" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground animate-pulse">Sportlight AI is thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 bg-background border-t">
            <form
              ref={formRef}
              action={handleFormSubmit}
              className="flex items-center gap-2"
            >
              <Input
                name="query"
                placeholder="Ask a question..."
                autoComplete="off"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
              />
              <ChatSubmitButton />
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

    