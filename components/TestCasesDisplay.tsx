"use client";

import { useTestCases, type TestCase, type TestCasesResponse } from "./useTestCases";
import { useState } from "react";

interface TestCasesDisplayProps {
  problemSlug: string;
}

export function TestCasesDisplay({ problemSlug }: TestCasesDisplayProps) {
  const { 
    testCases, 
    isLoading, 
    isError, 
    error, 
    generateTestCases, 
    isGenerating, 
    generateError 
  } = useTestCases(problemSlug);

  const testCasesData = testCases as TestCasesResponse | null;

  const [expandedTestCase, setExpandedTestCase] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Test Cases</h3>
        <p className="text-red-600">{error?.message || "An unknown error occurred"}</p>
      </div>
    );
  }

  if (!testCasesData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Test Cases</h3>
          <button
            onClick={() => generateTestCases()}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {isGenerating ? "Generating..." : "Generate Test Cases"}
          </button>
        </div>
        
        {generateError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-600 text-sm">{generateError.message}</p>
          </div>
        )}
        
        <p className="text-gray-600">No test cases available for this problem yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Test Cases ({testCasesData.testCases.length})
        </h3>
        <div className="text-sm text-gray-500">
          Generated {new Date(testCasesData.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="space-y-3">
        {testCasesData.testCases.map((testCase: TestCase, index: number) => (
          <TestCaseCard
            key={index}
            testCase={testCase}
            index={index}
            isExpanded={expandedTestCase === index}
            onToggle={() => setExpandedTestCase(expandedTestCase === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
}

interface TestCaseCardProps {
  testCase: TestCase;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function TestCaseCard({ testCase, index, isExpanded, onToggle }: TestCaseCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
              Test {index + 1}
            </span>
            {testCase.description && (
              <span className="text-sm text-gray-600">{testCase.description}</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-4 py-3 bg-white border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Input
              </label>
              <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                {testCase.input}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Output
              </label>
              <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                {testCase.expectedOutput}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
