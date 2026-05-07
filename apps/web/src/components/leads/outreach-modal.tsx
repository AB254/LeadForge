"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MessageCircle,
  Instagram,
  Linkedin,
  Smartphone,
  Sparkles,
  Copy,
  Check,
  Send,
  Save,
  Loader2,
} from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { generateOutreach } from "@/lib/api";
import type { Lead } from "@/types";

interface OutreachModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
}

const CHANNELS = [
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { value: "INSTAGRAM", label: "Instagram", icon: Instagram },
  { value: "LINKEDIN", label: "LinkedIn", icon: Linkedin },
  { value: "SMS", label: "SMS", icon: Smartphone },
] as const;

export function OutreachModal({ open, onOpenChange, lead }: OutreachModalProps) {
  const [channel, setChannel] = React.useState("EMAIL");
  const [content, setContent] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [marking, setMarking] = React.useState(false);
  const [marked, setMarked] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setContent("");
      setCopied(false);
      setSaved(false);
      setMarked(false);
    }
  }, [open, channel]);

  const handleGenerate = async () => {
    if (!lead) return;
    setGenerating(true);
    try {
      const res = await generateOutreach(lead.id, channel);
      setContent(res.data.content);
    } catch (err) {
      console.error("Generation failed", err);
      setContent("Failed to generate outreach. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    // Placeholder — would call createTemplate API
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
  };

  const handleMarkSent = async () => {
    setMarking(true);
    // Placeholder — would call createMessage API
    await new Promise((r) => setTimeout(r, 800));
    setMarking(false);
    setMarked(true);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>
            Generate Outreach
            {lead && (
              <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
                for {lead.business.name}
              </span>
            )}
          </ModalTitle>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <Tabs value={channel} onValueChange={setChannel}>
            <TabsList className="w-full">
              {CHANNELS.map((ch) => (
                <TabsTrigger key={ch.value} value={ch.value} className="flex-1">
                  <ch.icon className="mr-1.5 h-3.5 w-3.5" />
                  {ch.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {CHANNELS.map((ch) => (
              <TabsContent key={ch.value} value={ch.value}>
                <div className="space-y-3">
                  {/* Generate button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full"
                  >
                    {generating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {generating ? "Generating..." : `Generate ${ch.label} Message with AI`}
                  </Button>

                  {/* Message preview / editor */}
                  <div className="relative">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={`Your ${ch.label.toLowerCase()} message will appear here after generation...`}
                      rows={10}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] resize-none"
                    />
                    <AnimatePresence>
                      {generating && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center rounded-lg bg-[var(--color-surface)]/80 backdrop-blur-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
                            <p className="text-sm text-[var(--color-text-muted)]">
                              AI is crafting your message...
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </ModalBody>

        <ModalFooter className="flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!content}
          >
            {copied ? (
              <Check className="mr-1.5 h-3.5 w-3.5 text-[var(--color-success)]" />
            ) : (
              <Copy className="mr-1.5 h-3.5 w-3.5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveTemplate}
            disabled={!content || saving || saved}
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : saved ? (
              <Check className="mr-1.5 h-3.5 w-3.5 text-[var(--color-success)]" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            {saved ? "Saved" : "Save as Template"}
          </Button>
          <Button
            size="sm"
            onClick={handleMarkSent}
            disabled={!content || marking || marked}
          >
            {marking ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : marked ? (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Send className="mr-1.5 h-3.5 w-3.5" />
            )}
            {marked ? "Marked as Sent" : "Mark as Sent"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
