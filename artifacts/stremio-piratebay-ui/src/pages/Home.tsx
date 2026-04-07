import { useState } from "react";
import { Copy, Check, ExternalLink, Play, Film, Tv, Heart, Search, Zap, Shield, List, Layers } from "lucide-react";

const ADDONS = [
  {
    id: "catalog",
    path: "/stremio/manifest.json",
    badge: "Catalog Addon",
    name: "ThePirateBay Catalog",
    tagline: "Browse & search TPB by category. Discover new content directly inside Stremio.",
    accentFrom: "from-orange-500/20",
    accentTo: "to-amber-500/10",
    accentBorder: "border-orange-500/30",
    accentText: "text-orange-400",
    accentBg: "bg-orange-500",
    accentBgLight: "bg-orange-500/15",
    accentShadow: "shadow-orange-500/20",
    icon: <List className="w-5 h-5 fill-white text-white" />,
    features: [
      { icon: <Search className="w-5 h-5" />, title: "Category browsing", desc: "Browse Movies, TV, Adult and sub-categories like Gay Porn, Porn HD directly in Stremio." },
      { icon: <Zap className="w-5 h-5" />, title: "apibay.org API", desc: "Uses TPB's official REST API with retry logic and back-off — no HTML scraping." },
      { icon: <Shield className="w-5 h-5" />, title: "Full-text search", desc: "Search any keyword across movies, TV shows and all adult categories." },
      { icon: <Film className="w-5 h-5" />, title: "Multi-file torrents", desc: "Episode and file-level streaming for multi-file packs." },
    ],
    categories: [
      {
        label: "Movies",
        items: ["Movies", "HD Movies", "Movies DVDR", "3D", "Movie clips", "Music videos"],
        icon: <Film className="w-4 h-4" />,
        color: "from-orange-500/20 to-amber-500/10",
        accent: "text-orange-400",
        border: "border-orange-500/20",
      },
      {
        label: "TV Shows",
        items: ["TV shows", "HD TV shows"],
        icon: <Tv className="w-4 h-4" />,
        color: "from-blue-500/20 to-cyan-500/10",
        accent: "text-blue-400",
        border: "border-blue-500/20",
      },
      {
        label: "Adult",
        items: ["Porn", "Porn HD", "Porn Movies", "Porn DVD", "Gay Porn", "Porn recent"],
        icon: <Heart className="w-4 h-4" />,
        color: "from-pink-500/20 to-rose-500/10",
        accent: "text-pink-400",
        border: "border-pink-500/20",
      },
    ],
  },
  {
    id: "plus",
    path: "/stremio-plus/manifest.json",
    badge: "Stream Addon",
    name: "ThePirateBay+",
    tagline: "IMDB-powered stream provider. Open any movie or TV show from any catalog — get TPB streams.",
    accentFrom: "from-purple-500/20",
    accentTo: "to-indigo-500/10",
    accentBorder: "border-purple-500/30",
    accentText: "text-purple-400",
    accentBg: "bg-purple-600",
    accentBgLight: "bg-purple-500/15",
    accentShadow: "shadow-purple-500/20",
    icon: <Layers className="w-5 h-5 fill-white text-white" />,
    features: [
      { icon: <Play className="w-5 h-5" />, title: "IMDB-based streams", desc: "Search TPB by IMDB ID and title — works with Cinemeta, Trakt, or any catalog addon." },
      { icon: <Tv className="w-5 h-5" />, title: "Smart episode matching", desc: "Resolves multi-episode packs and season bundles to the correct episode file." },
      { icon: <Zap className="w-5 h-5" />, title: "Quality tagging", desc: "Streams are tagged with resolution (1080p, 4K) and source (BluRay, WEB-DL)." },
      { icon: <Shield className="w-5 h-5" />, title: "Rate-limited & cached", desc: "Bottleneck queue prevents overloading TPB. 24-hour stream cache." },
    ],
    categories: [
      {
        label: "Movies",
        items: ["Any IMDB movie", "Searched by title + year", "Top 5 by seeders"],
        icon: <Film className="w-4 h-4" />,
        color: "from-purple-500/20 to-indigo-500/10",
        accent: "text-purple-400",
        border: "border-purple-500/20",
      },
      {
        label: "TV Series",
        items: ["Any IMDB series", "Episode-accurate matching", "Absolute episode support"],
        icon: <Tv className="w-4 h-4" />,
        color: "from-indigo-500/20 to-blue-500/10",
        accent: "text-indigo-400",
        border: "border-indigo-500/20",
      },
    ],
  },
];

function CopyButton({ text, accent }: { text: string; accent?: string }) {
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
      {copied
        ? <Check className={`w-4 h-4 ${accent || "text-green-400"}`} />
        : <Copy className="w-4 h-4 text-gray-300" />}
    </button>
  );
}

function AddonCard({ addon }: { addon: typeof ADDONS[0] }) {
  const manifestUrl = `${window.location.origin}${addon.path}`;

  return (
    <section className={`rounded-2xl border ${addon.accentBorder} bg-gradient-to-b ${addon.accentFrom} ${addon.accentTo} overflow-hidden`}>
      {/* Header */}
      <div className="px-6 pt-7 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-9 h-9 rounded-xl ${addon.accentBg} flex items-center justify-center shadow-lg ${addon.accentShadow}`}>
            {addon.icon}
          </div>
          <span className={`text-xs font-semibold ${addon.accentText} tracking-wide uppercase`}>{addon.badge}</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">{addon.name}</h2>
        <p className="text-sm text-gray-400 max-w-xl">{addon.tagline}</p>
      </div>

      {/* Install */}
      <div className="px-6 py-5 border-b border-white/5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Manifest URL — paste into Stremio
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-black/20 px-3 py-2.5">
          <code className={`flex-1 text-sm ${addon.accentText} font-mono break-all`}>{manifestUrl}</code>
          <CopyButton text={manifestUrl} accent={addon.accentText} />
        </div>
        <div className="flex gap-3 mt-4 flex-wrap">
          <a
            href={`stremio://${manifestUrl.replace(/^https?:\/\//, "")}`}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${addon.accentBg} hover:opacity-90 text-white text-sm font-semibold transition-opacity shadow-lg ${addon.accentShadow}`}
          >
            <Play className="w-4 h-4 fill-white" />
            Open in Stremio
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
          <a
            href={manifestUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
          >
            View manifest
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-5 border-b border-white/5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Features</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addon.features.map(f => (
            <div key={f.title} className="rounded-xl border border-white/8 bg-white/3 p-4 flex gap-3">
              <div className={`w-8 h-8 rounded-lg ${addon.accentBgLight} flex items-center justify-center ${addon.accentText} shrink-0`}>
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-white text-sm mb-0.5">{f.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 py-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">What it covers</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {addon.categories.map(cat => (
            <div key={cat.label} className={`rounded-xl border ${cat.border} bg-gradient-to-b ${cat.color} p-4`}>
              <div className={`flex items-center gap-2 mb-2 ${cat.accent}`}>
                {cat.icon}
                <span className="font-semibold text-sm">{cat.label}</span>
              </div>
              <ul className="space-y-1">
                {cat.items.map(i => (
                  <li key={i} className="text-xs text-gray-400 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-gray-600 shrink-0" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[hsl(220,15%,8%)] text-gray-100 font-sans">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/8 via-transparent to-purple-600/5 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 py-14 relative">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Play className="w-5 h-5 fill-white text-white" />
            </div>
            <span className="text-sm font-semibold text-orange-400 tracking-wide uppercase">Stremio Addons</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            ThePirateBay for Stremio
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mb-6">
            Two complementary addons — install both for the full experience. Browse TPB by category
            with the <span className="text-orange-400 font-medium">Catalog Addon</span>, and stream
            any IMDB title via TPB with the <span className="text-purple-400 font-medium">TPB+ Stream Addon</span>.
          </p>

          {/* How to install */}
          <div className="rounded-xl border border-white/8 bg-white/4 p-5">
            <p className="text-sm font-semibold text-white mb-3">How to install</p>
            <ol className="space-y-2">
              {[
                "Open Stremio → click the puzzle icon (Addons)",
                "Choose 'Community addons' → 'Install from URL'",
                "Paste each manifest URL below and click Install",
                "Both addons appear in your catalog & stream list immediately",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 items-start text-sm text-gray-400">
                  <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </header>

      {/* Addon cards */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {ADDONS.map(addon => (
          <AddonCard key={addon.id} addon={addon} />
        ))}

        {/* Disclaimer */}
        <div className="rounded-xl border border-white/8 bg-white/3 p-5 text-sm text-gray-500">
          <p className="font-semibold text-gray-400 mb-1">Disclaimer</p>
          <p>
            These addons index publicly available torrent metadata from The Pirate Bay. They do not
            host or distribute any copyrighted content. Use in compliance with the laws of your
            jurisdiction. Adult content is only accessible to users who choose to enable adult catalogs.
          </p>
        </div>
      </main>
    </div>
  );
}
