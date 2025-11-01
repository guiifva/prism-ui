import type { BannerPlacement, BannerProduct } from "../types/banner";

// Traduções para Placement
export const PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  HOME_SCREEN_TOP_BANNERS: "Home - Topo",
  HOME_SCREEN_MIDDLE_BANNERS: "Home - Meio",
  ALL_PRODUCTS_SCREEN_BOTTOM_BANNERS: "Produtos - Rodapé",
};

// Traduções para Product
export const PRODUCT_LABELS: Record<BannerProduct, string> = {
  CREDIT: "Crédito",
  ANTICIPATION: "Antecipação",
  CREDIT_CARD: "Cartão de Crédito",
  ASSURANCE: "Seguro",
};
