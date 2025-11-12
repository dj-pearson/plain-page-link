import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative p-6 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20">
      <div className="flex flex-col items-start gap-4">
        <div className="p-3 bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] rounded-lg text-white group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-normal tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-sm glass-body leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
