import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { motion } from "motion/react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            補卡超人上線了
          </h1>
          <p className="text-zinc-400">請選擇要瀏覽的彈數</p>
        </div>

        <div className="grid gap-4">
          <Link
            to="/series/1"
            className="group relative overflow-hidden rounded-2xl bg-zinc-800/50 p-8 text-center border border-zinc-700/50 hover:border-teal-500/50 hover:bg-zinc-800 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-2xl font-semibold text-white relative z-10">
              第一彈
            </h2>
          </Link>

          <Link
            to="/series/2"
            className="group relative overflow-hidden rounded-2xl bg-zinc-800/50 p-8 text-center border border-zinc-700/50 hover:border-teal-500/50 hover:bg-zinc-800 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-2xl font-semibold text-white relative z-10">
              第二彈
            </h2>
          </Link>
        </div>
      </motion.div>

      <Link
        to="/admin"
        className="absolute bottom-8 text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <Lock className="w-5 h-5" />
      </Link>
    </div>
  );
}
