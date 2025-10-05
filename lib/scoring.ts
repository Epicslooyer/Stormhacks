/**
 * Scoring system utilities for the competitive coding game
 */

export interface ScoreComponents {
  completionTime: number; // milliseconds
  oNotation: string | null;
  testCasesPassed: number;
  totalTestCases: number;
}

export interface CalculatedScore {
  finalScore: number;
  breakdown: {
    timeScore: number;
    efficiencyScore: number;
    correctnessScore: number;
  };
}

/**
 * O notation efficiency multipliers
 * Lower complexity = higher score
 */
const O_NOTATION_MULTIPLIERS: Record<string, number> = {
  'O(1)': 1.5,      // Constant time - best
  'O(log n)': 1.4,  // Logarithmic
  'O(n)': 1.3,      // Linear
  'O(n log n)': 1.2, // Linearithmic
  'O(n^2)': 1.0,    // Quadratic - baseline
  'O(n^3)': 0.8,    // Cubic
  'O(2^n)': 0.5,    // Exponential - worst
  'O(n!)': 0.3,     // Factorial - terrible
};

/**
 * Calculate the final score based on time, efficiency, and correctness
 */
export function calculateScore(components: ScoreComponents): CalculatedScore {
  const { completionTime, oNotation, testCasesPassed, totalTestCases } = components;
  
  // Time score (0-100): Faster completion = higher score
  // Normalize time to a 0-100 scale (assuming max reasonable time is 30 minutes)
  const maxTime = 30 * 60 * 1000; // 30 minutes in milliseconds
  const timeScore = Math.max(0, 100 - (completionTime / maxTime) * 100);
  
  // Efficiency score (0-100): Based on O notation
  const efficiencyMultiplier = oNotation ? (O_NOTATION_MULTIPLIERS[oNotation] || 1.0) : 1.0;
  const efficiencyScore = Math.min(100, 50 * efficiencyMultiplier);
  
  // Correctness score (0-100): Based on test cases passed
  const correctnessScore = totalTestCases > 0 ? (testCasesPassed / totalTestCases) * 100 : 0;
  
  // Weighted final score
  const weights = {
    time: 0.4,        // 40% weight on speed
    efficiency: 0.3,  // 30% weight on efficiency
    correctness: 0.3, // 30% weight on correctness
  };
  
  const finalScore = 
    (timeScore * weights.time) +
    (efficiencyScore * weights.efficiency) +
    (correctnessScore * weights.correctness);
  
  return {
    finalScore: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
    breakdown: {
      timeScore: Math.round(timeScore * 100) / 100,
      efficiencyScore: Math.round(efficiencyScore * 100) / 100,
      correctnessScore: Math.round(correctnessScore * 100) / 100,
    },
  };
}

/**
 * Analyze code to detect O notation complexity
 * This is a simplified heuristic-based approach
 */
export function detectONotation(code: string): string | null {
  const normalizedCode = code.toLowerCase().replace(/\s+/g, ' ');
  
  // Check for nested loops (O(n^2), O(n^3), etc.)
  const nestedLoopPattern = /for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)/g;
  const nestedLoopMatches = normalizedCode.match(nestedLoopPattern);
  
  if (nestedLoopMatches) {
    const depth = nestedLoopMatches.length;
    if (depth >= 3) return 'O(n^3)';
    if (depth >= 2) return 'O(n^2)';
  }
  
  // Check for exponential patterns (recursive with branching)
  const recursivePattern = /function\s+\w+\s*\([^)]*\)\s*\{[^}]*\w+\s*\([^)]*\)/g;
  const recursiveMatches = normalizedCode.match(recursivePattern);
  if (recursiveMatches && recursiveMatches.length > 2) {
    return 'O(2^n)';
  }
  
  // Check for sorting algorithms
  if (normalizedCode.includes('sort') || normalizedCode.includes('quicksort') || 
      normalizedCode.includes('mergesort') || normalizedCode.includes('heapsort')) {
    return 'O(n log n)';
  }
  
  // Check for binary search
  if (normalizedCode.includes('binary') && normalizedCode.includes('search')) {
    return 'O(log n)';
  }
  
  // Check for single loop
  const singleLoopPattern = /for\s*\([^)]*\)\s*\{[^}]*\}/g;
  const singleLoopMatches = normalizedCode.match(singleLoopPattern);
  if (singleLoopMatches && singleLoopMatches.length === 1) {
    return 'O(n)';
  }
  
  // Check for constant time operations
  if (!normalizedCode.includes('for') && !normalizedCode.includes('while') && 
      !normalizedCode.includes('recursive') && !normalizedCode.includes('function')) {
    return 'O(1)';
  }
  
  // Default to O(n) if we can't determine
  return 'O(n)';
}

/**
 * Check if a score meets the elimination threshold
 */
export function isScoreAboveThreshold(score: number, threshold: number = 30): boolean {
  return score >= threshold;
}

/**
 * Get score grade based on final score
 */
export function getScoreGrade(score: number): string {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return score.toFixed(1);
}

/**
 * Format time for display
 */
export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}
