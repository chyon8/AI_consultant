import React, { useState, useRef, useEffect } from 'react';
import { ThemeType } from '../types';
import { THEMES } from '../constants';
import { Icons } from './Icons';

interface ThemeSelectorProps {
  currentTheme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeKeys = Object.keys(THEMES) as ThemeType[];
  const current = THEMES[currentTheme];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Theme Selector"
      >
        <div 
          className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-700 shadow-sm"
          style={{ background: `linear-gradient(135deg, ${current.primary}, ${current.secondary})` }}
        />
        <Icons.Down size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Color Theme</p>
          </div>
          
          {themeKeys.map((themeKey) => {
            const theme = THEMES[themeKey];
            const isActive = currentTheme === themeKey;
            
            return (
              <button
                key={themeKey}
                onClick={() => {
                  onThemeChange(themeKey);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors ${
                  isActive 
                    ? 'bg-slate-50 dark:bg-slate-800' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div 
                  className="w-8 h-8 rounded-lg shadow-sm flex items-center justify-center text-sm"
                  style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
                >
                  {theme.emoji}
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                    {theme.name}
                  </p>
                  <div className="flex gap-1 mt-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.secondary }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accent }} />
                  </div>
                </div>
                {isActive && (
                  <Icons.CheckMark size={16} className="text-slate-900 dark:text-white" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
