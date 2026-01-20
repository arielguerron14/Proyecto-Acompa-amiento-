import mongoose from "mongoose";

export const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 Micro-Maestros: MongoDB conectado");
  } catch (e) {
    console.error("❌ Error conectando MongoDB (Maestros):", e);
  }
};
