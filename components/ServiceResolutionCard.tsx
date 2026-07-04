/**
 * Shown once a taxonomy branch is confidently matched to what the
 * citizen said. Marks the transition from "figuring out intent" to
 * "collecting the details for a specific service."
 */

interface ServiceResolutionCardProps {
  label: string;
}

export default function ServiceResolutionCard({ label }: ServiceResolutionCardProps) {
  return (
    <div className="service-card">
      <span className="eyebrow">Service matched</span>
      <h3>{label}</h3>
      <p>Starting your request — I'll ask a few quick questions.</p>
    </div>
  );
}
