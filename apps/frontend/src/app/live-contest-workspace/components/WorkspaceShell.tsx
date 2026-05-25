'use client';
import { apiFetch } from '@/lib/api';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ContestTopBar from './ContestTopBar';
import ProblemPanel from './ProblemPanel';
import CodeEditorPanel from './CodeEditorPanel';
import OutputPanel from './OutputPanel';
import ProctoringOverlay from './ProctoringOverlay';
import ToastProvider from '@/components/ui/Toast';
import { io, Socket } from 'socket.io-client';
import { Room } from 'livekit-client';
import { useSession } from 'next-auth/react';

export type ProblemStatus = 'unattempted' | 'attempted' | 'answered';

export interface Problem {
  id: string;
  index: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  status: ProblemStatus;
  timeLimit: string;
  memoryLimit: string;
  tags: string[];
  statement: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation?: string }>;
}

export type Language = 'cpp' | 'python' | 'java' | 'javascript';

export interface RunResult {
  status: 'running' | 'accepted' | 'wrong_answer' | 'tle' | 'runtime_error' | 'compile_error' | null;
  output: string;
  expectedOutput?: string;
  time?: string;
  memory?: string;
  testcase?: string;
  error?: string;
  testcaseResults?: Array<{
    input: string;
    expectedOutput: string;
    output: string;
    passed: boolean;
  }>;
}

const problems: Problem[] = [
  {
    id: 'prob-1',
    index: 1,
    title: 'Minimum Spanning Tree Weight',
    difficulty: 'Easy',
    points: 300,
    status: 'answered',
    timeLimit: '1s',
    memoryLimit: '256MB',
    tags: ['Graphs', 'Kruskal', 'Union-Find'],
    statement: `Given an undirected weighted graph with **N** nodes and **M** edges, find the **minimum spanning tree weight**.

A spanning tree is a subset of edges that connects all nodes without any cycle. The minimum spanning tree minimizes the total edge weight.

**Input Format:**
- First line: Two integers N and M (number of nodes and edges)
- Next M lines: Three integers u, v, w representing edge between node u and v with weight w

**Output Format:**
Print the total weight of the minimum spanning tree. If the graph is disconnected, print -1.`,
    constraints: [
      '2 ≤ N ≤ 10^5',
      '1 ≤ M ≤ 2×10^5',
      '1 ≤ w ≤ 10^9',
      'Nodes are 1-indexed',
    ],
    examples: [
      {
        input: '4 5\n1 2 1\n1 3 3\n2 3 1\n2 4 4\n3 4 2',
        output: '4',
        explanation: 'MST edges: (1,2,1), (2,3,1), (3,4,2). Total weight = 4.',
      },
      {
        input: '3 2\n1 2 5\n2 3 3',
        output: '8',
        explanation: 'Only one spanning tree exists with weight 5+3=8.',
      },
    ],
  },
  {
    id: 'prob-2',
    index: 2,
    title: 'Longest Palindromic Subsequence',
    difficulty: 'Medium',
    points: 600,
    status: 'attempted',
    timeLimit: '2s',
    memoryLimit: '256MB',
    tags: ['DP', 'Strings'],
    statement: `Given a string **S** of length **N**, find the length of the **longest palindromic subsequence**.

A subsequence is derived by deleting some characters without changing the relative order. A palindrome reads the same forwards and backwards.

**Input Format:**
- Single line containing string S consisting of lowercase English letters.

**Output Format:**
Print the length of the longest palindromic subsequence.`,
    constraints: [
      '1 ≤ N ≤ 1000',
      'S consists of lowercase English letters only',
    ],
    examples: [
      {
        input: 'bbbab',
        output: '4',
        explanation: 'The longest palindromic subsequence is "bbbb" with length 4.',
      },
      {
        input: 'cbbd',
        output: '2',
        explanation: '"bb" is the longest palindromic subsequence.',
      },
    ],
  },
  {
    id: 'prob-3',
    index: 3,
    title: 'K-th Largest XOR Subarray',
    difficulty: 'Hard',
    points: 1000,
    status: 'unattempted',
    timeLimit: '2s',
    memoryLimit: '512MB',
    tags: ['Trie', 'Bit Manipulation', 'Divide & Conquer'],
    statement: `Given an array **A** of **N** integers and an integer **K**, find the **K-th largest XOR value** among all subarrays.

The XOR of a subarray A[l..r] is defined as A[l] XOR A[l+1] XOR ... XOR A[r].

**Input Format:**
- First line: Two integers N and K
- Second line: N space-separated integers

**Output Format:**
Print the K-th largest XOR value of any subarray.`,
    constraints: [
      '1 ≤ N ≤ 10^5',
      '1 ≤ K ≤ N×(N+1)/2',
      '0 ≤ A[i] ≤ 10^9',
    ],
    examples: [
      {
        input: '4 2\n1 2 3 4',
        output: '6',
        explanation: 'All XOR values sorted descending: 7, 6, 5, 4, 3, 2, 1, 0. 2nd largest is 6.',
      },
    ],
  },
  {
    id: 'prob-4',
    index: 4,
    title: 'Euler Tour on Tree',
    difficulty: 'Medium',
    points: 700,
    status: 'unattempted',
    timeLimit: '1.5s',
    memoryLimit: '256MB',
    tags: ['Trees', 'DFS', 'Sparse Table'],
    statement: `Given a rooted tree with **N** nodes and **Q** queries, for each query (u, v) find the **LCA (Lowest Common Ancestor)** of nodes u and v.

**Input Format:**
- First line: N and Q
- Next N-1 lines: edges (u, v)
- Root is node 1
- Next Q lines: query pairs (u, v)

**Output Format:**
For each query, print the LCA on a new line.`,
    constraints: [
      '2 ≤ N ≤ 5×10^5',
      '1 ≤ Q ≤ 5×10^5',
    ],
    examples: [
      {
        input: '6 3\n1 2\n1 3\n2 4\n2 5\n3 6\n4 5\n4 6\n3 6',
        output: '2\n1\n3',
      },
    ],
  },
  {
    id: 'prob-5',
    index: 5,
    title: 'Convex Hull Trick DP',
    difficulty: 'Hard',
    points: 1200,
    status: 'unattempted',
    timeLimit: '3s',
    memoryLimit: '512MB',
    tags: ['DP Optimization', 'Convex Hull', 'Li Chao Tree'],
    statement: `You are given **N** factories and **M** cities. Each factory i has production cost P[i] and each city j has demand D[j]. You need to assign exactly one factory to each city to minimize total cost.

The cost of assigning factory i to city j is: P[i] × D[j] + transport[i][j]

Find the minimum total assignment cost.`,
    constraints: [
      '1 ≤ N, M ≤ 3000',
      '1 ≤ P[i], D[j] ≤ 10^6',
    ],
    examples: [
      {
        input: '2 2\n3 5\n4 2\n1 3\n2 1',
        output: '20',
      },
    ],
  },
];

const defaultCode: Record<Language, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    cout << "Hello World" << "\\n";
    // Write your code here
    
    return 0;
}`,
  python: `import sys

def solve():
    print("Hello World")
    # Write your code here
    pass

if __name__ == '__main__':
    solve()`,
  java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        
        System.out.println("Hello World");
        // Write your code here
        
    }
}`,
  javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const lines = [];

rl.on('line', (line) => {
    lines.push(line.trim());
});

rl.on('close', () => {
    console.log("Hello World");
    // Write your code here
    
});`,
};

export default function WorkspaceShell({ contestId }: { contestId?: string }) {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [dynamicProblems, setDynamicProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [contestTitle, setContestTitle] = useState('Practice');
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [isCompleted, setIsCompleted] = useState(false);
  const [contestEndTime, setContestEndTime] = useState<number | null>(null);
  const [contestStartTime, setContestStartTime] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [reviewingSubmission, setReviewingSubmission] = useState<{
    userName: string;
    isCorrect: boolean;
    code: string;
    language: Language;
  } | null>(null);

  // Fetch current user details
  useEffect(() => {
    apiFetch('/api/users/me')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setCurrentUser(data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!contestId) {
      setDynamicProblems(problems);
      setLoading(false);
      return;
    }
    apiFetch(`/api/contests/${contestId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setDynamicProblems(problems);
          setLoading(false);
          return;
        }

        if (data.title) {
          setContestTitle(data.title);
        }

        const now = Date.now();
        const endTime = new Date(data.endTime).getTime();
        const startTime = new Date(data.startTime).getTime();
        
        setContestEndTime(endTime);
        setContestStartTime(startTime);

        const isEnded = data.status === 'completed' || now >= endTime;

        if (isEnded) {
          setIsCompleted(true);
          setPermissionsGranted(true);
        } else if (data.hasEnded) {
          alert("You have already ended or completed this contest.");
          window.location.href = '/user-dashboard';
          return;
        }

        let mapped = problems;
        if (data.questions) {
          mapped = data.questions.map((q: any, i: number) => ({
            id: q.id,
            index: i + 1,
            title: q.title,
            difficulty: q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1).toLowerCase(),
            points: q.points,
            status: 'unattempted',
            timeLimit: '2s',
            memoryLimit: '256MB',
            tags: [],
            statement: q.problemStatement || '',
            constraints: q.constraints ? q.constraints.split('\n') : [],
            examples: q.testCases?.filter((tc: any) => !tc.isHidden).map((tc: any) => ({
              input: tc.input,
              output: tc.expectedOutput,
              explanation: tc.explanation || ''
            })) || [],
            testCases: q.testCases || [],
          }));
          setDynamicProblems(mapped.length > 0 ? mapped : problems);
        } else {
          setDynamicProblems(problems);
        }

        // Handle query parameter for problem select
        if (typeof window !== 'undefined') {
          const queryParams = new URLSearchParams(window.location.search);
          const queryProbId = queryParams.get('problemId');
          if (queryProbId) {
            const list = mapped.length > 0 ? mapped : problems;
            const idx = list.findIndex((p: any) => p.id === queryProbId);
            if (idx !== -1) {
              setCurrentProblem(idx);
            }
          }
        }

        if (isEnded) {
          apiFetch(`/api/submissions?contestId=${contestId}`)
            .then(res => res.json())
            .then(subsList => {
              if (Array.isArray(subsList)) {
                setSubmissions(subsList);

                // Handle query parameter for viewing submission code
                if (typeof window !== 'undefined') {
                  const queryParams = new URLSearchParams(window.location.search);
                  const viewSubId = queryParams.get('viewSubmissionId');
                  if (viewSubId) {
                    const matchedSub = subsList.find((s: any) => s.id === viewSubId);
                    if (matchedSub) {
                      setReviewingSubmission({
                        userName: matchedSub.user?.name || (matchedSub.user?.firstName ? `${matchedSub.user.firstName} ${matchedSub.user.lastName || ''}` : '') || 'User',
                        isCorrect: matchedSub.status.toLowerCase() === 'accepted',
                        code: matchedSub.code,
                        language: matchedSub.language.toLowerCase() as Language
                      });
                    }
                  }
                }
              }
              setLoading(false);
            })
            .catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setDynamicProblems(problems);
        setLoading(false);
      });
  }, [contestId]);

  const requestPermissions = async () => {
    if (isCompleted) return;
    try {
      await document.documentElement.requestFullscreen();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPermissionsGranted(true);
      setIsFullscreen(true);
      setMediaStream(stream);
      
      // Start taking snapshots
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = setInterval(() => {
        const video = document.createElement('video');
        video.muted = true;
        video.srcObject = stream;
        video.play();
        video.onplaying = () => {
          const canvas = document.createElement('canvas');
          // Scale down the image to a max width of 640px to reduce payload size
          const scale = Math.min(640 / video.videoWidth, 1);
          canvas.width = video.videoWidth * scale;
          canvas.height = video.videoHeight * scale;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Compress JPEG aggressively to prevent upload timeouts (0.4 quality)
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.4);
            apiFetch('/api/proctoring/snapshot', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contestId, imageBase64 })
            }).catch(console.error);
          }
        };
      }, 60 * 1000); // Every 60 seconds

    } catch (err) {
      alert("Camera, Microphone, and Fullscreen permissions are required to start the contest!");
    }
  };

  // LiveKit initialization when stream is requested
  useEffect(() => {
    if (isCompleted || !mediaStream || !currentUser) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';
    const socket = io(socketUrl, {
      auth: { token: accessToken }
    });
    socketRef.current = socket;
    
    let lkRoom: Room | null = null;

    socket.on('connect', () => {
      socket.emit('join-contest', contestId);
    });

    socket.on('stream-request', async () => {
      if (lkRoom) return; // Already connected
      try {
        const res = await apiFetch(`/api/proctoring/token?room=contest-${contestId}`);
        const data = await res.json();
        if (data.token) {
           lkRoom = new Room();
           const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.livekit.cloud';
           await lkRoom.connect(livekitUrl, data.token, { autoSubscribe: false });
           
           // Publish existing tracks from the media stream
           mediaStream.getTracks().forEach(track => {
             lkRoom!.localParticipant.publishTrack(track);
           });
        }
      } catch(e) {
        console.error('LiveKit connection error:', e);
      }
    });

    socket.on('stream-stop', () => {
      if (lkRoom) {
        lkRoom.disconnect();
        lkRoom = null;
      }
    });

    return () => {
      socket.emit('leave-contest', contestId);
      socket.disconnect();
      if (lkRoom) lkRoom.disconnect();
    };
  }, [isCompleted, mediaStream, currentUser, contestId, accessToken]);

  const currentProblemList = dynamicProblems.length > 0 ? dynamicProblems : problems;
  
  const [currentProblem, setCurrentProblem] = useState(0);
  const [language, setLanguage] = useState<Language>('cpp');
  const [code, setCode] = useState<Record<string, Record<Language, string>>>({});

  // Reset reviewing submission when changing problem
  useEffect(() => {
    setReviewingSubmission(null);
  }, [currentProblem]);
  
  useEffect(() => {
    if (currentProblemList.length > 0 && Object.keys(code).length === 0) {
      const init: Record<string, Record<Language, string>> = {};
      const statusInit: Record<string, ProblemStatus> = {};

      currentProblemList.forEach((p) => {
        init[p.id] = { cpp: defaultCode.cpp, python: defaultCode.python, java: defaultCode.java, javascript: defaultCode.javascript };
        statusInit[p.id] = 'unattempted';

        if (isCompleted && currentUser) {
          const userSubs = submissions.filter(s => s.questionId === p.id && s.userId === currentUser.id);
          if (userSubs.length > 0) {
            const latestSub = userSubs[0];
            const subLang = latestSub.language.toLowerCase() as Language;
            if (init[p.id][subLang] !== undefined) {
              init[p.id][subLang] = latestSub.code;
            }
            statusInit[p.id] = latestSub.status.toLowerCase() === 'accepted' ? 'answered' : 'attempted';
          }
        }
      });
      setCode(init);
      setProblemStatuses(statusInit);
    }
  }, [currentProblemList, isCompleted, currentUser, submissions]);

  const [runResult, setRunResult] = useState<RunResult>({ status: null, output: '' });
  const [outputOpen, setOutputOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftWidth, setLeftWidth] = useState(38);
  const [outputHeight, setOutputHeight] = useState(35);
  const [proctoringWarning, setProctoringWarning] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [myRank, setMyRank] = useState(342);
  const [problemStatuses, setProblemStatuses] = useState<Record<string, ProblemStatus>>({});
  const [warningLogs, setWarningLogs] = useState<any[]>([]);

  const isDraggingV = useRef(false);
  const isDraggingH = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const codeMirrorRef = useRef<any>(null);
  const snapshotIntervalRef = useRef<any>(null);

  // Auto-save simulation
  useEffect(() => {
    if (isCompleted) return;
    setSaveStatus('saving');
    const t = setTimeout(() => setSaveStatus('saved'), 1200);
    return () => clearTimeout(t);
  }, [code, isCompleted]);

  const tabSwitchWarningsRef = useRef(0);

  const handleEndContest = useCallback(async (forced = false) => {
    if (!forced && !confirm('Are you sure you want to end the contest? You will not be able to return.')) return;
    if (!contestId) {
      window.location.href = '/user-dashboard';
      return;
    }
    await apiFetch(`/api/contests/${contestId}/end`, { method: 'POST' });
    window.location.href = '/user-dashboard';
  }, [contestId]);

  // Proctoring: simulate focus loss
  useEffect(() => {
    if (isCompleted) return;
    const handleBlur = () => {
      setProctoringWarning(true);
      const newLog = { id: Date.now().toString(), time: new Date().toLocaleTimeString(), type: 'focus_loss', message: 'Tab focus lost — switched to another window', severity: 'high' };
      setWarningLogs(prev => [newLog, ...prev]);
      if (contestId) {
        apiFetch('/api/proctoring/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contestId, eventType: 'blur', description: 'Tab focus lost — switched to another window' })
        }).catch(console.error);
      }

      tabSwitchWarningsRef.current += 1;
      if (tabSwitchWarningsRef.current >= 3) {
         alert("You have switched tabs too many times. Your contest is being automatically submitted.");
         handleEndContest(true);
      } else {
         alert(`WARNING: You are not allowed to switch tabs during a live contest. This is warning ${tabSwitchWarningsRef.current} of 2. You will be removed from the contest on the 3rd offense.`);
      }
    };
    const handleFocus = () => {
      setProctoringWarning(false);
      if (contestId) {
        apiFetch('/api/proctoring/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contestId, eventType: 'focus', description: 'Tab focus regained' })
        }).catch(console.error);
      }
    };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [contestId, isCompleted, handleEndContest]);



  useEffect(() => {
    if (isCompleted || !permissionsGranted) return;
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        alert('You exited fullscreen mode. Your contest has been automatically submitted to prevent cheating.');
        handleEndContest(true);
      } else {
        setIsFullscreen(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isCompleted, permissionsGranted, handleEndContest]);

  const handleMouseMoveH = useCallback((e: MouseEvent) => {
    if (!isDraggingH.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftWidth(Math.max(25, Math.min(55, pct)));
  }, []);

  const handleMouseMoveV = useCallback((e: MouseEvent) => {
    if (!isDraggingV.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const editorAreaTop = rect.top + 56;
    const totalH = rect.height - 56;
    const fromBottom = rect.bottom - e.clientY;
    const pct = (fromBottom / totalH) * 100;
    setOutputHeight(Math.max(15, Math.min(60, pct)));
  }, []);

  useEffect(() => {
    const up = () => { isDraggingH.current = false; isDraggingV.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', handleMouseMoveH);
    window.addEventListener('mousemove', handleMouseMoveV);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveH);
      window.removeEventListener('mousemove', handleMouseMoveV);
      window.removeEventListener('mouseup', up);
    };
  }, [handleMouseMoveH, handleMouseMoveV]);

  const startDragH = () => {
    isDraggingH.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const startDragV = () => {
    isDraggingV.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const pollJob = async (jobId: string, onSuccess: (data: any) => void) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds polling limit
    
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/judge/job/${jobId}`);
        const data = await res.json();
        
        if (data.jobStatus === 'completed') {
          clearInterval(interval);
          onSuccess(data.result);
        } else if (data.jobStatus === 'failed') {
          clearInterval(interval);
          setRunResult({ status: 'runtime_error', output: data.error || 'Job failed' });
        }
        
        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(interval);
          setRunResult({ status: 'runtime_error', output: 'Execution timed out' });
        }
      } catch (err) {
        clearInterval(interval);
        setRunResult({ status: 'runtime_error', output: 'Failed to poll job status' });
      }
    }, 1000);
  };

  const handleRun = async () => {
    setRunResult({ status: 'running', output: 'Queuing job...' });
    setOutputOpen(true);
    const prob = currentProblemList[currentProblem];
    if (!prob) return;

    try {
      const res = await apiFetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code[prob.id]?.[language] || defaultCode[language],
          language,
          problemId: prob.id,
          action: 'run'
        })
      });
      const data = await res.json();
      if (data.jobId) {
        setRunResult({ status: 'running', output: 'Executing code...' });
        pollJob(data.jobId, (result) => setRunResult(result));
      } else {
        setRunResult({ status: 'runtime_error', output: data.error || 'Unknown error' });
      }
    } catch (err) {
      setRunResult({ status: 'runtime_error', output: 'Failed to connect to judge' });
    }
  };

  const handleRunCustom = async (customInput: string) => {
    setRunResult({ status: 'running', output: 'Queuing job...' });
    setOutputOpen(true);
    const prob = currentProblemList[currentProblem];
    if (!prob) return;

    try {
      const res = await apiFetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentCode,
          language,
          problemId: prob.id,
          action: 'run_custom',
          customInput
        })
      });
      const data = await res.json();
      if (data.jobId) {
        setRunResult({ status: 'running', output: 'Executing custom code...' });
        pollJob(data.jobId, (result) => setRunResult(result));
      } else {
        setRunResult({ status: 'runtime_error', output: data.error || 'Unknown error' });
      }
    } catch (err) {
      setRunResult({ status: 'runtime_error', output: 'Failed to connect to judge' });
    }
  };
  
  const handleSubmit = async () => {
    setRunResult({ status: 'running', output: 'Queuing submission...' });
    setOutputOpen(true);
    const prob = currentProblemList[currentProblem];
    if (!prob) return;

    try {
      const res = await apiFetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code[prob.id]?.[language] || defaultCode[language],
          language,
          problemId: prob.id,
          action: 'submit'
        })
      });
      const data = await res.json();
      if (data.jobId) {
        setRunResult({ status: 'running', output: 'Judging submission...' });
        pollJob(data.jobId, (result) => {
          setRunResult(result);
          if (result.status === 'accepted') {
            setProblemStatuses((prev) => ({ ...prev, [prob.id]: 'answered' }));
            
            apiFetch(`/api/contests/${contestId}`)
              .then(res => res.json())
              .then(contestData => {
                if(contestData && contestData.participants) {
                  const myParticipantIndex = contestData.participants.findIndex((p: any) => p.user.id === currentUser?.id);
                  if(myParticipantIndex !== -1) {
                    setMyRank(myParticipantIndex + 1);
                  }
                }
              }).catch(err => console.error(err));
          } else {
            setProblemStatuses((prev) => ({ ...prev, [prob.id]: 'attempted' }));
          }
        });
      } else {
        setRunResult({ status: 'runtime_error', output: data.error || 'Unknown error' });
      }
    } catch (err) {
      setRunResult({ status: 'runtime_error', output: 'Failed to connect to judge' });
    }
  };

  if (loading || Object.keys(code).length === 0) {
    return <div className="h-screen flex items-center justify-center bg-background text-foreground">Loading workspace...</div>;
  }

  if (!permissionsGranted) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <div className="bg-card-elevated border border-border rounded-xl p-8 max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>
          </div>
          <h2 className="text-xl font-bold">Action Required</h2>
          <p className="text-sm text-muted-foreground">To maintain the integrity of this contest, you must allow camera and microphone access. Your session will be proctored.</p>
          <button onClick={requestPermissions} className="btn-primary w-full py-3 rounded-lg font-bold">
            Allow Permissions & Start Contest
          </button>
        </div>
      </div>
    );
  }

  const probId = currentProblemList[currentProblem]?.id;
  const currentCode = probId ? (code[probId]?.[language] || defaultCode[language]) : '';

  const displayLanguage = reviewingSubmission ? reviewingSubmission.language : language;
  const displayCode = reviewingSubmission ? reviewingSubmission.code : currentCode;
  
  const setCurrentCode = (val: string) => {
    if (!probId) return;
    setCode((prev) => ({
      ...prev,
      [probId]: {
        ...(prev[probId] || { cpp: defaultCode.cpp, python: defaultCode.python, java: defaultCode.java, javascript: defaultCode.javascript }),
        [language]: val,
      },
    }));
  };

  // handleEndContest is now defined earlier.

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-background ${isFullscreen ? 'fixed inset-0 z-[100]' : 'h-screen'}`}
    >
      <ToastProvider />

      {/* Proctoring border warning */}
      {proctoringWarning && !isCompleted && <div className="proctor-overlay" aria-hidden="true" />}

      {/* Top bar */}
      <ContestTopBar
        problems={currentProblemList}
        problemStatuses={problemStatuses}
        currentProblem={currentProblem}
        onSelectProblem={setCurrentProblem}
        language={displayLanguage}
        onLanguageChange={setLanguage}
        onRun={handleRun}
        onSubmit={handleSubmit}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        saveStatus={saveStatus}
        myRank={myRank}
        runResult={runResult}
        mediaStream={mediaStream}
        cameraBlocked={cameraBlocked}
        onEndContest={handleEndContest}
        isCompleted={isCompleted}
        contestTitle={contestTitle}
        contestStartTime={contestStartTime}
        contestEndTime={contestEndTime}
      />

      {/* Main workspace */}
      <div className="flex flex-1 min-h-0">
        {/* Problem panel */}
        <div
          className="flex flex-col min-h-0 overflow-hidden"
          style={{ width: `${leftWidth}%` }}
        >
          <ProblemPanel
            problem={currentProblemList[currentProblem]}
            onNext={() => setCurrentProblem((p) => Math.min(currentProblemList.length - 1, p + 1))}
            onPrev={() => setCurrentProblem((p) => Math.max(0, p - 1))}
            totalProblems={currentProblemList.length}
            isCompleted={isCompleted}
            submissions={submissions}
            onViewCode={(code, lang, userName, isCorrect) => {
              setReviewingSubmission({
                userName,
                isCorrect,
                code,
                language: lang as Language
              });
            }}
          />
        </div>

        {/* Horizontal resizer */}
        <div
          className="resizer w-1 flex-shrink-0 cursor-col-resize"
          onMouseDown={startDragH}
          role="separator"
          aria-label="Resize panels"
        />

        {/* Editor + output */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          {/* Code editor */}
          <div
            className="flex-1 min-h-0 overflow-hidden"
            style={outputOpen ? { height: `${100 - outputHeight}%` } : { flex: 1 }}
          >
            <CodeEditorPanel
              code={displayCode}
              onChange={setCurrentCode}
              language={displayLanguage}
              problem={currentProblemList[currentProblem]}
              cameraBlocked={cameraBlocked}
              onToggleCamera={() => setCameraBlocked(!cameraBlocked)}
              isReadOnly={isCompleted || !!reviewingSubmission}
              reviewBanner={reviewingSubmission ? {
                userName: reviewingSubmission.userName,
                isCorrect: reviewingSubmission.isCorrect,
                language: reviewingSubmission.language.toUpperCase(),
                onBackToOwn: () => setReviewingSubmission(null)
              } : null}
            />
          </div>

          {/* Vertical resizer */}
          {outputOpen && (
            <div
              className="resizer-h h-1 flex-shrink-0 cursor-row-resize"
              onMouseDown={startDragV}
              role="separator"
              aria-label="Resize output"
            />
          )}

          {/* Output panel */}
          {outputOpen && (
            <div style={{ height: `${outputHeight}%` }} className="min-h-0 overflow-hidden">
              <OutputPanel
                result={runResult}
                onClose={() => setOutputOpen(false)}
                problem={currentProblemList[currentProblem]}
                onRunCustom={handleRunCustom}
              />
            </div>
          )}

          {/* Output toggle when closed */}
          {!outputOpen && (
            <div className="h-8 border-t border-border bg-secondary/50 flex items-center px-4 gap-3">
              <button
                onClick={() => setOutputOpen(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <span className="text-[10px]">▲</span>
                Output / Test Cases
              </button>
              {runResult.status && runResult.status !== 'running' && (
                <span className={`text-xs font-medium ${runResult.status === 'accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {runResult.status === 'accepted' ? '✓ Accepted' : '✗ ' + runResult.status.replace('_', ' ')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Proctoring overlay component */}
      {!isCompleted && (
        <ProctoringOverlay
          warning={proctoringWarning}
          cameraBlocked={cameraBlocked}
          warningLogs={warningLogs}
        />
      )}
    </div>
  );
}