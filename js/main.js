const KEY = "contacthub";
let contacts = load(), editId = null;
const $ = s => document.querySelector(s);
const modal = $("#modal");
const fields = { name: $("#name"), phone: $("#phone"), email: $("#email") };
const rules = {
  name: v => v.trim().length >= 2,
  phone: v => /^01[0125][0-9]{8}$/.test(v.trim()),
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
};
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
function persist() { localStorage.setItem(KEY, JSON.stringify(contacts)); }
function toast(icon, title) { Swal.fire({ toast: true, position: "top-end", icon, title, showConfirmButton: false, timer: 1800 }); }
const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const init = c => esc(c.name.trim()[0].toUpperCase());

const mini = c => `<div class="mini"><div class="av">${init(c)}</div><div><b>${esc(c.name)}</b><span>${esc(c.phone)}</span></div><a href="tel:${esc(c.phone)}" aria-label="Call"><i class="fa-solid fa-phone"></i></a></div>`;

function render() {
  const q = $("#search").value.trim().toLowerCase();
  const shown = contacts.filter(c => !q || [c.name, c.phone, c.email].some(v => v.toLowerCase().includes(q)));
  const favs = contacts.filter(c => c.fav), emgs = contacts.filter(c => c.emg);
  $("#sTotal").textContent = contacts.length;
  $("#sFav").textContent = favs.length;
  $("#sEmg").textContent = emgs.length;
  $("#sub").textContent = `Manage and organize your ${contacts.length} contacts`;
  $("#favList").innerHTML = favs.length ? favs.map(mini).join("") : '<p class="none">No favorites yet</p>';
  $("#emgList").innerHTML = emgs.length ? emgs.map(mini).join("") : '<p class="none">No emergency contacts</p>';

  $("#list").innerHTML = shown.length ? shown.map(c => `
    <article class="card">
      <div class="av">${init(c)}</div>
      <div class="info"><b>${esc(c.name)}</b><span><i class="fa-solid fa-phone"></i> ${esc(c.phone)}</span><span><i class="fa-solid fa-envelope"></i> ${esc(c.email)}</span></div>
      <div class="acts">
        <a class="call" href="tel:${esc(c.phone)}" aria-label="Call"><i class="fa-solid fa-phone"></i></a>
        <a class="mail" href="mailto:${esc(c.email)}" aria-label="Email"><i class="fa-solid fa-envelope"></i></a>
        <button class="fav ${c.fav ? "on" : ""}" data-fav="${c.id}" aria-label="Toggle favorite"><i class="fa-solid fa-star"></i></button>
        <button class="emg ${c.emg ? "on" : ""}" data-emg="${c.id}" aria-label="Toggle emergency"><i class="fa-solid fa-heart-pulse"></i></button>
        <button data-edit="${c.id}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
        <button class="del" data-del="${c.id}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    </article>`).join("")
  : `<div class="empty"><div class="box"><i class="fa-solid fa-address-book"></i></div><b>No contacts found</b><span>Click "Add Contact" to get started</span></div>`;
}

function openModal(c) {
  editId = c ? c.id : null;
  $("#mTitle").textContent = c ? "Edit Contact" : "Add Contact";
  fields.name.value = c ? c.name : "";
  fields.phone.value = c ? c.phone : "";
  fields.email.value = c ? c.email : "";
  Object.values(fields).forEach(f => f.classList.remove("bad"));
  modal.classList.add("open");
  fields.name.focus();
}
const closeModal = () => modal.classList.remove("open");
function validate() {
  let ok = true;
  for (const k in fields) {
    const good = rules[k](fields[k].value);
    fields[k].classList.toggle("bad", !good);
    if (!good) ok = false;
  }
  return ok;
}

$("#addBtn").onclick = () => openModal();
$("#cancel").onclick = closeModal;
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
Object.values(fields).forEach(f => f.addEventListener("input", () => f.classList.remove("bad")));

$("#save").onclick = () => {
  if (!validate()) return;
  const data = { name: fields.name.value.trim(), phone: fields.phone.value.trim(), email: fields.email.value.trim() };
  if (contacts.some(c => c.phone === data.phone && c.id !== editId)) {
    fields.phone.classList.add("bad");
    return Swal.fire({ icon: "error", title: "Duplicate number", text: "A contact with this phone number already exists." });
  }
  if (editId) {
    contacts = contacts.map(c => c.id === editId ? { ...c, ...data } : c);
    toast("success", "Contact updated");
  } else {
    contacts.unshift({ id: Date.now().toString(), fav: false, emg: false, ...data });
    toast("success", "Contact added");
  }
  persist(); closeModal(); render();
};

$("#list").addEventListener("click", async e => {
  const t = e.target.closest("button");
  if (!t) return;
  const d = t.dataset;
  if (d.fav || d.emg) {
    const c = contacts.find(x => x.id === (d.fav || d.emg));
    const k = d.fav ? "fav" : "emg";
    c[k] = !c[k];
    persist(); render();
    toast("success", d.fav ? (c.fav ? "Added to favorites" : "Removed from favorites") : (c.emg ? "Added to emergency" : "Removed from emergency"));
  } else if (d.edit) {
    openModal(contacts.find(x => x.id === d.edit));
  } else if (d.del) {
    const r = await Swal.fire({ title: "Are you sure?", text: "This contact will be deleted.", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#e11d48", confirmButtonText: "Yes, delete" });
    if (r.isConfirmed) {
      contacts = contacts.filter(x => x.id !== d.del);
      persist(); render();
      toast("success", "Contact deleted");
    }
  }
});
$("#search").addEventListener("input", render);
render();
