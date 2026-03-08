"use client";
import React, { useRef, useState } from "react";

export default function BubbleButton({
    children,
    onClick,
    className = "",
    active = false,
    baseColor = "bg-white/5",
    activeColor = "bg-white/10"
}) {
    const buttonRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = (e) => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <button
            ref={buttonRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all duration-300 z-10 w-full hover:scale-[1.02] transform-gpu backdrop-blur-md border ${active
                ? 'border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-emerald-500/10'
                : `border-white/10 text-gray-300 ${baseColor} shadow-lg`
                } ${className}`}
        >
            {/* Background radial gradient that follows the mouse (Water Bubble Effect) */}
            <div
                className={`absolute pointer-events-none transition-opacity duration-500 rounded-full blur-xl ${isHovering ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    width: '120px',
                    height: '120px',
                    left: mousePosition.x - 60,
                    top: mousePosition.y - 60,
                    background: active ? 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                    zIndex: -1
                }}
            />

            {/* Subtle shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none z-[-1]" />

            {/* Button Content */}
            <span className="relative z-10 flex items-center justify-center gap-2 w-full">
                {children}
            </span>
        </button>
    );
}
