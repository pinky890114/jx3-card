import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Save, Package, ListOrdered, Trash2, LogOut } from "lucide-react";
import { Card } from "../context/CartContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, onAuthStateChanged, User, signOut } from "firebase/auth";

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

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"cards" | "orders">("cards");
  const [cards, setCards] = useState<Card[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // New Card Form
  const [series, setSeries] = useState(1);
  const [rarity, setRarity] = useState("SE");
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [stock, setStock] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      if (activeTab === "cards") {
        fetchCards();
      } else {
        fetchOrders();
      }
    }
  }, [activeTab, user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login Error:", error);
      setAdminError("登入失敗: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Logout Error:", error);
    }
  };

  const fetchCards = async () => {
    const res = await fetch("/api/cards");
    const data = await res.json();
    setCards(data);
  };

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    if (!imageFile && !imageUrl) {
      setAdminError("請上傳圖片或輸入圖片網址");
      return;
    }

    setIsAdding(true);
    setSuccessMessage(null);
    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        // Limit to 20MB to accommodate high-res mobile photos
        if (imageFile.size > 20 * 1024 * 1024) {
          throw new Error("圖片檔案太大了（上限 20MB）");
        }
        
        setUploadingImage(true);
        console.log("Uploading image:", imageFile.name, "Size:", imageFile.size);
        // Use a generic name if the mobile browser doesn't provide a good one
        const fileName = imageFile.name || `photo_${Date.now()}.jpg`;
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
        const fileRef = ref(storage, `cards/${Date.now()}_${sanitizedName}`);
        const uploadResult = await uploadBytes(fileRef, imageFile);
        console.log("Upload successful:", uploadResult.metadata.fullPath);
        finalImageUrl = await getDownloadURL(fileRef);
        console.log("Download URL:", finalImageUrl);
        setUploadingImage(false);
      }

      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          series,
          rarity,
          name,
          image_url: finalImageUrl,
          stock,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "伺服器儲存失敗");
      }

      setSuccessMessage("卡片已成功新增至庫存！");
      setName("");
      setImageUrl("");
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setStock(1);
      
      // Refresh the list
      await fetchCards();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Add Card Error:", error);
      setAdminError(error.message || "新增失敗，請檢查 Firebase 設定或網路連線");
    } finally {
      setIsAdding(false);
      setUploadingImage(false);
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      await fetch(`/api/cards/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      fetchCards();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteCard = async (id: string) => {
    setDeletingId(id);
    setAdminError(null);
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "刪除失敗");
      }
      await fetchCards();
      setConfirmDeleteId(null);
    } catch (error: any) {
      console.error(error);
      setAdminError(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchOrders();
    } catch (error) {
      console.error(error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white animate-pulse">載入中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">後台管理系統</h1>
            <p className="text-zinc-400">請先登入以繼續操作</p>
          </div>
          {adminError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
              {adminError}
            </div>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            使用 Google 帳號登入
          </button>
          <Link to="/" className="block text-sm text-zinc-500 hover:text-white transition-colors">
            返回首頁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            to="/"
            className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold flex-1">後台管理</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>登出</span>
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex border-t border-zinc-800">
          <button
            onClick={() => setActiveTab("cards")}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === "cards"
                ? "border-teal-500 text-teal-400"
                : "border-transparent text-zinc-400 hover:text-zinc-300"
            }`}
          >
            <Package className="w-4 h-4" />
            卡片管理
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === "orders"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-400 hover:text-zinc-300"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            訂單管理
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "cards" ? (
          <div className="space-y-8">
            <section className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700/50">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-500" />
                新增卡片
              </h2>
              {adminError && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex justify-between items-center">
                  <span>{adminError}</span>
                  <button onClick={() => setAdminError(null)} className="text-xs hover:underline">關閉</button>
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-4 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl text-sm flex justify-between items-center">
                  <span>{successMessage}</span>
                  <button onClick={() => setSuccessMessage(null)} className="text-xs hover:underline">關閉</button>
                </div>
              )}
              <form
                onSubmit={handleAddCard}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">
                    彈數
                  </label>
                  <select
                    value={series}
                    onChange={(e) => {
                      const s = parseInt(e.target.value, 10);
                      setSeries(s);
                      setRarity(s === 1 ? SERIES_1_TABS[0] : SERIES_2_TABS[0]);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value={1}>第一彈</option>
                    <option value={2}>第二彈</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">
                    稀有度
                  </label>
                  <select
                    value={rarity}
                    onChange={(e) => setRarity(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  >
                    {(series === 1 ? SERIES_1_TABS : SERIES_2_TABS).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-xs font-medium text-zinc-400">
                    卡片名稱
                  </label>
                  <input
                    required
                    type="text"
                    value={name ?? ""}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                    placeholder="輸入名稱"
                  />
                </div>

                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-xs font-medium text-zinc-400">
                    圖片 (可直接拍照或從相簿選擇)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                        setImageUrl("");
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-teal-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-500/10 file:text-teal-400 hover:file:bg-teal-500/20"
                  />
                  <div className="text-center text-xs text-zinc-500 my-1">或</div>
                  <input
                    type="url"
                    value={imageUrl ?? ""}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImageFile(null);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                    placeholder="輸入圖片網址 https://..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">
                    初始餘量
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={stock ?? 0}
                    onChange={(e) => setStock(parseInt(e.target.value, 10))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="lg:col-span-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:bg-zinc-700 text-white px-6 py-2 rounded-xl font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {uploadingImage ? "上傳圖片中..." : "儲存卡片"}
                  </button>
                </div>
              </form>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">
                現有卡片 ({cards.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700"
                  >
                    <div className="aspect-[3/4] bg-zinc-900">
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-white text-sm truncate flex-1">
                          {card.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          {confirmDeleteId === card.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteCard(card.id)}
                                disabled={deletingId === card.id}
                                className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                              >
                                {deletingId === card.id ? "..." : "確定"}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(card.id)}
                              className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                              title="刪除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-400">
                        第{card.series}彈 • {card.rarity}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">餘量:</span>
                        <input
                          type="number"
                          min="0"
                          value={card.stock ?? 0}
                          onChange={(e) =>
                            handleUpdateStock(
                              card.id,
                              parseInt(e.target.value, 10),
                            )
                          }
                          className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                目前沒有訂單
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-zinc-800/50 rounded-2xl border border-zinc-700/50 overflow-hidden"
                >
                  <div className="p-4 border-b border-zinc-700/50 flex flex-wrap items-center justify-between gap-4 bg-zinc-800/80">
                    <div>
                      <div className="text-sm text-zinc-400">
                        訂單編號 #{order.id}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>
                    <select
                      value={order.status ?? "pending"}
                      onChange={(e) =>
                        handleUpdateOrderStatus(order.id, e.target.value)
                      }
                      className={`text-sm font-medium px-3 py-1.5 rounded-lg border focus:outline-none ${
                        order.status === "completed"
                          ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                          : order.status === "cancelled"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}
                    >
                      <option
                        value="pending"
                        className="bg-zinc-800 text-white"
                      >
                        處理中
                      </option>
                      <option
                        value="completed"
                        className="bg-zinc-800 text-white"
                      >
                        已完成
                      </option>
                      <option
                        value="cancelled"
                        className="bg-zinc-800 text-white"
                      >
                        已取消
                      </option>
                    </select>
                  </div>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-white border-b border-zinc-700 pb-2">
                        買家資訊
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-zinc-400">暱稱:</div>
                        <div className="text-white">{order.nickname}</div>
                        <div className="text-zinc-400">聯絡方式:</div>
                        <div className="text-white">{order.contact}</div>
                        <div className="text-zinc-400">取貨姓名:</div>
                        <div className="text-white">{order.pickup_name}</div>
                        <div className="text-zinc-400">電話:</div>
                        <div className="text-white">{order.phone}</div>
                        <div className="text-zinc-400">7-11門市:</div>
                        <div className="text-white">{order.store_711}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-white border-b border-zinc-700 pb-2">
                        購買卡片 ({order.items?.length || 0})
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {order.items?.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-lg"
                          >
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-10 h-14 object-cover rounded bg-zinc-800"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white truncate">
                                {item.name}
                              </div>
                              <div className="text-xs text-zinc-500">
                                第{item.series}彈 • {item.rarity}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
