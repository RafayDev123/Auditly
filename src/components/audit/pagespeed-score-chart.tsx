"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type PageSpeedScorePoint = {
  category: string;
  mobile: number | null;
  desktop: number | null;
};

export function PageSpeedScoreChart({ data }: { data: PageSpeedScorePoint[] }) {
  const hasScores = data.some((point) => point.mobile !== null || point.desktop !== null);
  if (!hasScores) return null;

  return (
    <div className="mt-4 h-72 w-full min-w-0" aria-label="Mobile and desktop Google Lighthouse score comparison">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: -16 }} accessibilityLayer>
          <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="category" tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => [`${value ?? "—"} / 100`, "Score"]} />
          <Legend />
          <Bar dataKey="mobile" name="Mobile" fill="#0f766e" radius={[3, 3, 0, 0]} />
          <Bar dataKey="desktop" name="Desktop" fill="#ea580c" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}