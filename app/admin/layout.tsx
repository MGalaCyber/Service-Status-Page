import { Metadata } from "next";
import { Site } from "@/lib/config";

export const metadata: Metadata = {
    title: Site.Admin.title,
    description: Site.Admin.description,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <div suppressHydrationWarning>{children}</div>;
}
