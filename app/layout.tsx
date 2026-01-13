import type React from "react";

import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Site } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
    title: Site.Home.title,
    description: Site.Home.description,
    authors: Site.Authors,
    icons: {
        icon: [
            {
                url: "/icon.svg",
                type: "image/svg+xml",
            },
        ],
    },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className={`font-sans antialiased bg-background text-foreground`}>
                {children}
                <Analytics />
            </body>
        </html>
    );
}
