import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Droplets, Leaf, Mountain, Sprout, Waves } from "lucide-react";

const components = [
  {
    icon: Mountain,
    title: "Pelancongan",
    weight: "30%",
    description: "Mengukur kepadatan dan ketibaan pelancong sebagai tekanan terhadap kapasiti alam sekitar negeri.",
  },
  {
    icon: Droplets,
    title: "Penggunaan Air",
    weight: "25%",
    description: "Menggambarkan isipadu air bersih yang diperlukan untuk menyokong aktiviti pelancongan.",
  },
  {
    icon: Waves,
    title: "Tekanan Marin",
    weight: "20%",
    description: "Dikira daripada skor kualiti air marin (MWQI); skor MWQI yang lebih rendah bermaksud tekanan lebih tinggi.",
  },
  {
    icon: Sprout,
    title: "Iklim",
    weight: "15%",
    description: "Menggunakan taburan hujan tahunan sebagai proksi bekalan air semula jadi negeri.",
  },
  {
    icon: Leaf,
    title: "Hutan Simpan",
    weight: "10%",
    description: "Mengambil kira keluasan hutan simpan kekal sebagai penampan dan aset ekologi.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Apa Itu TEPI | AgriStatX" },
      {
        name: "description",
        content: "Penerangan Indeks Tekanan Ekopelancongan dan komponen pengiraannya.",
      },
    ],
  }),
  component: TepiPage,
});

function TepiPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="gradient-dosm text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-primary-foreground/15">
              <Leaf className="size-5" />
            </span>
            <span className="font-display text-lg font-extrabold sm:text-xl">AgriStatX TourismEcoAI</span>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/30 px-3 py-1.5 text-sm font-semibold hover:bg-primary-foreground/10"
          >
            Buka Dashboard
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        <section className="relative overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-card)]">
          <img
            src="https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1800&q=85"
            alt="Hutan tropika Malaysia"
            className="absolute inset-0 size-full object-cover opacity-45"
          />
          <div className="relative max-w-2xl px-6 py-16 sm:px-10 sm:py-24">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Indeks bersepadu DOSM</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-6xl">Apa Itu TEPI?</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-primary-foreground/85 sm:text-lg">
              TEPI ialah Tourism Eco-Pressure Index yang membantu melihat hubungan antara pertumbuhan pelancongan dan tekanan terhadap sumber alam sekitar di setiap negeri Malaysia.
            </p>
          </div>
        </section>

        <section className="grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Tujuan indeks</p>
            <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Satu skor untuk membaca tekanan alam sekitar</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Skor TEPI dinormalisasikan kepada skala 0 hingga 100. Skor yang lebih tinggi menunjukkan tekanan relatif yang lebih tinggi, manakala skor yang lebih rendah menunjukkan keadaan yang lebih mampan berdasarkan data yang tersedia.
            </p>
          </div>
          <div className="border-l-2 border-accent pl-5">
            <p className="font-display text-4xl font-extrabold text-primary">0–100</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Skala skor komposit bagi perbandingan antara negeri.</p>
          </div>
        </section>

        <section className="border-t border-border pt-10">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Kaedah pengiraan</p>
            <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Lima komponen membentuk skor TEPI</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {components.map(({ icon: Icon, title, weight, description }) => (
              <article key={title} className="surface-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-display text-lg font-extrabold text-primary">{weight}</span>
                </div>
                <h3 className="mt-5 font-display text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">Terokai skor dan cadangan intervensi bagi setiap negeri.</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Lihat dashboard
            <ArrowRight className="size-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
