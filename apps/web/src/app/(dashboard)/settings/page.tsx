"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Bot,
  Download,
  Mail,
  Plus,
  Trash2,
  Save,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

interface SettingsState {
  scraping: {
    delay: number;
    maxBrowsers: number;
    proxyUrl: string;
  };
  ai: {
    provider: string;
    model: string;
    temperature: number;
  };
  export: {
    format: string;
    fields: string[];
  };
  templates: { id: string; name: string; type: string }[];
}

const EXPORT_FIELDS = [
  "business_name",
  "email",
  "phone",
  "website",
  "city",
  "state",
  "niche",
  "score",
  "priority",
  "pain_points",
  "opportunities",
];

const MODEL_OPTIONS: Record<string, string[]> = {
  anthropic: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-haiku-4-20250414"],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  gemini: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"],
};

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<SettingsState>({
    scraping: { delay: 2000, maxBrowsers: 3, proxyUrl: "" },
    ai: { provider: "anthropic", model: "claude-sonnet-4-20250514", temperature: 0.7 },
    export: { format: "csv", fields: ["business_name", "email", "phone", "website", "score", "priority"] },
    templates: [
      { id: "1", name: "Cold Outreach - Website Audit", type: "EMAIL" },
      { id: "2", name: "Follow-up - SEO Proposal", type: "EMAIL" },
      { id: "3", name: "LinkedIn Connection", type: "LINKEDIN" },
    ],
  });

  const [saving, setSaving] = React.useState(false);
  const [newTemplateName, setNewTemplateName] = React.useState("");

  function updateScraping(key: keyof SettingsState["scraping"], value: any) {
    setSettings((s) => ({ ...s, scraping: { ...s.scraping, [key]: value } }));
  }

  function updateAi(key: keyof SettingsState["ai"], value: any) {
    setSettings((s) => ({
      ...s,
      ai: {
        ...s.ai,
        [key]: value,
        ...(key === "provider" ? { model: MODEL_OPTIONS[value as string]?.[0] ?? "" } : {}),
      },
    }));
  }

  function updateExport(key: keyof SettingsState["export"], value: any) {
    setSettings((s) => ({ ...s, export: { ...s.export, [key]: value } }));
  }

  function toggleField(field: string) {
    setSettings((s) => {
      const fields = s.export.fields.includes(field)
        ? s.export.fields.filter((f) => f !== field)
        : [...s.export.fields, field];
      return { ...s, export: { ...s.export, fields } };
    });
  }

  function addTemplate() {
    if (!newTemplateName.trim()) return;
    setSettings((s) => ({
      ...s,
      templates: [
        ...s.templates,
        { id: crypto.randomUUID(), name: newTemplateName.trim(), type: "EMAIL" },
      ],
    }));
    setNewTemplateName("");
  }

  function removeTemplate(id: string) {
    setSettings((s) => ({
      ...s,
      templates: s.templates.filter((t) => t.id !== id),
    }));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  }

  return (
    <motion.div
      className="space-y-6"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
            <SettingsIcon className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Settings</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Configure scraping, AI, and export preferences
            </p>
          </div>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </motion.div>

      {/* Scraping Settings */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-[var(--color-primary)]" />
              <CardTitle>Scraping Settings</CardTitle>
            </div>
            <CardDescription>Configure web scraping behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Delay */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-muted)]">
                Delay Between Requests
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={500}
                  max={10000}
                  step={500}
                  value={settings.scraping.delay}
                  onChange={(e) => updateScraping("delay", Number(e.target.value))}
                  className="flex-1 accent-[var(--color-primary)]"
                />
                <span className="w-20 text-right text-sm font-medium text-[var(--color-text)]">
                  {settings.scraping.delay}ms
                </span>
              </div>
            </div>

            {/* Max browsers */}
            <Input
              label="Max Concurrent Browsers"
              type="number"
              min={1}
              max={10}
              value={settings.scraping.maxBrowsers}
              onChange={(e) => updateScraping("maxBrowsers", Number(e.target.value))}
            />

            {/* Proxy */}
            <Input
              label="Proxy URL"
              placeholder="socks5://user:pass@host:port"
              value={settings.scraping.proxyUrl}
              onChange={(e) => updateScraping("proxyUrl", e.target.value)}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Settings */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-[var(--color-accent)]" />
              <CardTitle>AI Settings</CardTitle>
            </div>
            <CardDescription>Configure AI provider and model preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Provider */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-muted)]">
                AI Provider
              </label>
              <Select
                value={settings.ai.provider}
                onValueChange={(v) => updateAi("provider", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-muted)]">
                Model
              </label>
              <Select
                value={settings.ai.model}
                onValueChange={(v) => updateAi("model", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(MODEL_OPTIONS[settings.ai.provider] ?? []).map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-muted)]">
                Temperature
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={settings.ai.temperature}
                  onChange={(e) => updateAi("temperature", Number(e.target.value))}
                  className="flex-1 accent-[var(--color-primary)]"
                />
                <span className="w-12 text-right text-sm font-medium text-[var(--color-text)]">
                  {settings.ai.temperature.toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Export Settings */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-[var(--color-success)]" />
              <CardTitle>Export Settings</CardTitle>
            </div>
            <CardDescription>Configure default export format and fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-muted)]">
                Default Export Format
              </label>
              <Select
                value={settings.export.format}
                onValueChange={(v) => updateExport("format", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fields */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-muted)]">
                Included Fields
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPORT_FIELDS.map((field) => {
                  const active = settings.export.fields.includes(field);
                  return (
                    <button
                      key={field}
                      onClick={() => toggleField(field)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                        active
                          ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-muted)]"
                      }`}
                    >
                      {field.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Outreach Templates */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[var(--color-warning,#f59e0b)]" />
              <CardTitle>Outreach Templates</CardTitle>
            </div>
            <CardDescription>Manage your email and outreach templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing templates */}
            {settings.templates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center">
                <Mail className="mx-auto h-8 w-8 text-[var(--color-text-dim)]" />
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  No templates yet. Create one below.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {settings.templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-3 transition-colors hover:bg-[var(--color-surface)]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-[var(--color-text)] truncate">
                        {template.name}
                      </span>
                      <Badge variant="outline">{template.type}</Badge>
                    </div>
                    <button
                      onClick={() => removeTemplate(template.id)}
                      className="shrink-0 rounded-md p-1.5 text-[var(--color-text-dim)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new */}
            <div className="flex gap-3 pt-2">
              <Input
                placeholder="New template name..."
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTemplate()}
                className="flex-1"
              />
              <Button
                variant="secondary"
                onClick={addTemplate}
                disabled={!newTemplateName.trim()}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
