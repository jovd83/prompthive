"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";

interface DashboardLayoutClientProps {
    children: React.ReactNode;
    sidebarProps: any; // Passing all props for Sidebar
}

export default function DashboardLayoutClient({
    children,
    sidebarProps
}: DashboardLayoutClientProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-background text-foreground flex-col md:flex-row">
            <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

            <Sidebar
                {...sidebarProps}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-60px)] md:h-screen">
                {children}
            </main>
        </div>
    );
}
