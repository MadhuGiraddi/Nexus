import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { SkeletonCard } from '../ui/Spinner';

const COLORS = ['#6C3BEE','#EC4899','#F59E0B','#10B981','#3B82F6','#8B5CF6','#06B6D4','#EF4444'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{payload[0].name}</p>
      <p className="tooltip-val">${Number(payload[0].value).toFixed(2)}</p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{(percent * 100).toFixed(0)}%</text>;
};

export default function SpendingDonut({ spending, loading }) {
  if (loading) return <SkeletonCard className="chart-skeleton" />;

  const data = (spending || []).slice(0, 8).map((s) => ({
    name:  s._id || 'Other',
    value: parseFloat(s.total.toFixed(2)),
  }));

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="glass-card widget chart-widget">
      <div className="widget-header">
        <div>
          <p className="widget-label">Spending by Category</p>
          <p className="widget-count">${total.toFixed(0)} this month</p>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="empty-sub" style={{ textAlign: 'center', padding: '40px 0' }}>No spending data yet</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderLabel}
                animationBegin={200}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="donut-legend">
            {data.map((d, i) => (
              <motion.div 
                key={d.name} 
                className="legend-item"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (i * 0.08), duration: 0.5 }}
              >
                <span className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="legend-name">{d.name}</span>
                <span className="legend-val">${d.value.toFixed(0)}</span>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
