// Mock de campanhas para demonstração
export type CampaignStatus = "ACTIVE" | "PAUSED" | "FINISHED" | "SCHEDULED";

export interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  segments: string[];
  providers: any[];
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "camp_001",
    name: "black-friday-2025-vip",
    description: "Campanha de Black Friday para segmentos VIP e alta recorrência.",
    startDate: "2025-11-25",
    endDate: "2025-11-30",
    segments: ["seg_black_friday_vips", "seg_high_ltv"],
    providers: [
      {
        id: "prov_001",
        type: "WHATSAPP",
        label: "WhatsApp VIP",
        config: {
          providerId: "wpp_meta_01",
          botName: "bf-bot-vip",
          flowId: "flow_123456",
          templateId: "tpl_bf_offer",
          fieldMappings: {
            name: "d_first_name",
            creditvalue: "m_creditengine_last_offer_value_max_formatted",
            credittax: "m_credit_tax"
          }
        }
      }
    ],
    status: "ACTIVE",
    createdAt: "2025-10-15T10:30:00Z",
    updatedAt: "2025-10-15T10:30:00Z"
  },
  {
    id: "camp_002",
    name: "credito-aprovado-notificacao",
    description: "Notificação automática para usuários com crédito aprovado.",
    startDate: "2025-10-01",
    endDate: "2025-12-31",
    segments: ["seg_new_users"],
    providers: [
      {
        id: "prov_002",
        type: "PUSH",
        label: "Push Notification",
        config: {
          providerId: "push_firebase_01",
          title: "Crédito Aprovado!",
          body: "Seu crédito foi aprovado. Confira agora.",
          deepLink: "myapp://credit-approved",
          imageUrl: ""
        }
      },
      {
        id: "prov_003",
        type: "EMAIL",
        label: "Email",
        config: {
          providerId: "email_ses_01",
          senderEmail: "noreply@prism.com",
          senderName: "Prism",
          subject: "Crédito Aprovado",
          templateId: "tpl_email_credit_approval",
          fieldMappings: {
            name: "d_first_name",
            tradingname: "d_trading_name",
            creditvalue: "m_creditengine_last_offer_value_max_formatted"
          }
        }
      }
    ],
    status: "ACTIVE",
    createdAt: "2025-09-20T14:00:00Z",
    updatedAt: "2025-09-20T14:00:00Z"
  },
  {
    id: "camp_003",
    name: "cartao-oferta-especial",
    description: "Oferta de cartão de crédito para alta recorrência.",
    startDate: "2025-11-01",
    endDate: "2025-11-15",
    segments: ["seg_high_ltv"],
    providers: [
      {
        id: "prov_004",
        type: "AI_AGENT",
        label: "Agente de IA",
        config: {
          providerId: "ai_blip_01",
          blipBotId: "bot-card-offer-001",
          templateId: "tpl_card_offer",
          fieldMappings: {
            name: "d_first_name",
            tradingname: "d_trading_name",
            limite: "m_credit_card_limit_approved"
          }
        }
      }
    ],
    status: "SCHEDULED",
    createdAt: "2025-10-10T09:15:00Z",
    updatedAt: "2025-10-10T09:15:00Z"
  },
  {
    id: "camp_004",
    name: "retencao-churn-risk",
    description: "Campanha de retenção para usuários com risco de churn.",
    startDate: "2025-09-01",
    endDate: "2025-09-30",
    segments: ["seg_churn_risk"],
    providers: [
      {
        id: "prov_005",
        type: "WHATSAPP",
        label: "WhatsApp",
        config: {
          providerId: "wpp_360_01",
          botName: "retention-bot",
          flowId: "flow_retention_001",
          templateId: "tpl_credit_approval",
          fieldMappings: {
            name: "d_first_name",
            tradingname: "d_trading_name",
            creditvalue: "m_creditengine_last_offer_value_max_formatted"
          }
        }
      }
    ],
    status: "FINISHED",
    createdAt: "2025-08-25T16:45:00Z",
    updatedAt: "2025-08-25T16:45:00Z"
  },
  {
    id: "camp_005",
    name: "cupom-ativo-promocao",
    description: "Promoção para usuários com cupom ativo.",
    startDate: "2025-10-20",
    endDate: "2025-10-25",
    segments: ["seg_cupom_ativo"],
    providers: [
      {
        id: "prov_006",
        type: "PUSH",
        label: "Push Notification",
        config: {
          providerId: "push_sns_01",
          title: "Seu cupom está ativo!",
          body: "Use seu cupom agora e ganhe desconto exclusivo.",
          deepLink: "myapp://coupons",
          imageUrl: "https://example.com/coupon.png"
        }
      }
    ],
    status: "PAUSED",
    createdAt: "2025-10-12T11:20:00Z",
    updatedAt: "2025-10-18T15:30:00Z"
  }
];
