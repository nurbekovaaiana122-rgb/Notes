// Notes app with localStorage, delete, theme, autosave, export/import, animations
const KEY = 'notes_app_v2';
let notes = JSON.parse(localStorage.getItem(KEY) || '[]');
let currentId = null;

// elements
const notesList = document.getElementById('notesList');
const newBtn = document.getElementById('newBtn');
const search = document.getElementById('search');
const noteTitle = document.getElementById('noteTitle');
const noteBody = document.getElementById('noteBody');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const themeBtn = document.getElementById('themeBtn');
const autosaveToggle = document.getElementById('autosaveToggle');

function saveToStorage(){ localStorage.setItem(KEY, JSON.stringify(notes)); }

function renderList(filter=''){
  notesList.innerHTML = '';
  const filtered = notes.filter(n => (n.title + ' ' + n.body).toLowerCase().includes(filter.toLowerCase()));
  if(filtered.length === 0){
    notesList.innerHTML = '<div class="note-item empty">Нет заметок. Нажми + чтобы создать новую.</div>';
    return;
  }
  filtered.sort((a,b)=>b.updated - a.updated);
  filtered.forEach(n => {
    const li = document.createElement('li');
    li.className = 'note-item fade-in';
    li.dataset.id = n.id;
    li.innerHTML = `<div class="note-title">${escapeHtml(n.title || 'Без названия')}</div>
                    <div class="note-snippet">${escapeHtml((n.body||'').replace(/\n/g,' ').slice(0,120))}</div>
                    <div class="note-meta">${new Date(n.updated).toLocaleString()}</div>`;
    li.addEventListener('click', ()=> openNote(n.id));
    notesList.appendChild(li);
  });
}

function openNote(id){
  const n = notes.find(x=>x.id===id);
  if(!n) return;
  currentId = id;
  noteTitle.value = n.title;
  noteBody.value = n.body;
}

function newNote(){
  const id = 'id_' + Date.now();
  const n = {id, title:'', body:'', created:Date.now(), updated:Date.now()};
  notes.push(n);
  currentId = id;
  saveToStorage();
  renderList(search.value);
  openNote(id);
  noteTitle.focus();
}

function saveCurrent(){
  if(!currentId){ alert('Нет выбранной заметки'); return; }
  const n = notes.find(x=>x.id===currentId);
  if(!n) return;
  n.title = noteTitle.value;
  n.body = noteBody.value;
  n.updated = Date.now();
  saveToStorage();
  renderList(search.value);
}

function deleteCurrent(){
  if(!currentId){ alert('Нет выбранной заметки'); return; }
  if(!confirm('Удалить заметку?')) return;
  notes = notes.filter(x=>x.id!==currentId);
  currentId = null;
  noteTitle.value = '';
  noteBody.value = '';
  saveToStorage();
  renderList(search.value);
}

function exportNotes(){
  const data = JSON.stringify(notes, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'notes.json';
  document.body.appendChild(a); a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importNotesFile(file){
  const reader = new FileReader();
  reader.onload = ()=> {
    try{
      const imported = JSON.parse(reader.result);
      if(Array.isArray(imported)){
        const map = new Map(notes.map(n=>[n.id,n]));
        imported.forEach(im=>{
          if(!im.id) im.id = 'id_' + Date.now() + Math.random().toString(36).slice(2,7);
          map.set(im.id, im);
        });
        notes = Array.from(map.values());
        saveToStorage();
        renderList();
        alert('Импорт выполнен');
      } else alert('Неверный формат');
    }catch(e){ alert('Ошибка при чтении файла'); }
  };
  reader.readAsText(file);
}

function escapeHtml(s){ return (s||'').replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[c]); }

// events
newBtn.addEventListener('click', newNote);
document.getElementById('saveBtn').addEventListener('click', ()=>{ saveCurrent(); alert('Сохранено'); });
deleteBtn.addEventListener('click', deleteCurrent);
exportBtn.addEventListener('click', exportNotes);
importBtn.addEventListener('click', ()=> importFile.click());
importFile.addEventListener('change',(e)=> { if(e.target.files[0]) importNotesFile(e.target.files[0]); });

search.addEventListener('input', ()=> renderList(search.value));
noteTitle.addEventListener('input', ()=> { if(autosaveToggle.checked) saveCurrent(); });
noteBody.addEventListener('input', ()=> { if(autosaveToggle.checked) saveCurrent(); });

// theme
function loadTheme(){
  const t = localStorage.getItem('notes_theme') || 'light';
  if(t==='dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
}
themeBtn.addEventListener('click', ()=> {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('notes_theme', isDark ? 'dark' : 'light');
});

// init
loadTheme();
renderList();
