import { useState } from "react";
import { Copy, Check, ExternalLink, Play, Film, Tv, Heart, Search, Zap, Shield } from "lucide-react";

const CATEGORIES = [
  {
    label: "Movies",
    items: ["Movies", "HD Movies", "Movies DVDR", "3D", "Movie clips", "Music videos"],
    icon: <Film className="w-5 h-5" />,
    color: "from-orange-500/20 to-amber-500/10",
    accent: "text-orange-400",
    border: "border-orange-500/20",
  },
  {
    label: "TV Shows",
    items: ["TV shows", "HD TV shows"],
    icon: <Tv className="w-5 h-5" />,
    color: "from-blue-500/20 to-cyan-500/10",
    accent: "text-blue-400",
    border: "border-blue-500/20",
  },
  {
    label: "Adult",
    items: ["Porn", "Porn HD", "Porn Movies", "Porn DVD", "Gay Porn", "Porn recent"],
    icon: <Heart className="w-5 h-5" />,
    color: "from-pink-500/20 to-rose-500/10",
    accent: "text-pink-400",
    border: "border-pink-500/20",
  },
];

const FEATURES = [
  {
    icon: <Search className="w-5 h-5" />,
    title: "Full-text search",
    desc: "Search any keyword across all categories, including adult content.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Fast apibay.org API",
    desc: "Queries TPB's official REST API with retry logic and exponential back-off.",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Robust error handling",
    desc: "Silent failures eliminated – streams return properly shaped Stremio responses.",
  },
  {
    icon: <Play className="w-5 h-5" />,
    title: "Magnet + file index",
    desc: "Episode & file-level streaming for multi-file torrents (series / adult episodes).",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="ml-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors shrink-0"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-300" />}
    </button>
  );
}

export default function Home() {
  const manifestUrl = `${window.location.origin}/stremio/manifest.json`;

  return (
    <div className="min-h-screen bg-[hsl(220,15%,8%)] text-gray-100 font-sans">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-16 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Play className="w-5 h-5 fill-white text-white" />
            </div>
            <span className="text-sm font-semibold text-orange-400 tracking-wide uppercase">Stremio Addon</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            ThePirateBay Catalog
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mb-8">
            Browse, search, and stream torrents from The Pirate Bay directly in Stremio — including
            movies, TV shows, and adult content (incl. gay porn).
          </p>

          {/* Install URL */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Manifest URL — paste into Stremio
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-orange-300 font-mono break-all">{manifestUrl}</code>
              <CopyButton text={manifestUrl} />
            </div>
            <a
              href={`stremio://${manifestUrl.replace(/^https?:\/\//, "")}`}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-colors shadow-lg shadow-orange-500/20"
            >
              <Play className="w-4 h-4 fill-white" />
              Open in Stremio
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Features */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6">What's fixed &amp; new</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="rounded-xl border border-white/8 bg-white/4 p-5 flex gap-4"
              >
                <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-400 shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm mb-0.5">{f.title}</p>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6">Available categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CATEGORIES.map(cat => (
              <div
                key={cat.label}
                className={`rounded-xl border ${cat.border} bg-gradient-to-b ${cat.color} p-5`}
              >
                <div className={`flex items-center gap-2 mb-3 ${cat.accent}`}>
                  {cat.icon}
                  <span className="font-semibold">{cat.label}</span>
                </div>
                <ul className="space-y-1">
                  {cat.items.map(i => (
                    <li key={i} className="text-sm text-gray-400 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-600 shrink-0" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* How to install */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6">How to install</h2>
          <ol className="space-y-4">
            {[
              { n: "1", t: "Open Stremio", d: "Launch the Stremio app on your device (desktop or web)." },
              { n: "2", t: "Go to Addons", d: "Click the puzzle icon in the top-right corner to open the Addon manager." },
              { n: "3", t: "Add by URL", d: "Click 'Community addons' → 'Install from URL' and paste the manifest URL above." },
              { n: "4", t: "Install", d: "Hit Install. The addon appears immediately in your catalog list." },
            ].map(step => (
              <li key={step.n} className="flex gap-4 items-start">
                <span className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                  {step.n}
                </span>
                <div>
                  <p className="font-semibold text-white text-sm">{step.t}</p>
                  <p className="text-sm text-gray-500">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Disclaimer */}
        <section className="rounded-xl border border-white/8 bg-white/3 p-5 text-sm text-gray-500">
          <p className="font-semibold text-gray-400 mb-1">Disclaimer</p>
          <p>
            This addon indexes publicly available torrent metadata from The Pirate Bay. It does not
            host or distribute any copyrighted content. Use in compliance with the laws of your
            jurisdiction. Adult content is only accessible to users who choose to use the adult
            catalogs.
          </p>
        </section>
      </main>
    </div>
  );
}
