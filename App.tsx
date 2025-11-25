
import React, { useState, useRef, useEffect } from 'react';
import { INITIAL_MESSAGES, INITIAL_MODULES, PARTNER_PRESETS } from './constants';
import { Message, ModuleItem, PartnerType, EstimationStep, ProjectScale } from './types';
import { ChatInterface } from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';
import { Icons } from './components/Icons';
import { StepIndicator } from './components/StepIndicator';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [modules, setModules] = useState<ModuleItem[]>(INITIAL_MODULES);
  
  // Partner Type State
  const [currentPartnerType, setCurrentPartnerType] = useState<PartnerType>('STUDIO');
  const multipliers = PARTNER_PRESETS[currentPartnerType];

  // Estimation Step Flow State
  const [estimationStep, setEstimationStep] = useState<EstimationStep>('SCOPE');
  const [currentScale, setCurrentScale] = useState<ProjectScale>('STANDARD');

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);

  // Apply Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const handleResize = (e: React.MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 300 && newWidth < 800) {
        setSidebarWidth(newWidth);
      }
    }
  };

  const handleToggleModule = (id: string) => {
    setModules(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, isSelected: !m.isSelected };
      }
      return m;
    }));
  };

  const handleToggleSubFeature = (moduleId: string, subId: string) => {
    setModules(prev => prev.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          subFeatures: m.subFeatures.map(s => s.id === subId ? { ...s, isSelected: !s.isSelected } : s)
        };
      }
      return m;
    }));
  };

  const applyPartnerType = (type: PartnerType) => {
    setCurrentPartnerType(type);
    
    if (type === 'AI_NATIVE') {
       setModules(prev => prev.map(m => ({
          ...m,
          subFeatures: m.subFeatures.map(s => 
             (s.name.includes('SSO') || s.name.includes('DRM') || s.name.includes('WebRTC')) 
             ? { ...s, isSelected: false } 
             : s
          )
       })));
    } else if (type === 'AGENCY') {
       setModules(prev => prev.map(m => ({
          ...m,
          isSelected: m.required ? true : m.isSelected,
          subFeatures: m.subFeatures.map(s => 
             s.name.includes('Admin') ? { ...s, isSelected: true } : s
          )
       })));
    }
  };

  const handleScaleChange = (scale: ProjectScale) => {
    setCurrentScale(scale);
    // Logic to select modules based on scale
    if (scale === 'MVP') {
        setModules(prev => prev.map(m => ({
            ...m,
            isSelected: m.required ? true : false,
            subFeatures: m.subFeatures.map(s => ({ ...s, isSelected: s.id.endsWith('1') })) // Activate only first subfeature
        })));
    } else if (scale === 'STANDARD') {
        setModules(INITIAL_MODULES); // Reset to defaults
    } else if (scale === 'HIGH_END') {
        setModules(prev => prev.map(m => ({
            ...m,
            isSelected: true,
            subFeatures: m.subFeatures.map(s => ({ ...s, isSelected: true })) // All on
        })));
    }
  };

  return (
    <div className={`h-screen w-screen flex flex-col font-sans bg-white dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-50 transition-colors duration-300`}>
      
      {/* Resizing Overlay */}
      {isResizing && (
        <div 
          className="fixed inset-0 z-[100] cursor-col-resize bg-transparent"
          onMouseMove={handleResize}
          onMouseUp={stopResizing}
          onMouseLeave={stopResizing}
        />
      )}

      {/* Minimal Header */}
      <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-30 shrink-0 relative transition-colors duration-300">
        {/* Left: Brand Only */}
        <div className="flex items-center gap-4 lg:gap-8 flex-shrink-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white hidden sm:block">Wishket Estimate</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex-1 flex items-center justify-end gap-6 lg:gap-8">
            <div className="hidden md:block">
              <StepIndicator />
            </div>

            <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
              </button>
              
              <button 
                onClick={() => { 
                    setModules(INITIAL_MODULES); 
                    setCurrentPartnerType('STUDIO'); 
                    setEstimationStep('SCOPE'); // Reset flow
                }}
                className="p-2 text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Reset"
              >
                <Icons.Refresh size={16} />
              </button>
              <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                KM
              </div>
            </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        <div 
          className="h-full z-20 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex-shrink-0 relative transition-colors duration-300"
          style={{ width: sidebarWidth }}
        >
          <ChatInterface 
            messages={messages} 
            setMessages={setMessages}
            modules={modules}
            setModules={setModules}
          />
        </div>

        <div
          className={`w-1 hover:w-1.5 cursor-col-resize hover:bg-indigo-500 transition-all z-40 flex-shrink-0 relative group flex items-center justify-center -ml-[1px] ${isResizing ? 'bg-indigo-500 w-1.5' : 'bg-transparent'}`}
          onMouseDown={startResizing}
        >
           <div className={`w-0.5 h-8 rounded-full transition-colors ${isResizing ? 'bg-white' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-white'}`} />
        </div>

        <div className="flex-1 h-full bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
          <Dashboard 
            modules={modules} 
            setModules={setModules}
            onToggleModule={handleToggleModule}
            onToggleSubFeature={handleToggleSubFeature}
            currentPartnerType={currentPartnerType}
            onSelectPartnerType={applyPartnerType}
            multipliers={multipliers}
            estimationStep={estimationStep}
            onStepChange={setEstimationStep}
            currentScale={currentScale}
            onScaleChange={handleScaleChange}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
