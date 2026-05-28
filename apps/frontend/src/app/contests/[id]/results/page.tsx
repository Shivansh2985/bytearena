"use client";

import React, { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { apiFetch } from "@/lib/api";
import Image from "next/image";

interface ParticipantResult {
  id: string;
  userId: string;
  rank: number;
  score: number;
  user: {
    name: string;
    username: string;
    rating: number;
    avatar: string;
  };
  ratingChange: number;
  newRating: number;
}

export default function ContestResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [results, setResults] = useState<ParticipantResult[]>([]);
  const [contestTitle, setContestTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/contests/${id}/results?page=${page}&limit=50`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to fetch results");
        }
        const data = await res.json();
        setResults(data.data);
        setContestTitle(data.contestTitle);
        setTotalPages(data.totalPages || 1);

        // Check if current user is in Top 3 (on first page)
        if (page === 1 && session?.user?.id) {
          const myResult = data.data.find((r: ParticipantResult) => r.userId === session.user.id);
          if (myResult && myResult.rank <= 3) {
            triggerCelebration();
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id, page, session]);

  const triggerCelebration = () => {
    // Play sound
    try {
      const audio = new Audio("https://cdn.pixabay.com/download/audio/2022/11/22/audio_73f08535a2.mp3?filename=clapping-and-cheering-136531.mp3");
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio autoplay blocked', e));
    } catch (e) {}

    // Confetti cannons
    const duration = 5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#818cf8', '#c084fc', '#f472b6']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#818cf8', '#c084fc', '#f472b6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center">
        <Trophy className="h-24 w-24 text-slate-700 mb-6" />
        <h1 className="text-3xl font-bold text-slate-300 mb-2">Results Unavailable</h1>
        <p className="text-slate-500 max-w-md">{error}</p>
        <Link href="/my-contests" className="mt-8 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all">
          Go Back
        </Link>
      </div>
    );
  }

  // Separate top 3 from the rest (only on page 1)
  const top3 = page === 1 ? results.slice(0, 3) : [];
  const rest = page === 1 ? results.slice(3) : results;

  const getPodiumStyles = (rank: number) => {
    switch (rank) {
      case 1: return { height: "h-48", bg: "bg-gradient-to-t from-yellow-500/20 to-yellow-300/10", border: "border-yellow-400", shadow: "shadow-yellow-500/50", color: "text-yellow-400", delay: 0.2 };
      case 2: return { height: "h-36", bg: "bg-gradient-to-t from-slate-400/20 to-slate-300/10", border: "border-slate-300", shadow: "shadow-slate-400/50", color: "text-slate-300", delay: 0.4 };
      case 3: return { height: "h-28", bg: "bg-gradient-to-t from-orange-600/20 to-orange-400/10", border: "border-orange-500", shadow: "shadow-orange-600/50", color: "text-orange-500", delay: 0.6 };
      default: return { height: "h-0", bg: "", border: "", shadow: "", color: "", delay: 0 };
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-300 pb-20 pt-28 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/my-contests" className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              {contestTitle} Results
            </h1>
            <p className="mt-2 text-slate-400">Final Leaderboard & Rating Adjustments</p>
          </div>
        </div>

        {/* Podium (Only visible on page 1 if we have at least 1 participant) */}
        {page === 1 && top3.length > 0 && (
          <div className="flex justify-center items-end gap-2 md:gap-6 pt-16 pb-12">
            {[2, 1, 3].map((rankPos) => {
              const participant = top3[rankPos - 1];
              if (!participant) return <div key={rankPos} className="w-24 md:w-40" />; // Placeholder if < 3 players
              const styles = getPodiumStyles(rankPos);

              return (
                <motion.div 
                  key={participant.id}
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 100, delay: styles.delay }}
                  className="flex flex-col items-center relative"
                >
                  {/* Floating Avatar & Name */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: styles.delay }}
                    className="flex flex-col items-center mb-6"
                  >
                    {rankPos === 1 && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1, type: "spring" }}
                        className="absolute -top-12 z-20"
                      >
                        <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                      </motion.div>
                    )}
                    <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-4 ${styles.border} ${styles.shadow} flex items-center justify-center bg-slate-800 overflow-hidden relative z-10`}>
                      {participant.user.avatar.length > 2 ? (
                        <Image src={participant.user.avatar} alt={participant.user.name} fill className="object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-slate-300">{participant.user.avatar}</span>
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <p className={`font-bold text-lg md:text-xl truncate w-24 md:w-32 ${styles.color}`}>{participant.user.name}</p>
                      <p className="text-slate-400 text-sm font-mono">{participant.score} pts</p>
                    </div>
                  </motion.div>

                  {/* Podium Block */}
                  <div className={`w-24 md:w-40 ${styles.height} ${styles.bg} border-t-4 border-l border-r ${styles.border} rounded-t-lg flex justify-center pt-4 backdrop-blur-md relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50" />
                    <span className={`text-4xl md:text-6xl font-black ${styles.color} opacity-80`}>
                      {rankPos}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Data Table */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700/50 text-slate-400 text-sm font-semibold uppercase tracking-wider">
                  <th className="p-4 pl-8 text-center w-24">Rank</th>
                  <th className="p-4">Participant</th>
                  <th className="p-4 text-right">Score</th>
                  <th className="p-4 text-right">Rating Change</th>
                  <th className="p-4 pr-8 text-right">New Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {rest.map((participant) => {
                  const isPositive = participant.ratingChange > 0;
                  const isNegative = participant.ratingChange < 0;
                  const isMe = session?.user?.id === participant.userId;
                  
                  return (
                    <tr 
                      key={participant.id} 
                      className={`hover:bg-slate-700/20 transition-colors ${isMe ? 'bg-indigo-500/10' : ''}`}
                    >
                      <td className="p-4 pl-8 text-center">
                        <span className="font-bold text-slate-400">#{participant.rank}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mr-4 shrink-0 overflow-hidden relative">
                            {participant.user.avatar.length > 2 ? (
                              <Image src={participant.user.avatar} alt={participant.user.name} fill className="object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-slate-300">{participant.user.avatar}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200 flex items-center gap-2">
                              {participant.user.name}
                              {isMe && <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500 text-white font-bold uppercase tracking-wider">You</span>}
                            </div>
                            <div className="text-xs text-slate-500">@{participant.user.username || 'user'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-indigo-300">{participant.score}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className={`inline-flex items-center font-bold font-mono px-3 py-1 rounded-full text-sm ${
                          isPositive ? 'text-green-400 bg-green-400/10' : 
                          isNegative ? 'text-red-400 bg-red-400/10' : 
                          'text-slate-400 bg-slate-400/10'
                        }`}>
                          {isPositive ? '+' : ''}{participant.ratingChange}
                        </div>
                      </td>
                      <td className="p-4 pr-8 text-right">
                        <div className="flex items-center justify-end font-mono font-bold text-slate-300">
                          <Star className="w-4 h-4 mr-2 text-yellow-500/70" />
                          {participant.newRating}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {rest.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No participants to display.
            </div>
          )}
        </motion.div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-slate-400 font-medium bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">Page {page} of {totalPages}</span>
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
