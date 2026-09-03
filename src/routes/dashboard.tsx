import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import {
  Droplets,
  Leaf,
  Users,
  Gauge,
  TriangleAlert,
  Bot,
  Waves,
  CloudRain,
  TreePine,
} from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { computeDashboard, simulateTepi, TEPI_WEIGHTS, type TepiRecord } from "@/lib/tepi";

const TITLE = "AgriStatX TourismEcoAI — Indeks Tekanan Pelancongan Alam Sekitar";
const DESC =
  "Papan pemuka TEPI: indeks komposit tekanan pelancongan terhadap air, kualiti marin, iklim dan hutan simpan bagi 13 negeri Malaysia.";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Dashboard,
});

const riskVar = (tone: TepiRecord["riskTone"]) => `var(--risk-${tone})`;

function toneOf(score: number): TepiRecord["riskTone"] {
  if (score >= 75) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "moderate";
  return "low";
}

function KpiCard({
  label,
  value,
  unit,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit?: string;
  note: string;
  icon: React.ElementType;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        <span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold text-foreground">
        {value}
        {unit ? <span className="ml-1 text-base font-semibold text-muted-foreground">{unit}</span> : null}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  tag,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  tag?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {action}
          {tag ? (
            <span className="rounded-full bg-secondary px-3 py-1 text-[0.68rem] font-semibold text-secondary-foreground">
              {tag}
            </span>
          ) : null}
        </div>
      </header>
      {children}
    </section>
  );
}

function Dashboard() {
  const data = useMemo(() => computeDashboard(), []);
  const [growthPct, setGrowthPct] = useState(0);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const growth = growthPct / 100;

  const records = data.records;
  const filteredRecords = selectedStates.length
    ? records.filter((record) => selectedStates.includes(record.state))
    : records;

  const toggleState = (state: string) => {
    setSelectedStates((current) =>
      current.includes(state) ? current.filter((item) => item !== state) : [...current, state],
    );
  };
  const rankingData = filteredRecords.map((r) => {
    const value = simulateTepi(r.tepi, growth);
    return { state: r.state, tepi: Number(value.toFixed(1)), tone: toneOf(value) };
  });

  const bubbleData = filteredRecords.map((r) => ({
    state: r.state,
    x: r.waterIntensity,
    y: r.wqi,
    z: r.forest,
    tone: r.riskTone,
  }));

  const stackData = filteredRecords.map((r) => {
    const total = Object.values(r.subScores).reduce((a, b) => a + b, 0) || 1;
    const p = (n: number) => Number(((n / total) * 100).toFixed(1));
    return {
      state: r.state,
      Pelancongan: p(r.subScores.tourism),
      "Penggunaan Air": p(r.subScores.water),
      "Tekanan Marin": p(r.subScores.wqi),
      Hujan: p(r.subScores.climate),
      "Hutan Simpan": p(r.subScores.forest),
    };
  });

  const projTourists = data.kpi.totalTourists * (1 + growth);
  const projWater = data.kpi.totalWater * (1 + growth * 1.05);
  const projAvg = filteredRecords.length
    ? filteredRecords.reduce((a, r) => a + simulateTepi(r.tepi, growth), 0) / filteredRecords.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-dosm text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary-foreground/15">
              <Leaf className="size-6" />
            </span>
            <div>
              <h1 className="font-display text-xl font-extrabold leading-tight">AgriStatX TourismEcoAI</h1>
              <p className="text-xs text-primary-foreground/75">
                DOSM Datathon 2026 • Model Kepintaran Tekanan Alam Sekitar Pelancongan
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="rounded-md border border-primary-foreground/30 px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
          >
            Tentang TEPI
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Pelancong Domestik"
            value={data.kpi.totalTourists.toFixed(1)}
            unit="M"
            note="Survei DTS rasmi"
            icon={Users}
          />
          <KpiCard
            label="Penggunaan Air"
            value={data.kpi.totalWater.toLocaleString("ms-MY")}
            unit="Juta m³"
            note="Isipadu tahunan"
            icon={Droplets}
          />
          <KpiCard
            label="Purata TEPI"
            value={data.kpi.avgTEPI.toFixed(1)}
            unit="/ 100"
            note="Indeks komposit berpemberat"
            icon={Gauge}
          />
          <KpiCard
            label="Negeri Berisiko"
            value={String(data.kpi.criticalZones)}
            unit="Negeri"
            note="Had kritikal (≥ 70)"
            icon={TriangleAlert}
          />
        </div>

        {/* Simulator */}
        <section className="gradient-dosm rounded-xl p-6 text-primary-foreground shadow-[var(--shadow-card)]">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="font-display text-lg font-bold">Enjin Simulasi Polisi &ldquo;What-If&rdquo;</h2>
              <p className="mt-1 text-sm text-primary-foreground/75">
                Uji impak peningkatan pelancong terhadap keperluan air dan indeks TEPI.
              </p>
              <div className="mt-5 flex items-center gap-4">
                <Slider
                  value={[growthPct]}
                  onValueChange={(v) => setGrowthPct(v[0] ?? 0)}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="min-w-[9.5rem] rounded-lg bg-accent px-3 py-1.5 text-center text-sm font-bold text-accent-foreground">
                  +{growthPct}% Pelancong
                </span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                { l: "Unjuran Pelancong", v: `${projTourists.toFixed(1)} M` },
                { l: "Unjuran Keperluan Air", v: `${projWater.toLocaleString("en-US", { maximumFractionDigits: 0 })} Juta m³` },
                { l: "Unjuran Purata TEPI", v: projAvg.toFixed(1) },
              ].map((item) => (
                <div
                  key={item.l}
                  className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-3 backdrop-blur-sm"
                >
                  <p className="text-[0.68rem] uppercase tracking-wide text-primary-foreground/70">{item.l}</p>
                  <p className="mt-1 font-display text-xl font-bold">{item.v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title="Kedudukan Skor TEPI mengikut Negeri" tag="Skala 0 – 100">
            <div className="h-[360px] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingData} margin={{ top: 8, right: 8, bottom: 52, left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="state"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    label={{ value: "Negeri", position: "insideBottom", offset: -38, fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    label={{ value: "Skor", angle: -90, position: "insideLeft", offset: 4, fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="tepi" name="Skor TEPI" radius={[4, 4, 0, 0]}>
                    {rankingData.map((d) => (
                      <Cell key={d.state} fill={riskVar(d.tone)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title="Intensiti Air vs Kualiti Air Marin (MWQI)"
            tag="Matriks sensitiviti"
            action={
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" aria-label="Tapis dashboard mengikut negeri">
                    {selectedStates.length ? `${selectedStates.length} negeri dipilih` : "Semua negeri"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[240px] p-2">
                  <div className="flex items-center justify-between px-2 pb-2">
                    <p className="text-xs font-semibold text-muted-foreground">Pilih negeri</p>
                    {selectedStates.length ? (
                      <button
                        type="button"
                        className="text-xs font-semibold text-primary hover:underline"
                        onClick={() => setSelectedStates([])}
                      >
                        Reset
                      </button>
                    ) : null}
                  </div>
                  {records.map((record) => (
                    <label
                      key={record.state}
                      className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedStates.includes(record.state)}
                        onCheckedChange={() => toggleState(record.state)}
                      />
                      <span>{record.state}</span>
                    </label>
                  ))}
                </PopoverContent>
              </Popover>
            }
          >
            <div className="h-[360px] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 16, bottom: 30, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Intensiti air (m³/pelancong)"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    label={{ value: "m³ / pelancong", position: "insideBottom", offset: -18, fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={[50, 95]}
                    name="MWQI"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <ZAxis type="number" dataKey="z" range={[80, 900]} name="Hutan simpan (k Ha)" />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload[0].payload as (typeof bubbleData)[number];
                      return (
                        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
                          <p className="mb-1 font-bold text-foreground">{point.state}</p>
                          <p>Intensiti air: {point.x} m³/pelancong</p>
                          <p>MWQI: {point.y}</p>
                          <p>Hutan simpan: {point.z} k Ha</p>
                        </div>
                      );
                    }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      fontSize: 12,
                    }}
                    formatter={(v: number, n: string) => [v, n]}
                  />
                  <Scatter data={bubbleData} name="Negeri">
                    {bubbleData.map((d) => (
                      <Cell key={d.state} fill={riskVar(d.tone)} fillOpacity={0.7} />
                    ))}
                    <LabelList dataKey="state" position="top" fill="var(--foreground)" fontSize={10} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Penguraian 5 Komponen Pemacu Tekanan Alam Sekitar"
          subtitle={`Pelancongan ${TEPI_WEIGHTS.tourism * 100}% • Air ${TEPI_WEIGHTS.water * 100}% • Tekanan Marin ${TEPI_WEIGHTS.wqi_marine * 100}% • Hujan ${TEPI_WEIGHTS.climate * 100}% • Hutan ${TEPI_WEIGHTS.forest * 100}%`}
          tag="100% Stacked Analysis"
        >
          <div className="h-[520px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackData} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis type="category" dataKey="state" width={110} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => `${v}%`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Pelancongan" stackId="a" fill="var(--chart-2)" />
                <Bar dataKey="Penggunaan Air" stackId="a" fill="var(--chart-1)" />
                <Bar dataKey="Tekanan Marin" stackId="a" fill="var(--chart-3)" />
                <Bar dataKey="Hujan" stackId="a" fill="var(--chart-4)" />
                <Bar dataKey="Hutan Simpan" stackId="a" fill="var(--chart-5)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Matriks Pemantauan 13 Negeri & Cadangan Polisi Intervensi AI"
          subtitle="Diselaraskan dengan RMK-13 & UN SEEA"
          tag={`${filteredRecords.length} negeri dipaparkan`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="bg-muted/60 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 text-left">Kedudukan / Negeri</th>
                  <th className="px-3 py-3 text-center">Pelancong (Juta)</th>
                  <th className="px-3 py-3 text-center">Air (Juta m³)</th>
                  <th className="px-3 py-3 text-center">Intensiti Air</th>
                  <th className="px-3 py-3 text-center">Skor TEPI</th>
                  <th className="px-3 py-3 text-center">Status Risiko</th>
                  <th className="px-4 py-3 text-left">Cadangan Intervensi Polisi (AI)</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, idx) => {
                  const simTepi = simulateTepi(r.tepi, growth);
                  const tone = toneOf(simTepi);
                  return (
                    <tr key={r.state} className="border-t border-border align-top hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <span className="mr-2 rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold">{r.state}</span>
                      </td>
                      <td className="px-3 py-3 text-center font-semibold">
                        {(r.tourists * (1 + growth)).toFixed(1)} M
                      </td>
                      <td className="px-3 py-3 text-center text-muted-foreground">
                        {r.water.toLocaleString("ms-MY")}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-primary">
                        {r.waterIntensity.toFixed(2)} m³
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className="inline-block rounded-md px-2.5 py-1 text-xs font-bold text-primary-foreground"
                          style={{ backgroundColor: riskVar(tone) }}
                        >
                          {simTepi.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs font-bold" style={{ color: riskVar(tone) }}>
                          {r.riskCategory}
                        </span>
                      </td>
                      <td className="max-w-[22rem] px-4 py-3 text-xs text-muted-foreground">
                        <Bot className="mr-1 inline size-3.5 text-primary" />
                        {r.recommendation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Waves, t: "Kualiti Air Marin", d: "Tekanan marin dikira sebagai 100 − MWQI, dinormal Min-Max." },
            { icon: CloudRain, t: "Iklim", d: "Taburan hujan tahunan (mm) sebagai proksi bekalan air semula jadi." },
            { icon: TreePine, t: "Hutan Simpan Kekal", d: "Keluasan (ribu hektar) sebagai penampan ekologi negeri." },
          ].map((x) => (
            <div key={x.t} className="surface-card flex items-start gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                <x.icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">{x.t}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{x.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          {(["critical", "high", "moderate", "low"] as const).map((tone, i) => (
            <Badge
              key={tone}
              variant="outline"
              className="gap-2 border-border text-xs font-semibold text-muted-foreground"
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: riskVar(tone) }} />
              {["Sangat Kritikal (≥75)", "Tinggi (60–74)", "Sederhana (40–59)", "Rendah / Mampan (<40)"][i]}
            </Badge>
          ))}
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <p className="mx-auto max-w-7xl px-5 py-5 text-center text-xs text-muted-foreground">
          © 2026 AgriStatX • Dibangunkan untuk DOSM Datathon 2026 • Sumber: Penerbitan Kompendium Perangkaan Alam Sekitar (KPAS) dan <em>Domestic Tourism Survey (DTS)</em>.
        </p>
      </footer>
    </div>
  );
}
