import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const questions = [
  {
    title: 'Two Sum',
    problemStatement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    inputFormat: 'The first line contains an integer N, the number of elements in the array.\nThe second line contains N space-separated integers, representing the array.\nThe third line contains an integer representing the target sum.',
    outputFormat: 'Print two space-separated integers representing the indices of the two numbers that add up to the target.',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    difficulty: 'EASY',
    points: 100,
    tags: ['Array', 'Hash Table'],
    hints: ['A really brute force way would be to search for all possible pairs of numbers but that would be too slow.', 'Try to use a hash map to store the numbers you have already seen.'],
    timeLimit: 2.0,
    memoryLimit: 256.0,
    testCases: {
      create: [
        { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isHidden: false, isSample: true },
        { input: '3\n3 2 4\n6', expectedOutput: '1 2', isHidden: false, isSample: true },
        { input: '2\n3 3\n6', expectedOutput: '0 1', isHidden: true, isSample: false },
        { input: '5\n1 5 8 2 10\n13', expectedOutput: '1 2', isHidden: true, isSample: false },
        { input: '6\n-5 0 2 10 15 20\n15', expectedOutput: '0 5', isHidden: true, isSample: false },
      ]
    }
  },
  {
    title: 'Valid Palindrome',
    problemStatement: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.',
    inputFormat: 'A single line containing the string `s`.',
    outputFormat: 'Print "true" if the string is a valid palindrome, otherwise print "false".',
    constraints: '1 <= s.length <= 2 * 10^5\n`s` consists only of printable ASCII characters.',
    difficulty: 'EASY',
    points: 100,
    tags: ['String', 'Two Pointers'],
    hints: ['Consider maintaining two pointers, one at the beginning and one at the end of the string.', 'Skip over any non-alphanumeric characters.'],
    timeLimit: 1.5,
    memoryLimit: 256.0,
    testCases: {
      create: [
        { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isHidden: false, isSample: true },
        { input: 'race a car', expectedOutput: 'false', isHidden: false, isSample: true },
        { input: ' ', expectedOutput: 'true', isHidden: true, isSample: false },
        { input: '0P', expectedOutput: 'false', isHidden: true, isSample: false },
        { input: 'a.', expectedOutput: 'true', isHidden: true, isSample: false },
      ]
    }
  },
  {
    title: 'Merge Intervals',
    problemStatement: 'Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    inputFormat: 'The first line contains N, the number of intervals.\nThe next N lines each contain two integers, start and end.',
    outputFormat: 'Print the merged intervals, each on a new line with space-separated start and end values.',
    constraints: '1 <= intervals.length <= 10^4\nintervals[i].length == 2\n0 <= starti <= endi <= 10^4',
    difficulty: 'MEDIUM',
    points: 200,
    tags: ['Array', 'Sorting'],
    hints: ['Sort the intervals by their start value.', 'Iterate through the sorted intervals and merge if the current interval overlaps with the previous one.'],
    timeLimit: 2.0,
    memoryLimit: 256.0,
    testCases: {
      create: [
        { input: '4\n1 3\n2 6\n8 10\n15 18', expectedOutput: '1 6\n8 10\n15 18', isHidden: false, isSample: true },
        { input: '2\n1 4\n4 5', expectedOutput: '1 5', isHidden: false, isSample: true },
        { input: '3\n1 4\n0 4\n5 6', expectedOutput: '0 4\n5 6', isHidden: true, isSample: false },
        { input: '5\n1 4\n2 3\n5 8\n7 9\n10 12', expectedOutput: '1 4\n5 9\n10 12', isHidden: true, isSample: false },
        { input: '1\n1 10', expectedOutput: '1 10', isHidden: true, isSample: false },
      ]
    }
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    problemStatement: 'Given a string `s`, find the length of the longest substring without repeating characters.',
    inputFormat: 'A single line containing the string `s`.',
    outputFormat: 'Print a single integer representing the length of the longest substring.',
    constraints: '0 <= s.length <= 5 * 10^4\n`s` consists of English letters, digits, symbols and spaces.',
    difficulty: 'MEDIUM',
    points: 200,
    tags: ['String', 'Sliding Window', 'Hash Table'],
    hints: ['Use a sliding window approach with two pointers.', 'Keep track of characters currently in the window using a set or array.'],
    timeLimit: 2.0,
    memoryLimit: 256.0,
    testCases: {
      create: [
        { input: 'abcabcbb', expectedOutput: '3', isHidden: false, isSample: true },
        { input: 'bbbbb', expectedOutput: '1', isHidden: false, isSample: true },
        { input: 'pwwkew', expectedOutput: '3', isHidden: true, isSample: false },
        { input: '', expectedOutput: '0', isHidden: true, isSample: false },
        { input: 'au', expectedOutput: '2', isHidden: true, isSample: false },
      ]
    }
  },
  {
    title: 'Coin Change',
    problemStatement: 'You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.',
    inputFormat: 'The first line contains N, the number of coin types.\nThe second line contains N space-separated integers representing the coins.\nThe third line contains the target amount.',
    outputFormat: 'Print a single integer representing the minimum number of coins, or -1 if impossible.',
    constraints: '1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4',
    difficulty: 'MEDIUM',
    points: 300,
    tags: ['Array', 'Dynamic Programming'],
    hints: ['This is a classic knapsack problem variant.', 'Use dynamic programming. Let dp[i] be the minimum coins to make amount i.'],
    timeLimit: 3.0,
    memoryLimit: 256.0,
    testCases: {
      create: [
        { input: '3\n1 2 5\n11', expectedOutput: '3', isHidden: false, isSample: true },
        { input: '1\n2\n3', expectedOutput: '-1', isHidden: false, isSample: true },
        { input: '1\n1\n0', expectedOutput: '0', isHidden: true, isSample: false },
        { input: '4\n2 4 6 8\n11', expectedOutput: '-1', isHidden: true, isSample: false },
        { input: '4\n186 419 83 408\n6249', expectedOutput: '20', isHidden: true, isSample: false },
      ]
    }
  },
  {
    title: 'Number of Islands',
    problemStatement: 'Given an `m x n` 2D binary grid `grid` which represents a map of `1`s (land) and `0`s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.',
    inputFormat: 'The first line contains two integers M and N.\nThe next M lines each contain a string of N characters (`0` or `1`).',
    outputFormat: 'Print a single integer representing the number of islands.',
    constraints: 'm == grid.length\nn == grid[i].length\n1 <= m, n <= 300\ngrid[i][j] is `0` or `1`.',
    difficulty: 'MEDIUM',
    points: 300,
    tags: ['Array', 'Matrix', 'DFS', 'BFS'],
    hints: ['Iterate through the grid. When you find a 1, increment the island count and start a DFS or BFS to mark all connected 1s as visited.'],
    timeLimit: 2.0,
    memoryLimit: 256.0,
    testCases: {
      create: [
        { input: '4 5\n11110\n11010\n11000\n00000', expectedOutput: '1', isHidden: false, isSample: true },
        { input: '4 5\n11000\n11000\n00100\n00011', expectedOutput: '3', isHidden: false, isSample: true },
        { input: '3 3\n101\n010\n101', expectedOutput: '5', isHidden: true, isSample: false },
        { input: '2 2\n11\n11', expectedOutput: '1', isHidden: true, isSample: false },
        { input: '1 1\n0', expectedOutput: '0', isHidden: true, isSample: false },
      ]
    }
  },
  {
    title: 'Top K Frequent Elements',
    problemStatement: 'Given an integer array `nums` and an integer `k`, return the `k` most frequent elements. You may return the answer in any order.',
    inputFormat: 'The first line contains N and K.\nThe second line contains N space-separated integers representing the array.',
    outputFormat: 'Print K space-separated integers representing the most frequent elements.',
    constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4\nk is in the range [1, the number of unique elements in the array].\nIt is guaranteed that the answer is unique.',
    difficulty: 'MEDIUM',
    points: 250,
    tags: ['Array', 'Hash Table', 'Sorting', 'Heap (Priority Queue)'],
    hints: ['Count the frequencies of elements using a hash map.', 'You can use a min-heap of size K or bucket sort to find the top K elements.'],
    timeLimit: 2.0,
    memoryLimit: 256.0,
    testCases: {
      create: [
        { input: '6 2\n1 1 1 2 2 3', expectedOutput: '1 2', isHidden: false, isSample: true },
        { input: '1 1\n1', expectedOutput: '1', isHidden: false, isSample: true },
        { input: '5 2\n4 4 4 5 5', expectedOutput: '4 5', isHidden: true, isSample: false },
        { input: '8 3\n1 2 2 3 3 3 4 4 4 4', expectedOutput: '4 3 2', isHidden: true, isSample: false },
        { input: '3 1\n-1 -1 -1', expectedOutput: '-1', isHidden: true, isSample: false },
      ]
    }
  },
  {
    title: 'Trapping Rain Water',
    problemStatement: 'Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.',
    inputFormat: 'The first line contains N, the number of elevation bars.\nThe second line contains N space-separated integers.',
    outputFormat: 'Print a single integer representing the total amount of trapped water.',
    constraints: 'n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5',
    difficulty: 'HARD',
    points: 400,
    tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
    hints: ['For any given bar, the water it can trap depends on the maximum height on its left and the maximum height on its right.', 'You can use two pointers (left and right) to optimize space complexity to O(1).'],
    timeLimit: 3.0,
    memoryLimit: 256.0,
    testCases: {
      create: [
        { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6', isHidden: false, isSample: true },
        { input: '6\n4 2 0 3 2 5', expectedOutput: '9', isHidden: false, isSample: true },
        { input: '3\n2 0 2', expectedOutput: '2', isHidden: true, isSample: false },
        { input: '5\n5 4 3 2 1', expectedOutput: '0', isHidden: true, isSample: false },
        { input: '7\n1 0 2 1 0 1 3', expectedOutput: '5', isHidden: true, isSample: false },
      ]
    }
  },
  {
    title: 'Word Ladder',
    problemStatement: 'A transformation sequence from word `beginWord` to word `endWord` using a dictionary `wordList` is a sequence of words `beginWord -> s1 -> s2 -> ... -> sk` such that:\n- Every adjacent pair of words differs by a single letter.\n- Every `si` for `1 <= i <= k` is in `wordList`. Note that `beginWord` does not need to be in `wordList`.\n- `sk == endWord`\n\nGiven two words, `beginWord` and `endWord`, and a dictionary `wordList`, return the number of words in the shortest transformation sequence from `beginWord` to `endWord`, or `0` if no such sequence exists.',
    inputFormat: 'The first line contains `beginWord` and `endWord` separated by a space.\nThe second line contains N, the length of the wordList.\nThe third line contains N space-separated words.',
    outputFormat: 'Print a single integer representing the length of the shortest transformation sequence.',
    constraints: '1 <= beginWord.length <= 10\nendWord.length == beginWord.length\n1 <= wordList.length <= 5000\nwordList[i].length == beginWord.length\nAll words consist of lowercase English letters.',
    difficulty: 'HARD',
    points: 400,
    tags: ['Hash Table', 'String', 'BFS'],
    hints: ['Treat the words as nodes in a graph. Two words are connected if they differ by exactly one letter.', 'Find the shortest path using Breadth-First Search (BFS).'],
    timeLimit: 3.5,
    memoryLimit: 256.0,
    testCases: {
      create: [
        { input: 'hit cog\n6\nhot dot dog lot log cog', expectedOutput: '5', isHidden: false, isSample: true },
        { input: 'hit cog\n5\nhot dot dog lot log', expectedOutput: '0', isHidden: false, isSample: true },
        { input: 'a c\n3\na b c', expectedOutput: '2', isHidden: true, isSample: false },
        { input: 'ymain ymaiu\n4\nymain ymaiu ymaia ymaie', expectedOutput: '2', isHidden: true, isSample: false },
        { input: 'lost cost\n3\nmost post cost', expectedOutput: '2', isHidden: true, isSample: false },
      ]
    }
  },
  {
    title: 'Binary Tree Maximum Path Sum',
    problemStatement: 'A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence at most once. Note that the path does not need to pass through the root.\n\nThe path sum of a path is the sum of the node\'s values in the path.\n\nGiven the `root` of a binary tree, return the maximum path sum of any non-empty path.',
    inputFormat: 'The input represents a level-order traversal of a binary tree (null nodes are represented by "null").\nA single line containing space-separated values.',
    outputFormat: 'Print a single integer representing the maximum path sum.',
    constraints: 'The number of nodes in the tree is in the range [1, 3 * 10^4].\n-1000 <= Node.val <= 1000',
    difficulty: 'HARD',
    points: 500,
    tags: ['Tree', 'DFS', 'Dynamic Programming'],
    hints: ['A path from start to end goes up on the tree for 0 or more steps, then goes down for 0 or more steps.', 'Use recursion to calculate the max path down from a node, while simultaneously updating the global maximum path sum.'],
    timeLimit: 2.5,
    memoryLimit: 256.0,
    testCases: {
      create: [
        { input: '1 2 3', expectedOutput: '6', isHidden: false, isSample: true },
        { input: '-10 9 20 null null 15 7', expectedOutput: '42', isHidden: false, isSample: true },
        { input: '2 -1 -2', expectedOutput: '2', isHidden: true, isSample: false },
        { input: '1 -2 3', expectedOutput: '4', isHidden: true, isSample: false },
        { input: '5 4 8 11 null 13 4 7 2 null null null 1', expectedOutput: '48', isHidden: true, isSample: false },
      ]
    }
  }
];

async function main() {
  console.log('Seeding 10 questions...');
  for (const q of questions) {
    const created = await prisma.question.create({
      data: q,
    });
    console.log(`Created question: ${created.title}`);
  }
  console.log('Successfully seeded 10 questions!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
