"use client";

import React, { useEffect, useRef } from "react";

export const SmoothCursor = () => {
    const cursorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;

        let mouseX = -100;
        let mouseY = -100;
        let cursorX = -100;
        let cursorY = -100;

        const onMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const animate = () => {
            // Smoothly interpolate cursor position with a liquid feel
            const easing = 0.12;
            cursorX += (mouseX - cursorX) * easing;
            cursorY += (mouseY - cursorY) * easing;

            if (cursor) {
                cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
            }

            requestAnimationFrame(animate);
        };

        window.addEventListener("mousemove", onMouseMove);
        const animationId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div
            ref={cursorRef}
            className="pointer-events-none fixed left-0 top-0 z-[10000] h-8 w-8 -ml-4 -mt-4 rounded-full border-2 border-orange-500/80 mix-blend-difference transition-opacity duration-300"
        />
    );
};
