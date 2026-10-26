import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// ⚠️ use same config as your app
const firebaseConfig = {
  apiKey: "AIzaSyB-xy9LsTWq8J1kO4VD1xrLaCHHYnwUXqU",
  authDomain: "guaiaca-cd777.firebaseapp.com",
  projectId: "guaiaca-cd777",
  storageBucket: "guaiaca-cd777.firebasestorage.app",
  messagingSenderId: "471165652507",
  appId: "1:471165652507:web:09d9a969377ab7a3a632be"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Income categories first, then the expense taxonomy. Existing projects are
// moved onto this list by functions/scripts/migrateCategories.js
const categories = [
  "Salário",
  "Receita de negócios",
  "Investimentos",
  "Reembolsos",
  "Moradia",
  "Alimentação",
  "Restaurantes e delivery",
  "Transporte",
  "Veículo",
  "Saúde",
  "Academia e esportes",
  "Cuidados pessoais",
  "Lazer e entretenimento",
  "Viagens",
  "Assinaturas",
  "Educação",
  "Pets",
  "Presentes e doações",
  "Família e filhos",
  "Impostos e taxas",
  "Compras",
  "Empréstimos e dívidas",
  "Outros",
];

const normalize = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_");

async function seed() {
  for (const name of categories) {
    await addDoc(collection(db, "categories"), {
      name,
      key: normalize(name),
      createdAt: new Date(),
    });

    console.log("Added:", name);
  }

  console.log("✅ Done");
}

seed();