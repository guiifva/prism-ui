/**
 * Constantes de status compartilhadas entre Campaign e Banner
 */

import type { CampaignStatus } from "../mocks/campaigns";
import type { BannerStatus } from "../types/banner";

// Campaign Status
export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  FINISHED: "Finalizada",
  SCHEDULED: "Agendada",
};

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  ACTIVE: "bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-600/20 dark:text-primary-200 dark:border-primary-500/40",
  PAUSED: "bg-warning-100 text-warning-700 border border-warning-200 dark:bg-warning-600/20 dark:text-warning-200 dark:border-warning-500/40",
  FINISHED: "bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-600/40",
  SCHEDULED: "bg-info-100 text-info-700 border border-info-200 dark:bg-info-600/20 dark:text-info-200 dark:border-info-500/40",
};

// Banner Status
export const BANNER_STATUS_LABELS: Record<BannerStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  PENDING: "Pendente",
  REJECTED: "Rejeitado",
};

export const BANNER_STATUS_COLORS: Record<BannerStatus, string> = {
  ACTIVE: "bg-success-100 text-success-700 border border-success-200 dark:bg-success-600/20 dark:text-success-200 dark:border-success-500/40",
  INACTIVE: "bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-600/40",
  PENDING: "bg-warning-100 text-warning-700 border border-warning-200 dark:bg-warning-600/20 dark:text-warning-200 dark:border-warning-500/40",
  REJECTED: "bg-error-100 text-error-700 border border-error-200 dark:bg-error-600/20 dark:text-error-200 dark:border-error-500/40",
};

// Provider Badge Classes
export const PROVIDER_BADGE_CLASSES: Record<string, string> = {
  WHATSAPP: "bg-channel-whatsapp-500 text-white border border-channel-whatsapp-600 shadow-sm dark:bg-channel-whatsapp-500/90",
  EMAIL: "bg-channel-email-500 text-white border border-channel-email-600 shadow-sm dark:bg-channel-email-500/90",
  PUSH: "bg-channel-push-500 text-white border border-channel-push-600 shadow-sm dark:bg-channel-push-500/90",
  SMS: "bg-channel-sms-500 text-white border border-channel-sms-600 shadow-sm dark:bg-channel-sms-500/90",
  AI_AGENT: "bg-wine-600 text-white border border-wine-700 shadow-sm dark:bg-wine-600/90",
};

export const PROVIDER_TYPE_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  PUSH: "Push",
  SMS: "SMS",
  AI_AGENT: "Agente de IA",
};
