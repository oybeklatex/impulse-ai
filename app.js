
import { createClient } from
  "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL =
  "https://cjuwonjnpbcieyktmrjx.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_E5R31rnk2irKuDCLeGNmHQ_pVvFUzPL";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const main = document.querySelector("main");

const auth = document.createElement("section");
auth.className = "card";
auth.style.marginBottom = "20px";

auth.innerHTML = `
  <h2>IMPULSE akkaunti</h2>
  <input id="email" type="email"
    placeholder="Email manzilingiz"
    style="display:block;width:100%;padding:13px;margin:10px 0;border-radius:8px">
  <input id="password" type="password"
    placeholder="Parol"
    style="display:block;width:100%;padding:13px;margin:10px 0;border-radius:8px">
  <button id="signup">Ro‘yxatdan o‘tish</button>
  <button id="login">Kirish</button>
  <button id="logout" style="display:none">Chiqish</button>
  <p id="authStatus" class="sub"></p>
`;

main.prepend(auth);

const status = document.getElementById("authStatus");

async function refreshSession() {
  const { data } = await supabase.auth.getSession();
  const loggedIn = !!data.session;

  document.getElementById("signup").style.display =
    loggedIn ? "none" : "inline-block";

  document.getElementById("login").style.display =
    loggedIn ? "none" : "inline-block";

  document.getElementById("logout").style.display =
    loggedIn ? "inline-block" : "none";

  status.textContent = loggedIn
    ? "Tizimga kirdingiz: " + data.session.user.email
    : "Tizimga kirish yoki ro‘yxatdan o‘tish kerak.";
}

document.getElementById("signup").onclick = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || password.length < 8) {
    status.textContent =
      "Email kiriting. Parol kamida 8 belgidan iborat bo‘lsin.";
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  status.textContent = error
    ? error.message
    : "Ro‘yxatdan o‘tish so‘rovi yuborildi. Emailingizni tekshiring.";
};

document.getElementById("login").onclick = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  status.textContent = error
    ? error.message
    : "Muvaffaqiyatli kirdingiz.";

  await refreshSession();
};

document.getElementById("logout").onclick = async () => {
  await supabase.auth.signOut();
  await refreshSession();
};

await refreshSession();

supabase.auth.onAuthStateChange(() => {
  refreshSession();
});
