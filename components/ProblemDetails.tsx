"use client";

import { useProblemDetails } from "./useProblemDetails";

interface ProblemDetailsProps {
  slug: string;
}

export function ProblemDetails({ slug }: ProblemDetailsProps) {
  const { data: problem, isLoading, isError, error } = useProblemDetails(slug);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
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
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Problem</h3>
        <p className="text-red-600">{error?.message || "An unknown error occurred"}</p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Problem not found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{problem.title}</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
          problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {problem.difficulty}
        </span>
      </div>
      
      {problem.content && (
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: problem.content }}
        />
      )}
    </div>
  );
}
