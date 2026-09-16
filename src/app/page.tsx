import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Cpu,
  GitFork,
  Play,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 border-b border-slate-800/60 bg-radial-at-t from-blue-950/30 via-transparent to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/50 text-xs font-medium text-blue-300 mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>100% In-Browser Zero-Latency Execution</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Master Data Structures &amp; Algorithms with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
              Zero-Lag In-Browser Execution
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate server waiting times. Run test suites locally in sub-200ms with isolated Web Workers,
            unlock structured DAG skill trees, and receive Socratic AI guidance.
          </p>

          {/* CTA Group */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/problems"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start Practicing</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/skills"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-medium text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <GitFork className="w-4 h-4 text-emerald-400" />
              <span>Explore Skill Tree</span>
            </Link>
          </div>

          {/* Interactive Code Preview Card */}
          <div className="mt-16 max-w-3xl mx-auto rounded-xl border border-slate-800 bg-slate-950/90 shadow-2xl overflow-hidden text-left font-mono text-xs sm:text-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-slate-400 font-sans text-xs">twoSum.js &mdash; Worker Sandbox</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-sans text-xs font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>3/3 Passed (4ms)</span>
              </div>
            </div>
            <div className="p-4 sm:p-6 text-slate-300 space-y-1 overflow-x-auto leading-relaxed">
              <div><span className="text-purple-400">function</span> <span className="text-blue-400">twoSum</span>(nums, target) &#123;</div>
              <div className="pl-4 text-slate-500">// O(N) single-pass hash map resolution</div>
              <div className="pl-4"><span className="text-purple-400">const</span> map = <span className="text-purple-400">new</span> <span className="text-amber-300">Map</span>();</div>
              <div className="pl-4"><span className="text-purple-400">for</span> (<span className="text-purple-400">let</span> i = 0; i &lt; nums.length; i++) &#123;</div>
              <div className="pl-8"><span className="text-purple-400">const</span> complement = target - nums[i];</div>
              <div className="pl-8"><span className="text-purple-400">if</span> (map.<span className="text-blue-300">has</span>(complement)) &#123;</div>
              <div className="pl-12"><span className="text-purple-400">return</span> [map.<span className="text-blue-300">get</span>(complement), i];</div>
              <div className="pl-8">&#125;</div>
              <div className="pl-8">map.<span className="text-blue-300">set</span>(nums[i], i);</div>
              <div className="pl-4">&#125;</div>
              <div className="pl-4"><span className="text-purple-400">return</span> [];</div>
              <div>&#125;</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Feature Grid */}
      <section className="py-20 bg-[#090d16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Engineered for Frictionless Mastery
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Dev Arena replaces slow backend compilation queues with client-side Web Worker sandboxes
              and intelligent pedagogical tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1: Browser Runner */}
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Browser Runner</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Run JavaScript algorithms in an isolated Web Worker sandbox with sub-200ms latency.
                Built-in 2000ms infinite-loop safety cutoffs and console interception protect your browser.
              </p>
            </div>

            {/* Feature 2: Socratic AI Tutor */}
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Socratic AI Tutor</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Receive progressive guidance without giving away answers. The AI analyzes your AST and
                asks thought-provoking questions to spark your own algorithmic breakthroughs.
              </p>
            </div>

            {/* Feature 3: DAG Skill Tree */}
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <GitFork className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">DAG Skill Tree</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Progress through a directed acyclic graph curriculum. Unlock advanced topics like
                Sliding Window and Dynamic Programming only after solidifying core prerequisites.
              </p>
            </div>

            {/* Feature 4: Arena & Contests */}
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Contests &amp; Big-O Profiling</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Measure multi-N empirical execution times to chart actual growth curves, compete
                in timed community contests, and watch your Elo rating climb.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 border-t border-slate-800 bg-[#070a11]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to sharpen your problem solving?</h2>
          <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">
            Choose from curated foundational challenges and start running code in seconds.
          </p>
          <div className="mt-8">
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Practicing Now</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
