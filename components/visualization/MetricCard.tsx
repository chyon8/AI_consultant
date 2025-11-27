import React from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, Clock, Users, Layers, Package } from 'lucide-react';
import { MetricCardData } from '../../types';

interface MetricCardProps extends MetricCardData {
  size?: 'sm' | 'md' | 'lg';
}

const iconMap: Record<string, React.ElementType> = {
  dollar: DollarSign,
  clock: Clock,
  users: Users,
  layers: Layers,
  package: Package,
};

const colorClasses: Record<string, { bg: string; text: string; accent: string }> = {
  blue: { 
    bg: 'bg-blue-50 dark:bg-blue-900/20', 
    text: 'text-blue-600 dark:text-blue-400',
    accent: 'bg-blue-500'
  },
  green: { 
    bg: 'bg-emerald-50 dark:bg-emerald-900/20', 
    text: 'text-emerald-600 dark:text-emerald-400',
    accent: 'bg-emerald-500'
  },
  orange: { 
    bg: 'bg-amber-50 dark:bg-amber-900/20', 
    text: 'text-amber-600 dark:text-amber-400',
    accent: 'bg-amber-500'
  },
  red: { 
    bg: 'bg-red-50 dark:bg-red-900/20', 
    text: 'text-red-600 dark:text-red-400',
    accent: 'bg-red-500'
  },
  purple: { 
    bg: 'bg-purple-50 dark:bg-purple-900/20', 
    text: 'text-purple-600 dark:text-purple-400',
    accent: 'bg-purple-500'
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  trend,
  trendValue,
  icon,
  color = 'blue',
  size = 'md',
}) => {
  const IconComponent = icon ? iconMap[icon] : null;
  const colors = colorClasses[color] || colorClasses.blue;
  
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColorClass = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400';

  return (
    <div className={`${colors.bg} rounded-xl ${sizeClasses[size]} border border-slate-200/50 dark:border-slate-700/50 transition-all hover:shadow-lg hover:scale-[1.02]`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {IconComponent && (
          <div className={`${colors.text} p-1.5 rounded-lg ${colors.bg}`}>
            <IconComponent className="w-4 h-4" />
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-1.5">
        <span className={`${valueSizeClasses[size]} font-bold text-slate-900 dark:text-white`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {trend && trendValue && (
        <div className={`flex items-center gap-1 mt-2 ${trendColorClass}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{trendValue}</span>
        </div>
      )}
    </div>
  );
};

interface MetricCardGridProps {
  metrics: MetricCardData[];
  columns?: 2 | 3 | 4;
}

export const MetricCardGrid: React.FC<MetricCardGridProps> = ({ metrics, columns = 3 }) => {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default MetricCard;
