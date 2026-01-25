import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ReportVisualization from '../components/ReportVisualization';

export const ReportVisualizationPage = () => {
  const { year, week } = useParams<{ year: string; week: string }>();
  const navigate = useNavigate();

  // Parse parameters
  const yearNum = parseInt(year || '0', 10);
  const weekNum = parseInt(week || '0', 10);

  if (!yearNum || !weekNum) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        Invalid Report Parameters
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-4xl p-6 flex items-center justify-between sticky top-0 z-20">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 rounded-full hover:bg-slate-200/50 backdrop-blur-sm text-slate-600 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        {/* Optional: Add title or keep it clean for immersion */}
        <div className="w-10" /> 
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-4xl px-4 pb-12 flex-1">
        <ReportVisualization year={yearNum} week={weekNum} />
      </div>
    </div>
  );
};
