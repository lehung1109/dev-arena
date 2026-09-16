import type { Metadata } from "next";
import Link from "next/link";
import { Code2, Flame, Trophy, GitFork, Bot, Terminal } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dev Arena | Zero-Lag In-Browser Algorithm Platform",
  description:
    "Master Data Structures & Algorithms with zero-lag in-browser execution, Socratic AI coaching, and empirical Big-O profiling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen flex flex-col selection:bg-blue-600 selection:text-white">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand Logo */}
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-white hover:opacity-90 transition-opacity"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Code2 className="w-5 h-5" />
                </div>
                <span>Dev Arena</span>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/problems"
                  className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-md transition-colors"
                >
                  Problems
                </Link>
                <Link
                  href="/skills"
                  className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <GitFork className="w-4 h-4 text-emerald-400" />
                  <span>Skill Tree</span>
                </Link>
                <Link
                  href="/contests"
                  className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Contests</span>
                </Link>
                <Link
                  href="/interview"
                  className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span>AI Interview</span>
                </Link>
              </nav>
            </div>

            {/* Quick Status / Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="font-semibold text-orange-300">0</span> Day Streak
              </div>
              <Link
                href="/profile/coder_99"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-blue-500/50 hover:bg-slate-850 transition-colors"
                title="View Profile & Rating"
              >
                <span className="text-blue-400 font-semibold">1200</span> Rating
              </Link>
              <Link
                href="/problems"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-md shadow-blue-600/20"
              >
                <Terminal className="w-4 h-4" />
                <span>Open Arena</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-[#070a11] py-8 text-slate-400 text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-slate-300">Dev Arena</span>
              <span>&copy; {new Date().getFullYear()} &mdash; Zero-Lag In-Browser Algorithm Sandbox.</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-400">
              <Link href="/problems" className="hover:text-slate-200 transition-colors">
                Catalog
              </Link>
              <Link href="/skills" className="hover:text-slate-200 transition-colors">
                Curriculum
              </Link>
              <Link href="/contests" className="hover:text-slate-200 transition-colors">
                Rankings
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
