'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, RefreshCw, Copy, ThumbsUp, ThumbsDown, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { aiMessages } from '@/lib/mock-data/everyday'
import { cn } from '@/lib/utils'

const suggestedQuestions = [
  'How do I build my emergency fund faster?',
  'What happens if I lose my job next month?',
  'Should I prioritize HSA or 401k contributions?',
  'How much should I have saved by age 35?',
  "What's the best way to reduce my credit card risk?",
  'How do I negotiate my rent renewal?',
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>(aiMessages as Message[])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text?: string) => {
    const content = text ?? input.trim()
    if (!content) return

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    await new Promise(r => setTimeout(r, 1500))
    setIsTyping(false)

    const responses: Record<string, string> = {
      default: `That's a great question about "${content}". Based on your current risk profile — with a medium risk score of 42, 66-day emergency buffer, and medical preparedness at 20% — here's what I'd suggest:\n\n**1. Prioritize the highest-gap scenario first**\nYour medical emergency preparedness is your biggest vulnerability. Focus your next $150/month there.\n\n**2. Build the habit before the amount**\nAutomatic transfers on payday remove willpower from the equation. Even $50 consistently beats $500 irregularly.\n\n**3. Track your baseline**\nNow that we've modeled your risks, update this chat monthly. Small improvements compound quickly.\n\nWant me to walk through a specific action plan?`,
    }

    const aiMsg: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: responses.default,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, aiMsg])
  }

  const formatContent = (content: string) => {
    // Simple markdown-like rendering
    return content
      .split('\n\n')
      .map((para, i) => {
        if (para.startsWith('**') && para.includes('**')) {
          const parts = para.split('**')
          return (
            <p key={i} className="mb-2">
              {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-text-primary">{part}</strong> : part)}
            </p>
          )
        }
        return <p key={i} className="mb-2 last:mb-0">{para}</p>
      })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center shadow-glow-sm">
            <ShieldCheck className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">RiskForge Coach</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-text-muted">AI-powered · Personalized to your profile</span>
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          New conversation
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i < 3 ? i * 0.05 : 0 }}
              className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0 mt-0.5 shadow-glow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-text-secondary">
                  AR
                </div>
              )}

              <div className={cn(
                'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-brand-500/15 text-text-primary border border-brand-500/20 rounded-tr-sm'
                  : 'bg-white/[0.04] text-text-secondary border border-white/[0.07] rounded-tl-sm'
              )}>
                {formatContent(msg.content)}

                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/[0.06]">
                    <Button variant="ghost" size="icon-sm" className="text-text-disabled hover:text-text-muted">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-text-disabled hover:text-text-muted">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-text-disabled hover:text-text-muted">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-text-muted"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      <div className="px-6 py-3 border-t border-white/[0.04] flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {suggestedQuestions.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="flex-shrink-0 text-xs px-3 py-2 rounded-xl border border-white/[0.07] text-text-muted hover:border-brand-500/30 hover:text-brand-400 hover:bg-brand-500/5 transition-all whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-3 flex-shrink-0 border-t border-white/[0.06]">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask anything about your financial risk..."
              className="h-12 pr-4 text-sm"
            />
          </div>
          <Button
            variant="brand"
            size="icon"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            className="h-12 w-12 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-text-disabled mt-2 text-center">
          AI Coach is personalized to your risk profile. Not financial advice.
        </p>
      </div>
    </div>
  )
}
