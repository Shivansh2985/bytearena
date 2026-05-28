"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Calendar, Clock, Trophy, ArrowRight, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Contest {
  id: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "upcoming" | "live" | "completed";
  startTime: number;
  endTime: number;
  participants: number;
  totalQuestions: number;
  myRank: number | null;
  myScore: number | null;
  resultsPublished: boolean;
}

export default function MyContestsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filter, setFilter] = useState<"all" | "upcoming" | "live" | "completed">("all");

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      window.location.href = "/sign-up-login";
    }
  }, [sessionStatus]);

  useEffect(() => {
    const fetchMyContests = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/contests/my-contests?page=${page}&limit=12`);
        if (res.ok) {
          const data = await res.json();
          setContests(data.data);
          setTotalPages(data.totalPages || 1);
        }
      } catch (error) {
        console.error("Error fetching my contests", error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionStatus === "authenticated") {
      fetchMyContests();
    }
  }, [sessionStatus, page]);

  const filteredContests = filter === "all" ? contests : contests.filter((c) => c.status === filter);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "EASY":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "MEDIUM":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "HARD":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "text-red-500 bg-red-500/10 border-red-500/20 animate-pulse";
      case "upcoming":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "completed":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  if (sessionStatus === "loading") return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-300 pb-20 pt-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              My Contests
            </h1>
            <p className="mt-3 text-lg text-slate-400 max-w-2xl">
              Track your history, view live rankings, and analyze your performance across all registered arenas.
            </p>
          </div>
        </div>

        <div className="flex space-x-2 p-1 bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50 w-fit">
          {["all", "upcoming", "live", "completed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filter === tab
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredContests.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-12 text-center">
            <Trophy className="mx-auto h-16 w-16 text-slate-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-200 mb-2">No Contests Found</h3>
            <p className="text-slate-400 mb-6">You haven't participated in any {filter !== 'all' ? filter : ''} contests yet.</p>
            <Link href="/contests" className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all">
              Browse Arenas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContests.map((contest, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={contest.id}
                className="group relative bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="p-6 relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(contest.status)}`}>
                      {contest.status.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(contest.difficulty)}`}>
                      {contest.difficulty}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {contest.title}
                  </h3>
                  
                  <div className="space-y-3 mt-6">
                    <div className="flex items-center text-sm text-slate-400">
                      <Calendar className="w-4 h-4 mr-3 text-slate-500" />
                      {new Date(contest.startTime).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-slate-400">
                      <Clock className="w-4 h-4 mr-3 text-slate-500" />
                      {new Date(contest.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {contest.status === 'completed' && (
                    <div className="mt-6 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Your Rank</p>
                        <p className="text-2xl font-bold text-slate-200">{contest.myRank ? `#${contest.myRank}` : 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Score</p>
                        <p className="text-xl font-bold text-indigo-400">{contest.myScore ?? 0}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    {contest.status === 'live' ? (
                      <Link href={`/live-contest-workspace/${contest.id}`} className="w-full inline-flex justify-center items-center px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 rounded-xl font-medium transition-colors">
                        <Activity className="w-4 h-4 mr-2 animate-pulse" />
                        Enter Arena
                      </Link>
                    ) : contest.status === 'completed' && contest.resultsPublished ? (
                      <Link href={`/contests/${contest.id}/results`} className="w-full inline-flex justify-center items-center px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/50 text-indigo-400 rounded-xl font-medium transition-colors">
                        <Trophy className="w-4 h-4 mr-2" />
                        View Results
                      </Link>
                    ) : contest.status === 'completed' && !contest.resultsPublished ? (
                      <button disabled className="w-full inline-flex justify-center items-center px-4 py-3 bg-slate-800 border border-slate-700 text-slate-500 rounded-xl font-medium cursor-not-allowed">
                        Results Pending
                      </button>
                    ) : (
                      <button disabled className="w-full inline-flex justify-center items-center px-4 py-3 bg-slate-800/50 border border-slate-700 text-slate-400 rounded-xl font-medium cursor-not-allowed">
                        Starts Soon
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-12">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-slate-400 font-medium">Page {page} of {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
