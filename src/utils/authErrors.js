const MESSAGES = {
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/invalid-email": "Esse e-mail não parece válido.",
  "auth/email-already-in-use": "Já existe uma conta com esse e-mail.",
  "auth/weak-password": "Use uma senha com pelo menos 6 caracteres.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "auth/network-request-failed": "Sem conexão. Verifique sua internet e tente novamente.",
  "auth/user-disabled": "Esta conta foi desativada.",
};

export function getAuthErrorMessage(err, fallback = "Algo deu errado. Tente novamente.") {
  return MESSAGES[err?.code] || fallback;
}
