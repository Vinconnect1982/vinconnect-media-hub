import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"VINCONNECT Media Hub",description:"Secure AI-powered media creation and publishing for VINCONNECT.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-AU"><body>{children}</body></html>}
