'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ContestTopBar from './ContestTopBar';
import ProblemPanel from './ProblemPanel';
import CodeEditorPanel from './CodeEditorPanel';
import OutputPanel from './OutputPanel';
import ProctoringOverlay from './ProctoringOverlay';
import ToastProvider from '@/components/ui/Toast';

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
    
    int n, m;
    cin >> n >> m;
    
    vector<tuple<int,int,int>> edges(m);
    for (auto& [w, u, v] : edges) {
        cin >> u >> v >> w;
    }
    
    // Sort edges by weight (Kruskal's algorithm)
    sort(edges.begin(), edges.end());
    
    // Union-Find
    vector<int> parent(n + 1), rank_(n + 1, 0);
    iota(parent.begin(), parent.end(), 0);
    
    function<int(int)> find = [&](int x) {
        return parent[x] == x ? x : parent[x] = find(parent[x]);
    };
    
    long long mst = 0;
    int edgesUsed = 0;
    
    for (auto [w, u, v] : edges) {
        int pu = find(u), pv = find(v);
        if (pu != pv) {
            mst += w;
            edgesUsed++;
            if (rank_[pu] < rank_[pv]) swap(pu, pv);
            parent[pv] = pu;
            if (rank_[pu] == rank_[pv]) rank_[pu]++;
        }
    }
    
    cout << (edgesUsed == n - 1 ? mst : -1) << "\\n";
    return 0;
}`,
  python: `import sys
from collections import defaultdict

input = sys.stdin.readline

def find(parent, x):
    if parent[x] != x:
        parent[x] = find(parent, parent[x])
    return parent[x]

def union(parent, rank, x, y):
    px, py = find(parent, x), find(parent, y)
    if px == py:
        return False
    if rank[px] < rank[py]:
        px, py = py, px
    parent[py] = px
    if rank[px] == rank[py]:
        rank[px] += 1
    return True

def solve():
    n, m = map(int, input().split())
    edges = []
    for _ in range(m):
        u, v, w = map(int, input().split())
        edges.append((w, u, v))
    
    edges.sort()
    parent = list(range(n + 1))
    rank = [0] * (n + 1)
    
    mst = 0
    used = 0
    for w, u, v in edges:
        if union(parent, rank, u, v):
            mst += w
            used += 1
    
    print(mst if used == n - 1 else -1)

solve()`,
  java: `import java.util.*;
import java.io.*;

public class Solution {
    static int[] parent, rank;
    
    static int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }
    
    static boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;
        if (rank[px] < rank[py]) { int t = px; px = py; py = t; }
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
        return true;
    }
    
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(st.nextToken());
        int m = Integer.parseInt(st.nextToken());
        
        int[][] edges = new int[m][3];
        for (int i = 0; i < m; i++) {
            st = new StringTokenizer(br.readLine());
            edges[i][0] = Integer.parseInt(st.nextToken());
            edges[i][1] = Integer.parseInt(st.nextToken());
            edges[i][2] = Integer.parseInt(st.nextToken());
        }
        
        Arrays.sort(edges, (a, b) -> a[0] - b[0]);
        parent = new int[n + 1];
        rank = new int[n + 1];
        for (int i = 0; i <= n; i++) parent[i] = i;
        
        long mst = 0;
        int used = 0;
        for (int[] e : edges) {
            if (union(e[1], e[2])) {
                mst += e[0];
                used++;
            }
        }
        System.out.println(used == n - 1 ? mst : -1);
    }
}`,
  javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
    const [n, m] = lines[0].split(' ').map(Number);
    const edges = [];
    for (let i = 1; i <= m; i++) {
        const [u, v, w] = lines[i].split(' ').map(Number);
        edges.push([w, u, v]);
    }
    edges.sort((a, b) => a[0] - b[0]);
    
    const parent = Array.from({length: n+1}, (_, i) => i);
    const rank = new Array(n+1).fill(0);
    
    function find(x) {
        if (parent[x] !== x) parent[x] = find(parent[x]);
        return parent[x];
    }
    
    function union(x, y) {
        let px = find(x), py = find(y);
        if (px === py) return false;
        if (rank[px] < rank[py]) [px, py] = [py, px];
        parent[py] = px;
        if (rank[px] === rank[py]) rank[px]++;
        return true;
    }
    
    let mst = 0, used = 0;
    for (const [w, u, v] of edges) {
        if (union(u, v)) { mst += w; used++; }
    }
    console.log(used === n - 1 ? mst : -1);
});`,
};

export default function WorkspaceShell() {
  const [currentProblem, setCurrentProblem] = useState(0);
  const [language, setLanguage] = useState<Language>('cpp');
  const [code, setCode] = useState<Record<string, Record<Language, string>>>(() => {
    const init: Record<string, Record<Language, string>> = {};
    problems.forEach((p) => {
      init[p.id] = { cpp: defaultCode.cpp, python: defaultCode.python, java: defaultCode.java, javascript: defaultCode.javascript };
    });
    return init;
  });
  const [runResult, setRunResult] = useState<RunResult>({ status: null, output: '' });
  const [outputOpen, setOutputOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftWidth, setLeftWidth] = useState(38);
  const [outputHeight, setOutputHeight] = useState(35);
  const [proctoringWarning, setProctoringWarning] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [myRank, setMyRank] = useState(342);
  const [problemStatuses, setProblemStatuses] = useState<Record<string, ProblemStatus>>(
    Object.fromEntries(problems.map((p) => [p.id, p.status]))
  );

  const isDraggingH = useRef(false);
  const isDraggingV = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-save simulation
  useEffect(() => {
    setSaveStatus('saving');
    const t = setTimeout(() => setSaveStatus('saved'), 1200);
    return () => clearTimeout(t);
  }, [code]);

  // Proctoring: simulate focus loss
  useEffect(() => {
    const handleBlur = () => setProctoringWarning(true);
    const handleFocus = () => setProctoringWarning(false);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

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

  const handleRun = async () => {
    setRunResult({ status: 'running', output: '' });
    setOutputOpen(true);
    // BACKEND: POST /api/judge/run { code, language, problemId, customInput }
    await new Promise((r) => setTimeout(r, 1800));
    const prob = problems[currentProblem];
    setRunResult({
      status: 'accepted',
      output: prob.examples[0]?.output ?? '4',
      expectedOutput: prob.examples[0]?.output ?? '4',
      testcase: prob.examples[0]?.input ?? '',
      time: '0.03s',
      memory: '3.2 MB',
    });
  };

  const handleSubmit = async () => {
    setRunResult({ status: 'running', output: '' });
    setOutputOpen(true);
    // BACKEND: POST /api/judge/submit { code, language, problemId, contestId }
    await new Promise((r) => setTimeout(r, 2400));
    const prob = problems[currentProblem];
    const isCorrect = problemStatuses[prob.id] !== 'unattempted' || Math.random() > 0.3;
    if (isCorrect) {
      setRunResult({
        status: 'accepted',
        output: 'All 12 test cases passed',
        time: '0.08s',
        memory: '4.1 MB',
      });
      setProblemStatuses((prev) => ({ ...prev, [prob.id]: 'answered' }));
      setMyRank((r) => Math.max(1, r - Math.floor(Math.random() * 15 + 5)));
    } else {
      setRunResult({
        status: 'wrong_answer',
        output: 'Wrong Answer on test case 3',
        expectedOutput: '12',
        testcase: '5 7\n...',
        time: '0.05s',
        memory: '3.8 MB',
      });
      setProblemStatuses((prev) => ({ ...prev, [prob.id]: 'attempted' }));
    }
  };

  const currentCode = code[problems[currentProblem].id][language];
  const setCurrentCode = (val: string) => {
    setCode((prev) => ({
      ...prev,
      [problems[currentProblem].id]: {
        ...prev[problems[currentProblem].id],
        [language]: val,
      },
    }));
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-background ${isFullscreen ? 'fixed inset-0 z-[100]' : 'h-screen'}`}
    >
      <ToastProvider />

      {/* Proctoring border warning */}
      {proctoringWarning && <div className="proctor-overlay" aria-hidden="true" />}

      {/* Top bar */}
      <ContestTopBar
        problems={problems}
        problemStatuses={problemStatuses}
        currentProblem={currentProblem}
        onSelectProblem={setCurrentProblem}
        language={language}
        onLanguageChange={setLanguage}
        onRun={handleRun}
        onSubmit={handleSubmit}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        saveStatus={saveStatus}
        myRank={myRank}
        runResult={runResult}
      />

      {/* Main workspace */}
      <div className="flex flex-1 min-h-0">
        {/* Problem panel */}
        <div
          className="flex flex-col min-h-0 overflow-hidden"
          style={{ width: `${leftWidth}%` }}
        >
          <ProblemPanel
            problem={problems[currentProblem]}
            onNext={() => setCurrentProblem((p) => Math.min(problems.length - 1, p + 1))}
            onPrev={() => setCurrentProblem((p) => Math.max(0, p - 1))}
            totalProblems={problems.length}
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
              code={currentCode}
              onChange={setCurrentCode}
              language={language}
              problem={problems[currentProblem]}
              cameraBlocked={cameraBlocked}
              onToggleCamera={() => setCameraBlocked(!cameraBlocked)}
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
                problem={problems[currentProblem]}
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
      <ProctoringOverlay
        warning={proctoringWarning}
        cameraBlocked={cameraBlocked}
      />
    </div>
  );
}