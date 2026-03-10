import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  query, 
  where, 
  runTransaction, 
  orderBy 
} from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCHN8_5tK3Bdtg9MuWBAU5yTQ8q45bInLk",
  authDomain: "jx3-card.firebaseapp.com",
  projectId: "jx3-card",
  storageBucket: "jx3-card.firebasestorage.app",
  messagingSenderId: "274070165773",
  appId: "1:274070165773:web:af6ac8b3374dee147bb844",
  measurementId: "G-R2W1XJKEKV"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/cards", async (req, res) => {
    try {
      const { series, rarity } = req.query;
      let q: any = collection(db, "cards");
      const conditions: any[] = [];
      
      if (series) {
        conditions.push(where("series", "==", parseInt(series as string, 10)));
      }
      if (rarity) {
        conditions.push(where("rarity", "==", rarity));
      }
      
      if (conditions.length > 0) {
        q = query(q, ...conditions);
      }
      
      const snapshot = await getDocs(q);
      const cards = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      res.json(cards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/cards", async (req, res) => {
    try {
      const { series, rarity, name, image_url, stock } = req.body;
      const docRef = await addDoc(collection(db, "cards"), {
        series: parseInt(series, 10),
        rarity,
        name,
        image_url,
        stock: parseInt(stock, 10)
      });
      res.json({ id: docRef.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/cards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { stock } = req.body;
      await updateDoc(doc(db, "cards", id), { stock: parseInt(stock, 10) });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/cards/:id", async (req, res) => {
    const { id } = req.params;
    try {
      console.log(`Attempting to delete card: ${id}`);
      await deleteDoc(doc(db, "cards", id));
      console.log(`Successfully deleted card: ${id}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Error deleting card ${id}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { nickname, contact, pickup_name, phone, store_711, items } = req.body;
      
      // Group items by quantity
      const itemCounts: Record<string, number> = {};
      for (const id of items) {
        itemCounts[id] = (itemCounts[id] || 0) + 1;
      }

      const orderId = await runTransaction(db, async (transaction) => {
        // First check all stocks
        const cardRefs: any[] = Object.keys(itemCounts).map(id => doc(db, "cards", id));
        const cardDocs: any[] = await Promise.all(cardRefs.map(ref => transaction.get(ref)));
        
        for (let i = 0; i < cardDocs.length; i++) {
          const cardDoc = cardDocs[i];
          const requestedQty = itemCounts[cardDoc.id];
          if (!cardDoc.exists()) {
            throw new Error(`Card ${cardDoc.id} not found`);
          }
          const currentStock = cardDoc.data().stock;
          if (currentStock < requestedQty) {
            throw new Error(`Card ${cardDoc.id} is out of stock`);
          }
        }

        // Create order
        const newOrderRef = doc(collection(db, "orders"));
        transaction.set(newOrderRef, {
          nickname, 
          contact, 
          pickup_name, 
          phone, 
          store_711,
          status: 'pending',
          created_at: new Date().toISOString()
        });

        // Update stocks and create order items
        for (let i = 0; i < cardDocs.length; i++) {
          const cardDoc = cardDocs[i];
          const requestedQty = itemCounts[cardDoc.id];
          const currentStock = cardDoc.data().stock;
          
          transaction.update(cardDoc.ref, { stock: currentStock - requestedQty });
          
          const newItemRef = doc(collection(db, "order_items"));
          transaction.set(newItemRef, {
            order_id: newOrderRef.id,
            card_id: cardDoc.id,
            quantity: requestedQty
          });
        }
        
        return newOrderRef.id;
      });

      res.json({ success: true, orderId });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const ordersSnapshot = await getDocs(query(collection(db, "orders"), orderBy("created_at", "desc")));
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      
      const itemsSnapshot = await getDocs(collection(db, "order_items"));
      const allItems = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      
      const cardsSnapshot = await getDocs(collection(db, "cards"));
      const allCards = cardsSnapshot.docs.reduce((acc: any, doc) => {
        acc[doc.id] = { id: doc.id, ...(doc.data() as any) };
        return acc;
      }, {});

      const ordersWithItems = orders.map(order => {
        const orderItems = allItems
          .filter((item: any) => item.order_id === order.id)
          .map((item: any) => {
            const card = allCards[item.card_id] || {};
            return {
              ...item,
              name: card.name,
              image_url: card.image_url,
              rarity: card.rarity,
              series: card.series
            };
          });
        return { ...order, items: orderItems };
      });

      res.json(ordersWithItems);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await updateDoc(doc(db, "orders", id), { status });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
