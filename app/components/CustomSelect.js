"use client";
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

export default function CustomSelect({ options, value, onChange, placeholder = "Select an option", className = "" }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full px-4 py-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all duration-200
                    ${isOpen ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}
                `}
            >
                <div className="flex flex-col items-start truncate overflow-hidden">
                    <span className={`text-sm truncate font-medium ${selectedOption ? 'text-white' : 'text-[var(--text-dim)]'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    {selectedOption?.subLabel && (
                        <span className="text-xs text-[var(--text-dim)] truncate">
                            {selectedOption.subLabel}
                        </span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 text-[var(--text-dim)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Options */}
            <div
                className={`
                    absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden text-sm
                    origin-top transition-all duration-200 ease-out
                    ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-[-10px] pointer-events-none'}
                `}
            >
                <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                    {options.map((option) => {
                        const isSelected = option.value === value;
                        const isCustom = option.isCustom;

                        return (
                            <div
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`
                                    px-4 py-3 cursor-pointer flex items-center justify-between transition-colors
                                    ${isSelected ? 'bg-blue-600/20 text-blue-400' : 'text-[var(--text-dim)] hover:bg-white/10 hover:text-white'}
                                    ${isCustom ? 'text-orange-400 font-bold hover:bg-orange-900/20' : ''}
                                `}
                            >
                                <div className="flex flex-col">
                                    <span className={isSelected ? 'font-semibold' : ''}>{option.label}</span>
                                    {option.subLabel && <span className="text-xs opacity-60 font-normal">{option.subLabel}</span>}
                                </div>
                                {isSelected && <Check className="w-4 h-4 ml-2" />}
                                {isCustom && !isSelected && <Plus className="w-4 h-4 ml-2" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Backdrop for mobile */}
            {isOpen && <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setIsOpen(false)} />}
        </div>
    );
}
