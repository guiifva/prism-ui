import { Campaign, MOCK_CAMPAIGNS } from "../mocks/campaigns";

const STORAGE_KEY = "prism_campaigns";

// Inicializa o localStorage com os dados mock se estiver vazio
function initializeStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_CAMPAIGNS));
  }
}

// Recupera todas as campanhas do localStorage
export function getCampaigns(): Campaign[] {
  initializeStorage();
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Recupera uma campanha específica por ID
export function getCampaignById(id: string): Campaign | undefined {
  const campaigns = getCampaigns();
  return campaigns.find((c) => c.id === id);
}

// Cria uma nova campanha
export function createCampaign(data: Omit<Campaign, "id" | "createdAt" | "updatedAt">): Campaign {
  const campaigns = getCampaigns();

  const newCampaign: Campaign = {
    ...data,
    id: `camp_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  campaigns.push(newCampaign);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));

  return newCampaign;
}

// Atualiza uma campanha existente
export function updateCampaign(
  id: string,
  data: Partial<Omit<Campaign, "id" | "createdAt" | "updatedAt">>
): Campaign | null {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex((c) => c.id === id);

  if (index === -1) {
    return null;
  }

  campaigns[index] = {
    ...campaigns[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
  return campaigns[index];
}

// Deleta uma campanha
export function deleteCampaign(id: string): boolean {
  const campaigns = getCampaigns();
  const filtered = campaigns.filter((c) => c.id !== id);

  if (filtered.length === campaigns.length) {
    return false; // Campanha não encontrada
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// Busca campanhas por nome
export function searchCampaignsByName(query: string): Campaign[] {
  const campaigns = getCampaigns();
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return campaigns;
  }

  return campaigns.filter((c) =>
    c.name.toLowerCase().includes(lowerQuery) ||
    c.description.toLowerCase().includes(lowerQuery)
  );
}

// Filtra campanhas por status
export function filterCampaignsByStatus(status: Campaign["status"] | "ALL"): Campaign[] {
  const campaigns = getCampaigns();

  if (status === "ALL") {
    return campaigns;
  }

  return campaigns.filter((c) => c.status === status);
}

// Alterna o status da campanha entre ACTIVE e PAUSED
export function toggleCampaignStatus(id: string): Campaign | null {
  const campaign = getCampaignById(id);

  if (!campaign) {
    return null;
  }

  // Só permite alternar entre ACTIVE e PAUSED
  if (campaign.status !== "ACTIVE" && campaign.status !== "PAUSED") {
    return null;
  }

  const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
  return updateCampaign(id, { status: newStatus });
}

// Reseta o localStorage para os dados mock originais
export function resetToMockData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_CAMPAIGNS));
}
