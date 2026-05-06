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

const categories = [
  "Salário",
  "Receita de negócios",
  "Investimentos",
  "Reembolsos",
  "Condomínio",
  "Energia elétrica",
  "Água",
  "Gás",
  "Internet",
  "Manutenção",
  "Telefone",
  "Impostos",
  "Supermercado",
  "Restaurantes",
  "Bares",
  "Transporte",
  "Compras",
  "Cuidados Pessoais",
  "Doações & Presentes",
  "Saúde & Bem-estar",
  "Assinaturas",
  "Viagens",
  "Entretenimento & Lazer",
  "Tarifas bancárias",
  "Empréstimos / financiamentos",
  "Educação",
  "Família & Filhos",
  "Animais de Estimação",
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