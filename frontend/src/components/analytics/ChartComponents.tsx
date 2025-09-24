import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

interface ChartComponentsProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: ChartData;
  height?: number;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
];

const ChartComponents: React.FC<ChartComponentsProps> = ({
  type,
  data,
  height = 300,
  colors = DEFAULT_COLORS,
}) => {
  // Transform data for Recharts format
  const transformedData = data.labels.map((label, index) => {
    const point: any = { name: label };
    data.datasets.forEach((dataset) => {
      point[dataset.label] = dataset.data[index] || 0;
    });
    return point;
  });

  // For pie chart, transform to different format
  const pieData = data.datasets.length > 0 ? 
    data.labels.map((label, index) => ({
      name: label,
      value: data.datasets[0].data[index] || 0,
      color: colors[index % colors.length],
    })) : [];

  const renderTooltip = (props: any) => {
    if (!props.active || !props.payload) return null;

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium">{props.label}</p>
        {props.payload.map((item: any, index: number) => (
          <p key={index} style={{ color: item.color }} className="text-sm">
            {item.dataKey}: {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
          </p>
        ))}
      </div>
    );
  };

  const renderLegend = (props: any) => {
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-4">
        {props.payload?.map((item: any, index: number) => (
          <li key={index} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-700">{item.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip content={renderTooltip} />
              <Legend content={renderLegend} />
              {data.datasets.map((dataset, index) => (
                <Line
                  key={dataset.label}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={dataset.color || colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip content={renderTooltip} />
              <Legend content={renderLegend} />
              {data.datasets.map((dataset, index) => (
                <Bar
                  key={dataset.label}
                  dataKey={dataset.label}
                  fill={dataset.color || colors[index % colors.length]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip content={renderTooltip} />
              <Legend content={renderLegend} />
              {data.datasets.map((dataset, index) => (
                <Area
                  key={dataset.label}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={dataset.color || colors[index % colors.length]}
                  fill={dataset.color || colors[index % colors.length]}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || colors[index % colors.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={renderTooltip} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            サポートされていないチャートタイプです
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderChart()}
    </div>
  );
};

export default ChartComponents;