import type { Metadata } from 'next';
export const metadata: Metadata = {title:'ことのは — 自分で選べるAI対話',description:'伝える情報を確認してから、人柄でつながる。'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ja"><body>{children}</body></html>}
