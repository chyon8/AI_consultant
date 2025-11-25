import React from 'react';
import { ModuleItem } from '../types';
import { Icons } from './Icons';

interface ArchitectureTabProps {
  modules: ModuleItem[];
}

export const ArchitectureTab: React.FC<ArchitectureTabProps> = ({ modules }) => {
  const activeModules = modules.filter(m => m.isSelected);
  const hasCat = (cat: string) => activeModules.some(m => m.category.includes(cat));

  return (
    <div className="space-y-6 animate-fade-in pb-20 pt-4">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h3 className="text-2xl font-light text-slate-900 mb-1">Architecture</h3>
           <p className="text-sm text-slate-400">Microservice Structure</p>
        </div>
      </div>
      
      <div className="w-full bg-white relative overflow-hidden">
        {/* SVG Diagram - Minimal Monochrome */}
        <svg viewBox="0 0 800 500" className="w-full h-auto relative z-10 font-sans">
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#cbd5e1" />
            </marker>
          </defs>

          {/* Client Layer Area */}
          <text x="40" y="45" className="text-[10px] font-bold fill-slate-300 uppercase tracking-widest">Front-end</text>

          {/* Web Portal Node */}
          <g transform="translate(150, 50)">
            <rect width="140" height="44" rx="2" fill="white" stroke="#1e293b" strokeWidth="1.5" />
            <text x="70" y="28" textAnchor="middle" className="text-sm font-medium fill-slate-900">Web Portal</text>
          </g>

          {/* Mobile App Node */}
          {hasCat('Platform') && (
            <g transform="translate(510, 50)">
              <rect width="140" height="44" rx="2" fill="white" stroke="#1e293b" strokeWidth="1.5" />
              <text x="70" y="28" textAnchor="middle" className="text-sm font-medium fill-slate-900">Mobile App</text>
            </g>
          )}

          {/* API Gateway */}
          <g transform="translate(300, 150)">
             <rect width="200" height="40" rx="20" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
             <text x="100" y="25" textAnchor="middle" className="text-xs font-bold fill-slate-500 tracking-wide">API Gateway</text>
           </g>
          
          {/* Connectors */}
          <path d="M220,94 C220,120 330,120 350,150" fill="none" stroke="#cbd5e1" strokeWidth="1" markerEnd="url(#arrowhead)" />
          {hasCat('Platform') && (
            <path d="M580,94 C580,120 470,120 450,150" fill="none" stroke="#cbd5e1" strokeWidth="1" markerEnd="url(#arrowhead)" />
          )}


          {/* Microservices Layer */}
          <text x="40" y="265" className="text-[10px] font-bold fill-slate-300 uppercase tracking-widest">Services</text>

          {/* Auth Service */}
          <g transform="translate(80, 280)">
            <rect width="120" height="50" rx="0" fill="white" stroke="#e2e8f0" strokeWidth="1" />
            <text x="60" y="30" textAnchor="middle" className="text-sm font-medium fill-slate-600">Auth</text>
          </g>

          {/* LMS Core */}
          <g transform="translate(220, 280)">
            <rect width="120" height="50" rx="0" fill="white" stroke="#e2e8f0" strokeWidth="1" />
            <text x="60" y="30" textAnchor="middle" className="text-sm font-medium fill-slate-600">Core LMS</text>
          </g>

          {/* Conditional Services */}
          {hasCat('Education') && (
            <g transform="translate(360, 280)">
              <rect width="120" height="50" rx="0" fill="white" stroke="#e2e8f0" strokeWidth="1" />
              <text x="60" y="30" textAnchor="middle" className="text-sm font-medium fill-slate-600">Exam</text>
            </g>
          )}

          {hasCat('LMS Core') && (
             <g transform="translate(500, 280)">
              <rect width="120" height="50" rx="0" fill="white" stroke="#e2e8f0" strokeWidth="1" />
              <text x="60" y="30" textAnchor="middle" className="text-sm font-medium fill-slate-600">Media</text>
            </g>
          )}

           {hasCat('Communication') && (
             <g transform="translate(640, 280)">
              <rect width="110" height="50" rx="0" fill="white" stroke="#e2e8f0" strokeWidth="1" />
              <text x="55" y="30" textAnchor="middle" className="text-sm font-medium fill-slate-600">Chat</text>
            </g>
          )}
          
          {/* Service Connectors */}
           <path d="M400,190 L140,280" stroke="#f1f5f9" strokeWidth="1" />
           <path d="M400,190 L280,280" stroke="#f1f5f9" strokeWidth="1" />
           <path d="M400,190 L420,280" stroke="#f1f5f9" strokeWidth="1" />
           <path d="M400,190 L560,280" stroke="#f1f5f9" strokeWidth="1" />
           <path d="M400,190 L695,280" stroke="#f1f5f9" strokeWidth="1" />

          {/* Data Layer */}
           <text x="40" y="445" className="text-[10px] font-bold fill-slate-300 uppercase tracking-widest">Data</text>

           {/* Databases */}
           <g transform="translate(280, 425)">
             <path d="M0,6 C0,2 20,0 40,0 C60,0 80,2 80,6 L80,18 C80,22 60,24 40,24 C20,24 0,22 0,18 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
             <ellipse cx="40" cy="6" rx="40" ry="6" fill="none" stroke="#cbd5e1" strokeWidth="1"/>
             <text x="40" y="40" textAnchor="middle" className="text-xs fill-slate-400">Main DB</text>
           </g>

           <g transform="translate(480, 425)">
             <path d="M0,6 C0,2 20,0 40,0 C60,0 80,2 80,6 L80,18 C80,22 60,24 40,24 C20,24 0,22 0,18 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
             <ellipse cx="40" cy="6" rx="40" ry="6" fill="none" stroke="#cbd5e1" strokeWidth="1"/>
             <text x="40" y="40" textAnchor="middle" className="text-xs fill-slate-400">Redis</text>
           </g>
           
        </svg>
      </div>
    </div>
  );
};