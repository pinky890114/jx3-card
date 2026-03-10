import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, ArrowLeft, Check } from "lucide-react";
import { motion } from "motion/react";
import { useCart, Card } from "../context/CartContext";

const SERIES_1_TABS = ["SE", "SP", "BP", "ER", "UR", "QR", "SR", "R"];
const SERIES_2_TABS = [
  "SE",
  "SP",
  "LR",
  "BP",
  "ER",
  "QR",
  "同心卡",
  "鋒芒卡",
  "R",
];

export default function Series() {
  const { id } = useParams<{ id: string }>();
  const seriesId = parseInt(id || "1", 10);
  const tabs = seriesId === 1 ? SERIES_1_TABS : SERIES_2_TABS;

  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const { cart, addToCart, removeFromCart } = useCart();

  useEffect(() => {
    fetchCards();
  }, [seriesId, activeTab]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/cards?series=${seriesId}&rarity=${encodeURIComponent(activeTab)}`,
      );
      const data = await res.json();
      setCards(data);
    } catch (error) {
      console.error("Failed to fetch cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCart = (card: Card) => {
    if (card.stock <= 0) return;
    const inCart = cart.some((c) => c.id === card.id);
    if (inCart) {
      removeFromCart(card.id);
    } else {
      addToCart(card);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold">
              第{seriesId === 1 ? "一" : "二"}彈
            </h1>
          </div>

          <Link
            to="/checkout"
            className="relative p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-teal-500 text-white text-xs font-bold rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
                {cart.length}
              </span>
            )}
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex space-x-2 py-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "bg-white text-zinc-900"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            此分類目前沒有卡片
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {cards.map((card) => {
              const inCart = cart.some((c) => c.id === card.id);
              const outOfStock = card.stock <= 0;

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => toggleCart(card)}
                  className={`relative group rounded-xl overflow-hidden bg-zinc-800 border-2 transition-all cursor-pointer ${
                    inCart
                      ? "border-teal-500"
                      : outOfStock
                        ? "border-zinc-800 opacity-50 cursor-not-allowed"
                        : "border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <div className="aspect-[3/4] bg-zinc-900 relative">
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {inCart && (
                      <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-lg">
                          <Check className="w-6 h-6" />
                        </div>
                      </div>
                    )}
                    {outOfStock && !inCart && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="px-4 py-2 bg-red-500/80 text-white font-bold rounded-lg rotate-[-12deg]">
                          售完
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-white truncate">
                      {card.name}
                    </h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-zinc-400">
                        {card.rarity}
                      </span>
                      <span
                        className={`text-sm font-bold ${outOfStock ? "text-red-400" : "text-teal-400"}`}
                      >
                        餘量: {card.stock}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-900 via-zinc-900 to-transparent z-50">
          <div className="max-w-md mx-auto">
            <Link
              to="/checkout"
              className="w-full flex items-center justify-between bg-teal-500 hover:bg-teal-600 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-teal-500/20 transition-all transform hover:scale-[1.02]"
            >
              <span>已選擇 {cart.length} 張卡片</span>
              <span>前往結帳 &rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
