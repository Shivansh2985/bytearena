import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

const practiceQuestions = [
  {
    title: "Two Sum",
    problemStatement: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    inputFormat: "The first line contains an integer `N`, the size of the array.\nThe second line contains `N` space-separated integers representing the array.\nThe third line contains an integer `target`.",
    outputFormat: "Print two space-separated integers representing the indices of the two numbers.",
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
    difficulty: Difficulty.EASY,
    points: 10,
    timeLimit: 2.0,
    hints: ["Can you use a Hash Map to store the elements you have seen so far?", "For each element `x`, check if `target - x` exists in the Hash Map.", "This brings the time complexity down from O(N^2) to O(N)."],
    testCases: [
      { input: "4\n2 7 11 15\n9", expectedOutput: "0 1", isHidden: false, isSample: true },
      { input: "3\n3 2 4\n6", expectedOutput: "1 2", isHidden: false, isSample: true },
      { input: "2\n3 3\n6", expectedOutput: "0 1", isHidden: true, isSample: false },
      { input: "5\n-1 -2 -3 -4 -5\n-8", expectedOutput: "2 4", isHidden: true, isSample: false },
      { input: "4\n0 4 3 0\n0", expectedOutput: "0 3", isHidden: true, isSample: false }
    ]
  },
  {
    title: "Reverse String",
    problemStatement: "Write a function that reverses a string. The input string is given as an array of characters. You must do this by modifying the input array in-place with O(1) extra memory.",
    inputFormat: "A single line containing the string `s`.",
    outputFormat: "Print the reversed string.",
    constraints: "1 <= s.length <= 10^5\n`s` consists of printable ASCII characters.",
    difficulty: Difficulty.EASY,
    points: 10,
    timeLimit: 1.0,
    hints: ["Use a two-pointer approach.", "One pointer at the beginning, one at the end, and swap them.", "Continue until the pointers cross."],
    testCases: [
      { input: "hello", expectedOutput: "olleh", isHidden: false, isSample: true },
      { input: "Hannah", expectedOutput: "hannaH", isHidden: false, isSample: true },
      { input: "a", expectedOutput: "a", isHidden: true, isSample: false },
      { input: "ab", expectedOutput: "ba", isHidden: true, isSample: false },
      { input: "racecar", expectedOutput: "racecar", isHidden: true, isSample: false }
    ]
  },
  {
    title: "Valid Palindrome",
    problemStatement: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string `s`, return true if it is a palindrome, or false otherwise.",
    inputFormat: "A single string `s`.",
    outputFormat: "Print `true` if `s` is a palindrome, and `false` otherwise.",
    constraints: "1 <= s.length <= 2 * 10^5\n`s` consists only of printable ASCII characters.",
    difficulty: Difficulty.EASY,
    points: 10,
    timeLimit: 1.0,
    hints: ["Filter the string to keep only alphanumeric characters.", "Convert to lowercase.", "Use two pointers from both ends to check for equality."],
    testCases: [
      { input: "A man, a plan, a canal: Panama", expectedOutput: "true", isHidden: false, isSample: true },
      { input: "race a car", expectedOutput: "false", isHidden: false, isSample: true },
      { input: " ", expectedOutput: "true", isHidden: true, isSample: false },
      { input: "0P", expectedOutput: "false", isHidden: true, isSample: false },
      { input: "No 'x' in Nixon", expectedOutput: "true", isHidden: true, isSample: false }
    ]
  },
  {
    title: "Contains Duplicate",
    problemStatement: "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
    inputFormat: "The first line contains an integer `N`, the size of the array.\nThe second line contains `N` space-separated integers.",
    outputFormat: "Print `true` or `false`.",
    constraints: "1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
    difficulty: Difficulty.EASY,
    points: 10,
    timeLimit: 1.0,
    hints: ["Sorting the array can help find duplicates easily.", "Alternatively, use a Hash Set to track seen elements.", "Hash Set provides O(N) time complexity."],
    testCases: [
      { input: "4\n1 2 3 1", expectedOutput: "true", isHidden: false, isSample: true },
      { input: "4\n1 2 3 4", expectedOutput: "false", isHidden: false, isSample: true },
      { input: "10\n1 1 1 3 3 4 3 2 4 2", expectedOutput: "true", isHidden: true, isSample: false },
      { input: "1\n5", expectedOutput: "false", isHidden: true, isSample: false },
      { input: "3\n10 10 10", expectedOutput: "true", isHidden: true, isSample: false }
    ]
  },
  {
    title: "Maximum Subarray",
    problemStatement: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
    inputFormat: "The first line contains an integer `N`, the size of the array.\nThe second line contains `N` space-separated integers.",
    outputFormat: "Print the maximum subarray sum.",
    constraints: "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
    difficulty: Difficulty.MEDIUM,
    points: 20,
    timeLimit: 1.5,
    hints: ["Use Kadane's Algorithm.", "Maintain a current sum and a max sum.", "If current sum becomes negative, reset it to 0."],
    testCases: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6", isHidden: false, isSample: true },
      { input: "1\n1", expectedOutput: "1", isHidden: false, isSample: true },
      { input: "5\n5 4 -1 7 8", expectedOutput: "23", isHidden: true, isSample: false },
      { input: "3\n-1 -2 -3", expectedOutput: "-1", isHidden: true, isSample: false },
      { input: "5\n-5 -2 -1 -3 -4", expectedOutput: "-1", isHidden: true, isSample: false }
    ]
  },
  {
    title: "Climbing Stairs",
    problemStatement: "You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    inputFormat: "A single integer `n`.",
    outputFormat: "An integer representing the number of ways.",
    constraints: "1 <= n <= 45",
    difficulty: Difficulty.EASY,
    points: 10,
    timeLimit: 1.0,
    hints: ["This is a dynamic programming problem.", "The number of ways to reach step `n` is the sum of ways to reach `n-1` and `n-2`.", "It's exactly the Fibonacci sequence."],
    testCases: [
      { input: "2", expectedOutput: "2", isHidden: false, isSample: true },
      { input: "3", expectedOutput: "3", isHidden: false, isSample: true },
      { input: "4", expectedOutput: "5", isHidden: true, isSample: false },
      { input: "5", expectedOutput: "8", isHidden: true, isSample: false },
      { input: "45", expectedOutput: "1836311903", isHidden: true, isSample: false }
    ]
  },
  {
    title: "Best Time to Buy and Sell Stock",
    problemStatement: "You are given an array `prices` where `prices[i]` is the price of a given stock on the `ith` day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit.",
    inputFormat: "The first line contains `N`.\nThe second line contains `N` space-separated integers.",
    outputFormat: "An integer representing the max profit.",
    constraints: "1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4",
    difficulty: Difficulty.EASY,
    points: 10,
    timeLimit: 1.5,
    hints: ["Keep track of the minimum price seen so far.", "Calculate the potential profit if you sold today (current price - min price).", "Update the max profit if the current profit is higher."],
    testCases: [
      { input: "6\n7 1 5 3 6 4", expectedOutput: "5", isHidden: false, isSample: true },
      { input: "5\n7 6 4 3 1", expectedOutput: "0", isHidden: false, isSample: true },
      { input: "2\n1 2", expectedOutput: "1", isHidden: true, isSample: false },
      { input: "3\n2 4 1", expectedOutput: "2", isHidden: true, isSample: false },
      { input: "5\n2 1 2 1 0 1 2", expectedOutput: "2", isHidden: true, isSample: false }
    ]
  },
  {
    title: "Product of Array Except Self",
    problemStatement: "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`. The product of any prefix or suffix of `nums` is guaranteed to fit in a 32-bit integer. You must write an algorithm that runs in O(n) time and without using the division operation.",
    inputFormat: "First line `N`.\nSecond line `N` integers.",
    outputFormat: "`N` space-separated integers.",
    constraints: "2 <= nums.length <= 10^5\n-30 <= nums[i] <= 30",
    difficulty: Difficulty.MEDIUM,
    points: 20,
    timeLimit: 2.0,
    hints: ["Create two arrays: one for the prefix products and one for the suffix products.", "For any index `i`, the answer is `prefix[i-1] * suffix[i+1]`.", "Can you do this with O(1) extra space?"],
    testCases: [
      { input: "4\n1 2 3 4", expectedOutput: "24 12 8 6", isHidden: false, isSample: true },
      { input: "5\n-1 1 0 -3 3", expectedOutput: "0 0 9 0 0", isHidden: false, isSample: true },
      { input: "2\n0 0", expectedOutput: "0 0", isHidden: true, isSample: false },
      { input: "3\n1 0 2", expectedOutput: "0 2 0", isHidden: true, isSample: false },
      { input: "3\n2 3 4", expectedOutput: "12 8 6", isHidden: true, isSample: false }
    ]
  },
  {
    title: "Merge Intervals",
    problemStatement: "Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    inputFormat: "First line `N`, number of intervals.\nNext `N` lines, each containing two space-separated integers `start` and `end`.",
    outputFormat: "Print the merged intervals, each on a new line.",
    constraints: "1 <= intervals.length <= 10^4\n0 <= starti <= endi <= 10^4",
    difficulty: Difficulty.MEDIUM,
    points: 20,
    timeLimit: 2.0,
    hints: ["Sort the intervals based on their start times.", "Iterate through the sorted intervals.", "If the current interval overlaps with the last merged one, extend the end time of the last merged one."],
    testCases: [
      { input: "4\n1 3\n2 6\n8 10\n15 18", expectedOutput: "1 6\n8 10\n15 18", isHidden: false, isSample: true },
      { input: "2\n1 4\n4 5", expectedOutput: "1 5", isHidden: false, isSample: true },
      { input: "1\n1 4", expectedOutput: "1 4", isHidden: true, isSample: false },
      { input: "3\n1 4\n0 4\n2 3", expectedOutput: "0 4", isHidden: true, isSample: false },
      { input: "2\n1 1\n2 2", expectedOutput: "1 1\n2 2", isHidden: true, isSample: false }
    ]
  },
  {
    title: "Trapping Rain Water",
    problemStatement: "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    inputFormat: "First line `N`.\nSecond line `N` integers representing the height array.",
    outputFormat: "A single integer representing trapped water.",
    constraints: "n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5",
    difficulty: Difficulty.HARD,
    points: 30,
    timeLimit: 2.0,
    hints: ["For each bar, the water it can trap depends on the max height to its left and right.", "Use two arrays to precompute the left max and right max for each index.", "You can also optimize it to O(1) space using two pointers."],
    testCases: [
      { input: "12\n0 1 0 2 1 0 1 3 2 1 2 1", expectedOutput: "6", isHidden: false, isSample: true },
      { input: "6\n4 2 0 3 2 5", expectedOutput: "9", isHidden: false, isSample: true },
      { input: "3\n1 0 1", expectedOutput: "1", isHidden: true, isSample: false },
      { input: "4\n3 0 0 2", expectedOutput: "4", isHidden: true, isSample: false },
      { input: "1\n5", expectedOutput: "0", isHidden: true, isSample: false }
    ]
  }
];

async function main() {
  console.log("Deleting old practice questions...");
  await prisma.question.deleteMany({
    where: {
      contestId: null
    }
  });

  console.log("Seeding 10 real algorithmic practice questions...");
  for (const q of practiceQuestions) {
    const createdQuestion = await prisma.question.create({
      data: {
        title: q.title,
        problemStatement: q.problemStatement,
        inputFormat: q.inputFormat,
        outputFormat: q.outputFormat,
        constraints: q.constraints,
        difficulty: q.difficulty,
        points: q.points,
        timeLimit: q.timeLimit,
        hints: q.hints,
        testCases: {
          create: q.testCases
        }
      }
    });
    console.log(`Created question: ${createdQuestion.title}`);
  }

  console.log("Seed complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
