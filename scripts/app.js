/* Wedase Mariam web‑app JS */
let currentPage   = 1;
const totalPages  = 300;        // ←‑‑ update to real page count
document.getElementById('pageMax').textContent = `/ ${totalPages}`;

/* NEW globals for hit‑navigation */
let searchHits  = [];  // array of page numbers with the query
let hitIndex    = -1;  // pointer inside searchHits
let searchQuery = '';  // current query

/* NEW global for language */
let language = localStorage.getItem('wedase-lang') || 'amharic';

/* NEW global for font size */
let fontSize = parseInt(localStorage.getItem('wedase-fontSize')) || 20;

/* =============== On load =============== */
document.addEventListener('DOMContentLoaded', () => {
  // 1. restore theme & font
  initTheme();  initFont(); initFontSize();

  // 2. bookmark
  const saved = localStorage.getItem('wedase-bookmark');
  if (saved) currentPage = +saved;

  loadPage(currentPage);
  loadSections();

  /* UI hooks */
  el('themeToggle').addEventListener('click', toggleTheme);
  el('fontSelect') .addEventListener('change', switchFont);

  el('nextBtn').addEventListener('click', () => nav(1));
  el('prevBtn').addEventListener('click', () => nav(-1));

  el('pageInput').addEventListener('change', e=>{
    const p = +e.target.value;
    if (p>=1 && p<=totalPages){ currentPage=p; loadPage(p);}
    else e.target.value = currentPage;
  });

  el('searchBtn')     .addEventListener('click', searchText);
  el('prevMatchBtn')  .addEventListener('click', prevHit);
  el('nextMatchBtn')  .addEventListener('click', nextHit);

  el('audioBtn').addEventListener('click', togglePlay);

  el('bookmarkBtn').addEventListener('click', () =>{
    localStorage.setItem('wedase-bookmark', currentPage);
    alert(`ገፁ ተያዘ: ${currentPage}`);
  });

  el('langToggle').textContent = language === 'amharic' ? 'ግዕዝ' : 'አማርኛ';
  el('langToggle').addEventListener('click', () => {
    language = language === 'amharic' ? 'geez' : 'amharic';
    localStorage.setItem('wedase-lang', language);
    el('langToggle').textContent = language === 'amharic' ? 'ግዕዝ' : 'አማርኛ';
    loadPage(currentPage);
  });

  el('fontIncrease').addEventListener('click', () => {
    fontSize = Math.min(fontSize + 2, 48);
    el('pageContent').style.fontSize = `${fontSize}px`;
    localStorage.setItem('wedase-fontSize', fontSize);
  });
  el('fontDecrease').addEventListener('click', () => {
    fontSize = Math.max(fontSize - 2, 12);
    el('pageContent').style.fontSize = `${fontSize}px`;
    localStorage.setItem('wedase-fontSize', fontSize);
  });

  el('year').textContent = new Date().getFullYear();
});

/* =============== Helpers =============== */
const el = id => document.getElementById(id);

// grab first two words of a text blob
function firstTwoWords(raw){
  return raw.trim().split(/\s+/).slice(0,2).join(' ');
}

function initFontSize() {
  el('pageContent').style.fontSize = `${fontSize}px`;
}

/* =============== Load page =============== */
function loadPage(page, highlight = null) {
  const prefix = language === 'amharic' ? 'a' : '';
  const txt = `pages/${prefix}page${page}.txt`;
  const mp3 = `voices/${prefix}page${page}.mp3`;

  fetch(txt)
    .then(r => r.ok ? r.text() : Promise.reject())
    .then(text => {
      if (highlight) {
        const safeQuery = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(safeQuery, 'gi');
        text = text.replace(regex, match => `<span class="highlight">${match}</span>`);
      }

      el('pageContent').innerHTML = text;

      // Instead of flex, use padding & min-height to simulate vertical centering
      const pc = el('pageContent');
      pc.style.display = 'block';             // important
      pc.style.minHeight = '70vh';            // keep min height
      pc.style.paddingTop = '15vh';           // vertical centering simulation
      pc.style.lineHeight = '2';
      pc.style.fontSize = `${fontSize}px`;
      pc.style.textAlign = 'center';          // optional
      pc.style.whiteSpace = 'pre-wrap';       // preserve text flow

      loadAudio(mp3);
      el('pageInput').value = page;
      updateNavBtns();
    })
    .catch(() => {
      el('pageContent').textContent = 'ማንበብ አልተቻለም።';
      loadAudio(null);
    });
}



/* =============== Audio =============== */
function loadAudio(src){
  const audio = el('audio');
  audio.src = src || '';
  audio.load();
  el('audioBtn').textContent = '▶️';
}
function togglePlay(){
  const audio = el('audio');
  if (!audio.src) return;
  if (audio.paused){
    audio.play().then(()=>{ el('audioBtn').textContent='⏸️'; }).catch(()=>{});
  }else{
    audio.pause(); el('audioBtn').textContent='▶️';
  }
}

/* =============== Navigation =============== */
function nav(step){
  const next = currentPage + step;
  if (next<1 || next>totalPages) return;
  currentPage = next;
  loadPage(next);
}
function updateNavBtns(){
  el('prevBtn').disabled = currentPage===1;
  el('nextBtn').disabled = currentPage===totalPages;
}

/* =============== Search with hit navigation + sidebar list =============== */
async function searchText(){
  searchQuery = el('searchInput').value.trim();
  const box   = el('searchResults');
  box.innerHTML = '';

  /* reset state & sidebar list */
  searchHits = []; hitIndex = -1;
  el('prevMatchBtn').disabled = true;
  el('nextMatchBtn').disabled = true;
  el('matchList').innerHTML   = '';
  el('matchHeader').style.display = 'none';

  if (!searchQuery) return;

  /* fetch all pages in parallel and collect matches */
  const prefix = language === 'amharic' ? 'a' : '';
  const jobs = [];
  for (let i=1; i<=totalPages; i++){
    jobs.push(
      fetch(`pages/${prefix}page${i}.txt`)
        .then(r=>r.text())
        .then(text=>({page:i,text}))
    );
  }
  const pages = await Promise.all(jobs);
  pages.forEach(p=>{
    if (p.text.includes(searchQuery)) searchHits.push(p.page);
  });

  if (searchHits.length){
    hitIndex = 0;
    el('prevMatchBtn').disabled = false;
    el('nextMatchBtn').disabled = false;

    // build sidebar list
    el('matchHeader').style.display = 'block';
    const list = el('matchList');
    searchHits.forEach(pg=>{
      fetch(`pages/${prefix}page${pg}.txt`)
        .then(r=>r.text())
        .then(txt=>{
          const li = document.createElement('li');
          const a  = document.createElement('a');
          a.href='#';
          a.textContent = firstTwoWords(txt);
          a.onclick = e=>{e.preventDefault(); hitIndex = searchHits.indexOf(pg); gotoHit();};
          li.appendChild(a);
          list.appendChild(li);
        });
    });

    // jump to first hit
    gotoHit();
  }else{
    box.innerHTML = '<div>ትክክለኛ ውሂብ አልተገኘም።</div>';
  }
}

function gotoHit(){
  if (hitIndex<0 || hitIndex>=searchHits.length){
    el('searchResults').innerHTML = '<div>ሌሎች ውጤቶች አይደሉም።</div>';
    return;
  }
  const page = searchHits[hitIndex];
  currentPage = page;
  loadPage(page, searchQuery);
  el('pageInput').value = page;
}

function prevHit(){
  if (!searchHits.length) return;
  hitIndex = (hitIndex - 1 + searchHits.length) % searchHits.length;
  gotoHit();
}
function nextHit(){
  if (!searchHits.length) return;
  hitIndex = (hitIndex + 1) % searchHits.length;
  gotoHit();
}

/* =============== Theme & Font =============== */
function toggleTheme(){
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  el('themeToggle').textContent = dark?'☀️':'🌙';
  localStorage.setItem('wedase-theme', dark?'dark':'light');
}
function initTheme(){
  const saved = localStorage.getItem('wedase-theme') || 'light';
  if (saved==='dark') document.body.classList.add('dark');
  el('themeToggle').textContent = saved==='dark'?'☀️':'🌙';
}

function switchFont(){
  const v = el('fontSelect').value;
  document.body.classList.remove('font-noto','font-abyssinica');
  document.body.classList.add(v==='noto'?'font-noto':'font-abyssinica');
  localStorage.setItem('wedase-font', v);
}
function initFont(){
  const saved = localStorage.getItem('wedase-font') || 'noto';
  el('fontSelect').value = saved;
  switchFont();
}

/* =============== Sections =============== */
function loadSections(){
  const sections = {
    "ዕለታዊ ጸሎቶች": 1,
    "ማርያን": 4,
    "ቅዱሳን": 7
  };
  const list = el('sectionList');
  for (const [label,page] of Object.entries(sections)){
    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href='#'; a.textContent=label;
    a.onclick = e=>{e.preventDefault(); currentPage=page; loadPage(page); };
    li.appendChild(a); list.appendChild(li);
  }
}
