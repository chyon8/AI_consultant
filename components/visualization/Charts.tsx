import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { ChartDataPoint } from '../../types';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const DARK_COLORS = ['#818cf8', '#4ade80', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee', '#f472b6'];

interface ChartContainerProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  height?: number;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ 
  title, 
  description, 
  children,
  height = 300
}) => (
  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
    {(title || description) && (
      <div className="mb-4">
        {title && (
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
        )}
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        )}
      </div>
    )}
    <div style={{ height }}>
      {children}
    </div>
  </div>
);

interface BarChartComponentProps {
  data: ChartDataPoint[];
  title?: string;
  description?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  barKeys?: string[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  title,
  description,
  xAxisKey = 'name',
  barKeys = ['value'],
  height = 300,
  showGrid = true,
  showLegend = false,
  formatValue = (v) => v.toLocaleString(),
}) => (
  <ChartContainer title={title} description={description} height={height}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />}
        <XAxis 
          dataKey={xAxisKey} 
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatValue}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1e293b', 
            border: 'none', 
            borderRadius: '8px',
            color: '#fff'
          }}
          formatter={(value: number) => [formatValue(value), '']}
        />
        {showLegend && <Legend />}
        {barKeys.map((key, index) => (
          <Bar 
            key={key}
            dataKey={key} 
            fill={COLORS[index % COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  </ChartContainer>
);

interface LineChartComponentProps {
  data: ChartDataPoint[];
  title?: string;
  description?: string;
  xAxisKey?: string;
  lineKeys?: string[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  areaFill?: boolean;
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  title,
  description,
  xAxisKey = 'name',
  lineKeys = ['value'],
  height = 300,
  showGrid = true,
  showLegend = false,
  areaFill = false,
}) => {
  const ChartComponent = areaFill ? AreaChart : LineChart;
  
  return (
    <ChartContainer title={title} description={description} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: 'none', 
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          {showLegend && <Legend />}
          {lineKeys.map((key, index) => (
            areaFill ? (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ) : (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

interface PieChartComponentProps {
  data: ChartDataPoint[];
  title?: string;
  description?: string;
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

export const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  title,
  description,
  height = 300,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100,
}) => (
  <ChartContainer title={title} description={description} height={height}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={{ stroke: '#64748b' }}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1e293b', 
            border: 'none', 
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        {showLegend && (
          <Legend 
            layout="horizontal" 
            align="center" 
            verticalAlign="bottom"
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  </ChartContainer>
);

interface ComparisonBarProps {
  data: { label: string; typeA: number; typeB: number; typeC: number }[];
  title?: string;
  description?: string;
  height?: number;
  formatValue?: (value: number) => string;
}

export const ComparisonBarChart: React.FC<ComparisonBarProps> = ({
  data,
  title,
  description,
  height = 300,
  formatValue = (v) => v.toLocaleString(),
}) => (
  <ChartContainer title={title} description={description} height={height}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
        <XAxis type="number" tickFormatter={formatValue} tick={{ fontSize: 11, fill: '#64748b' }} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} width={70} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1e293b', 
            border: 'none', 
            borderRadius: '8px',
            color: '#fff'
          }}
          formatter={(value: number) => [formatValue(value), '']}
        />
        <Legend />
        <Bar dataKey="typeA" name="TYPE A" fill="#6366f1" radius={[0, 4, 4, 0]} />
        <Bar dataKey="typeB" name="TYPE B" fill="#22c55e" radius={[0, 4, 4, 0]} />
        <Bar dataKey="typeC" name="TYPE C" fill="#f59e0b" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </ChartContainer>
);

export default { BarChartComponent, LineChartComponent, PieChartComponent, ComparisonBarChart };
