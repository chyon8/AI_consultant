import React, { useState } from 'react';
import { Icons } from './Icons';

interface SidebarSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: { id: string; label: string; badge?: string }[];
}

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ isCollapsed, onToggle }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['outsourcing', 'resident', 'other']);

  const sections: SidebarSection[] = [
    {
      id: 'outsourcing',
      title: '외주',
      icon: Icons.External,
      items: [
        { id: 'project-based', label: '프로젝트 단위', badge: '12' },
        { id: 'maintenance', label: '유지보수', badge: '5' },
        { id: 'consulting', label: '컨설팅', badge: '3' },
      ]
    },
    {
      id: 'resident',
      title: '상주',
      icon: Icons.Building,
      items: [
        { id: 'fulltime', label: '풀타임', badge: '8' },
        { id: 'parttime', label: '파트타임', badge: '4' },
        { id: 'hybrid', label: '하이브리드', badge: '6' },
      ]
    },
    {
      id: 'other',
      title: '나머지',
      icon: Icons.More,
      items: [
        { id: 'education', label: '교육/멘토링' },
        { id: 'audit', label: '코드 리뷰/감사' },
        { id: 'support', label: '기술 지원' },
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div 
      className={`h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            카테고리
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ml-auto"
        >
          {isCollapsed ? <Icons.Right size={16} /> : <Icons.Left size={16} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {sections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const SectionIcon = section.icon;
          
          return (
            <div key={section.id} className="mb-1">
              <button
                onClick={() => !isCollapsed && toggleSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={isCollapsed ? section.title : undefined}
              >
                <SectionIcon size={18} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {section.title}
                    </span>
                    <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      <Icons.Down size={14} className="text-slate-400" />
                    </div>
                  </>
                )}
              </button>

              {!isCollapsed && (
                <div 
                  className={`overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      className="w-full flex items-center justify-between pl-10 pr-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
