import type { CampaignStatus } from "../mocks/campaigns";
import type { BannerStatus } from "../types/banner";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
  BANNER_STATUS_LABELS,
  BANNER_STATUS_COLORS,
} from "../constants/status";

interface StatusBadgeProps {
  status: CampaignStatus | BannerStatus;
  type: "campaign" | "banner";
  className?: string;
}

export default function StatusBadge({ status, type, className = "" }: StatusBadgeProps) {
  const labels = type === "campaign" ? CAMPAIGN_STATUS_LABELS : BANNER_STATUS_LABELS;
  const colors = type === "campaign" ? CAMPAIGN_STATUS_COLORS : BANNER_STATUS_COLORS;

  const label = labels[status as keyof typeof labels] || status;
  const colorClass = colors[status as keyof typeof colors] || "";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
}
