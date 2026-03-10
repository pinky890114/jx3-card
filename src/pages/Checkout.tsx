import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2, CheckCircle2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { motion } from "motion/react";

export default function Checkout() {
  const { cart, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nickname: "",
    contact: "",
    pickup_name: "",
    phone: "",
    store_711: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: cart.map((c) => c.id),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "下單失敗");
      }

      setSuccess(true);
      clearCart();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-teal-500/20"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white">下單成功！</h1>
        <p className="text-zinc-400 max-w-sm">
          感謝您的購買，我們會盡快處理您的訂單。請留意您的聯絡方式。
        </p>
        <Link
          to="/"
          className="mt-8 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
        >
          返回首頁
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">結帳</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {cart.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            購物車是空的
            <div className="mt-4">
              <Link to="/" className="text-teal-500 hover:text-teal-400">
                去逛逛
              </Link>
            </div>
          </div>
        ) : (
          <>
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                已選卡片 ({cart.length})
              </h2>
              <div className="space-y-3">
                {cart.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-4 bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/50"
                  >
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="w-16 h-20 object-cover rounded-lg bg-zinc-900"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">
                        {card.name}
                      </h3>
                      <p className="text-sm text-zinc-400 mt-1">
                        第{card.series}彈 • {card.rarity}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(card.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-white">收件資訊</h2>
              <form
                id="checkout-form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-400">
                      暱稱
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.nickname}
                      onChange={(e) =>
                        setFormData({ ...formData, nickname: e.target.value })
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                      placeholder="您的暱稱"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-400">
                      聯絡方式 (Line/IG/FB)
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.contact}
                      onChange={(e) =>
                        setFormData({ ...formData, contact: e.target.value })
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                      placeholder="Line ID 或 IG 帳號"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-400">
                      取貨姓名
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.pickup_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pickup_name: e.target.value,
                        })
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                      placeholder="真實姓名"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-400">
                      聯絡電話
                    </label>
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                      placeholder="0912345678"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-zinc-400">
                      7-11 門市名稱/店號
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.store_711}
                      onChange={(e) =>
                        setFormData({ ...formData, store_711: e.target.value })
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                      placeholder="例如：鑫台北門市 或 123456"
                    />
                  </div>
                </div>
              </form>
            </section>
          </>
        )}
      </main>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-900 via-zinc-900 to-transparent z-50">
          <div className="max-w-3xl mx-auto">
            <button
              form="checkout-form"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-teal-500 hover:bg-teal-600 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-teal-500/20 transition-all"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "確認送出訂單"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
