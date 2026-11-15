
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://cjuwonjnpbcieyktmrjx.supabase.co";
const SUPABASE_KEY = "sb_publishable_E5R31rnk2irKuDCLeGNmHQ_pVvFUzPL";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const main = document.querySelector("main");

const auth = document.createElement("section");
auth.className = "card";
auth.style.marginBottom = "20px";
auth.innerHTML = `
  <h2>IMPULSE akkaunti</h2>
  <input id="email" type="email" placeholder="Email"
    style="display:block;width:100%;padding:13px;margin:10px 0">
  <input id="password" type="password" placeholder="Parol"
    style="display:block;width:100%;padding:13px;margin:10px 0">
  <button id="signup">Ro‘yxatdan o‘tish</button>
  <button id="login">Kirish</button>
  <button id="logout" style="display:none">Chiqish</button>
  <p id="authStatus" class="sub"></p>
`;
main.prepend(auth);

const status = document.getElementById("authStatus");

const projectSection = document.createElement("section");
projectSection.className = "card";
projectSection.style.marginTop = "20px";
projectSection.innerHTML = `
  <h2>📁 Mening loyihalarim</h2>
  <input id="projectTitle" type="text" placeholder="Loyiha nomi"
    style="display:block;width:100%;padding:13px;margin:10px 0">
  <button id="createProject">+ Yangi loyiha yaratish</button>
  <p id="projectStatus" class="sub"></p>
  <div id="projectList"></div>
`;
main.append(projectSection);

const projectStatus = document.getElementById("projectStatus");
const projectList = document.getElementById("projectList");

let currentUser = null;
let selectedProject = null;

async function showProjectFiles(project, item) {
  const oldList = item.querySelector(".project-files");
  if (oldList) oldList.remove();

  const list = document.createElement("div");
  list.className = "project-files";
  list.style.marginTop = "12px";
  list.textContent = "Fayllar yuklanmoqda...";
  item.append(list);

  const { data: files, error } = await supabase
    .from("documents")
    .select("file_name,file_type,storage_path,created_at")
    .eq("project_id", project.id)
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    list.textContent = "Xatolik: " + error.message;
    return;
  }

  list.innerHTML = "";

  if (!files.length) {
    list.textContent = "Bu loyihada fayllar yo‘q.";
    return;
  }

  for (const file of files) {
    const { data, error: urlError } = await supabase.storage
      .from("impulse-files")
      .createSignedUrl(file.storage_path, 3600);

    const row = document.createElement("p");

    if (urlError) {
      row.textContent = file.file_name + " — ochib bo‘lmadi";
    } else {
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "📄 " + file.file_name;
      link.style.color = "#8bbaff";
      row.append(link);
    }

    list.append(row);
  }
}

async function refreshSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    status.textContent = error.message;
    return;
  }

  currentUser = data.session?.user || null;

  document.getElementById("signup").style.display =
    currentUser ? "none" : "inline-block";
  document.getElementById("login").style.display =
    currentUser ? "none" : "inline-block";
  document.getElementById("logout").style.display =
    currentUser ? "inline-block" : "none";

  status.textContent = currentUser
    ? "Tizimga kirdingiz: " + currentUser.email
    : "Tizimga kirish yoki ro‘yxatdan o‘tish kerak.";

  projectSection.style.display = currentUser ? "block" : "none";

  if (currentUser) await loadProjects();
  else {
    projectList.innerHTML = "";
    selectedProject = null;
  }
}

document.getElementById("signup").onclick = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || password.length < 8) {
    status.textContent = "Email kiriting. Parol kamida 8 belgidan iborat bo‘lsin.";
    return;
  }

  const { error } = await supabase.auth.signUp({ email, password });
  status.textContent = error
    ? error.message
    : "Ro‘yxatdan o‘tish so‘rovi yuborildi. Emailingizni tekshiring.";
};

document.getElementById("login").onclick = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) status.textContent = error.message;
  await refreshSession();
};

document.getElementById("logout").onclick = async () => {
  await supabase.auth.signOut();
  await refreshSession();
};

document.getElementById("createProject").onclick = async () => {
  if (!currentUser) return;

  const title = document.getElementById("projectTitle").value.trim();
  if (!title) {
    projectStatus.textContent = "Loyiha nomini kiriting.";
    return;
  }

  projectStatus.textContent = "Saqlanmoqda...";

  const { error } = await supabase.from("projects").insert({
    user_id: currentUser.id,
    title,
    status: "created"
  });

  if (error) {
    projectStatus.textContent = "Xatolik: " + error.message;
    return;
  }

  document.getElementById("projectTitle").value = "";
  projectStatus.textContent = "Loyiha saqlandi.";
  await loadProjects();
};

async function loadProjects() {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from("projects")
    .select("id,title,status,created_at")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    projectStatus.textContent = "Loyihalarni yuklash xatosi: " + error.message;
    return;
  }

  projectList.innerHTML = "";

  if (!data.length) {
    projectList.textContent = "Hozircha loyihalar yo‘q.";
    return;
  }

  data.forEach(project => {
    const item = document.createElement("div");
    item.className = "agent";
    item.style.marginTop = "10px";

    const name = document.createElement("b");
    name.textContent = project.title;

    const info = document.createElement("p");
    info.className = "sub";
    info.textContent = "Holati: " + (project.status || "created");

    const choose = document.createElement("button");
    choose.textContent = "Fayl yuklash";
    const showFiles = document.createElement("button");
showFiles.textContent = "📂 Yuklangan fayllar";
showFiles.onclick = () => showProjectFiles(project, item);

item.append(showFiles);
    choose.onclick = () => {
      selectedProject = project;
      document.getElementById("projectFile").click();
    };

    item.append(name, info, choose);
    projectList.append(item);
  });
}

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.id = "projectFile";
fileInput.accept = ".pdf,image/png,image/jpeg";
fileInput.style.display = "none";
projectSection.append(fileInput);

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  fileInput.value = "";

  if (!file || !currentUser || !selectedProject) return;

  const allowed = [
    "application/pdf",
    "image/png",
    "image/jpeg"
  ];

  if (!allowed.includes(file.type)) {
    projectStatus.textContent = "Faqat PDF, PNG yoki JPEG fayl mumkin.";
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    projectStatus.textContent = "Fayl hajmi 20 MB dan oshmasin.";
    return;
  }

  projectStatus.textContent = "Fayl yuklanmoqda...";

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${currentUser.id}/${selectedProject.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("impulse-files")
    .upload(path, file);

  if (uploadError) {
    projectStatus.textContent = "Yuklash xatosi: " + uploadError.message;
    return;
  }

  const { error: insertError } = await supabase.from("documents").insert({
    project_id: selectedProject.id,
    user_id: currentUser.id,
    file_name: file.name,
    file_type: file.type,
    storage_path: path
  });

  if (insertError) {
    projectStatus.textContent =
      "Fayl saqlandi, lekin hujjat qaydi yaratilmadi: " + insertError.message;
    return;
  }

  projectStatus.textContent = "Fayl muvaffaqiyatli yuklandi!";
});

await refreshSession();

supabase.auth.onAuthStateChange(() => {
  refreshSession();
});
window.askImpulseAI = async function(prompt) {
  try {
    const response = await fetch("/.netlify/functions/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI bilan bog‘lanishda xatolik");
    }

    return data.answer;
  } catch (error) {
    console.error("IMPULSE AI:", error);
    throw error;
  }
};
