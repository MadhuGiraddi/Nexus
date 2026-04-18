import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { SkeletonCard } from '../ui/Spinner';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill, fontSize: 12, margin: '2px 0' }}>
          {p.name}: ${Number(p.value).toFixed(0)}
        </p>
      ))}
    </div>
  );
};

const CATEGORY_COLORS = {
  'Food and Drink': '#F59E0B',
  'Travel':         '#6C3BEE',
  'Shopping':       '#EC4899',
  'Transfer':       '#3B82F6',
  'Payment':        '#10B981',
  'Shops':          '#EC4899',
  'Recreation':     '#8B5CF6',
  'Service':        '#06B6D4',
  'Healthcare':     '#EF4444',
  'Other':          '#64748B',
};

export default function CashFlowChart({ cashflow, loading }) {
  if (loading) return <SkeletonCard className="chart-skeleton" />;

  const data = (cashflow || []).map((d) => {
    const row = {
      date:   format(parseISO(d._id), 'MMM d'),
      Income: parseFloat((d.income || 0).toFixed(2)),
      Spent:  parseFloat((d.spent  || 0).toFixed(2)),
    };
    if (d.categories) {
      Object.entries(d.categories).forEach(([cat, val]) => {
        row[cat] = parseFloat(val.toFixed(2));
      });
    }
    return row;
  });

  const uniqueCats = Array.from(new Set(
    data.flatMap(d => Object.keys(d).filter(k => k !== 'date' && k !== 'Income' && k !== 'Spent'))
  ));

  const totalIncome = data.reduce((s, d) => s + d.Income, 0);
  const totalSpent  = data.reduce((s, d) => s + d.Spent,  0);
  const saved       = totalIncome - totalSpent;

  return (
    <div className="glass-card widget chart-widget chart-wide">
      <div className="widget-header">
        <div>
          <p className="widget-label">Cash Flow — Last 30 Days</p>
        </div>
        <div className="cashflow-chips">
          <span className="chip green">↑ ${totalIncome.toFixed(0)} in</span>
          <span className="chip pink">↓ ${totalSpent.toFixed(0)} out</span>
          <span className={`chip ${saved >= 0 ? 'green' : 'pink'}`}>
            {saved >= 0 ? '✦' : '⚠'} ${Math.abs(saved).toFixed(0)} {saved >= 0 ? 'saved' : 'overspent'}
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="empty-sub" style={{ textAlign: 'center', padding: '40px 0' }}>No cash flow data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#666', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#666', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar 
              dataKey="Income" 
              fill="#10B981" 
              radius={[4,4,0,0]} 
              maxBarSize={18} 
              animationBegin={100} 
              animationDuration={1200} 
            />
            {uniqueCats.map((cat, i) => (
              <Bar 
                key={cat} 
                dataKey={cat} 
                stackId="spent" 
                fill={CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other} 
                maxBarSize={18} 
                animationBegin={300 + (i * 100)} 
                animationDuration={1000} 
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
