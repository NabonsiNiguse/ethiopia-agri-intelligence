import { useState, useRef, useEffect } from "react";
import { useSendAdvisoryMessage, useListAdvisorySessions, getListAdvisorySessionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Mic, Bot } from "lucide-react";
import { AdvisoryMessageRequestLanguage } from "@workspace/api-zod";

export default function Advisory() {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<AdvisoryMessageRequestLanguage>("en");
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendMutation = useSendAdvisoryMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    const currentInput = input;
    setInput("");

    sendMutation.mutate({
      data: {
        farmerId: 1, // hardcoded for demo
        message: currentInput,
        language: language,
      }
    }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
      }
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Farming Advisor</h1>
          <p className="text-muted-foreground mt-1">Context-aware agricultural intelligence</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={language} onValueChange={(v) => setLanguage(v as AdvisoryMessageRequestLanguage)}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="am">Amharic</SelectItem>
              <SelectItem value="om">Afaan Oromo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="flex-1 flex flex-col shadow-sm overflow-hidden border-border/50">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <Bot className="w-8 h-8" />
              </div>
              <p className="max-w-md">
                I am your AI agricultural extension expert. Ask me about crop diseases, planting schedules, soil management, or market trends.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-card text-card-foreground border border-border rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {sendMutation.isPending && (
             <div className="flex justify-start">
               <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-2 text-muted-foreground">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 <span className="text-sm font-medium">Analyzing...</span>
               </div>
             </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
        <div className="p-4 bg-card border-t border-border shrink-0">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <Button variant="outline" size="icon" className="shrink-0 rounded-full text-muted-foreground hover:text-primary" title="Voice Input">
              <Mic className="w-5 h-5" />
            </Button>
            <Input 
              placeholder="Type your question..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 rounded-full bg-muted/50 border-transparent focus-visible:ring-primary/20 focus-visible:bg-background"
            />
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || sendMutation.isPending}
              className="rounded-full shrink-0 px-6 gap-2"
            >
              Send <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}