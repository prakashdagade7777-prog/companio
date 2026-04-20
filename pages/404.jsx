// pages/404.jsx
import Link from 'next/link';
import { motion } from 'framer-motion';
import Head from 'next/head';

export default function NotFoundPage() {
  return (
    <>
      <Head><title>Page Not Found – Companio</title></Head>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="font-display font-black text-[10rem] leading-none text-gradient opacity-20 mb-4 select-none">404</div>
          <h1 className="font-display font-bold text-3xl text-white mb-3">Page Not Found</h1>
          <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/" className="btn-primary px-8 py-3">Go Home</Link>
            <Link href="/companions" className="btn-ghost px-8 py-3">Browse Companions</Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
