// Tumble.tv — simple SPA using TMDB
// Read TMDB API key from build-time env (Vite) or fallback to the demo key
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '1eb2d1f1be09e5f625af0f295eed2a15';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const APP = document.getElementById('app');
const templateHome = document.getElementById('home-template');
const templateList = document.getElementById('list-template');
const templateDetails = document.getElementById('details-template');
const templateAuth = document.getElementById('auth-template');

let state = {
  route: '/',
  type: 'movie',
  pageIdx: 1, // page of 100
  itemsCache: [],
  loggedInUser: null
};

// Simple router
function router(){
  const hash = location.hash.replace('#','') || '/';
  const parts = hash.split('/').filter(Boolean);
  if(parts.length === 0){return renderHome();}
  const [route, sub] = parts;
  if(route === 'movies') return renderList('movie');
  if(route === 'shows') return renderList('tv');
  if(route === 'login') return renderAuth('login');
  if(route === 'register') return renderAuth('register');
  if(route === 'library') return renderLibrary();
  if(route === 'about') return renderAbout();
  if(route === 'pro') return renderPro();
  if(route === 'terms') return renderTerms();
  if(route === 'contact') return renderContact();
  if(route === 'privacy') return renderPrivacy();
  return renderHome();
}

// Helpers
async function tmdbFetch(path, params={}){
  params.api_key = TMDB_API_KEY;
  const qs = new URLSearchParams(params);
  const res = await fetch(`https://api.themoviedb.org/3/${path}?${qs}`);
  if(!res.ok) throw new Error('TMDB error');
  return res.json();
}

function el(html){const div = document.createElement('div');div.innerHTML = html.trim();return div.firstElementChild;}

function renderHome(){APP.innerHTML = '';
  const node = templateHome.content.cloneNode(true);
  APP.appendChild(node);
  loadTrending();
}

async function loadTrending(){
  try{
    const t = await tmdbFetch('trending/all/day',{language:'en-US',page:1});
    const list = document.getElementById('trending-list');
    list.innerHTML = '';
    t.results.slice(0,8).forEach(item=>{
      const poster = item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : '';
      const card = el(`<div class="card"><img src="${poster}" alt="${item.title||item.name}" data-id="${item.id}" data-type="${item.media_type}" class="poster-thumb"/><div><small>${item.title||item.name}</small></div></div>`);
      list.appendChild(card);
    });
    document.querySelectorAll('.poster-thumb').forEach(img=>img.addEventListener('click',()=>openDetails(img.dataset.type,img.dataset.id)));
  }catch(e){console.error(e)}
}

async function renderList(type){
  state.type = type;
  APP.innerHTML = '';
  const node = templateList.content.cloneNode(true);
  APP.appendChild(node);

  const sortBy = document.getElementById('sort-by');
  const orderBy = document.getElementById('order-by');
  const genreFilter = document.getElementById('genre-filter');
  const serviceFilter = document.getElementById('service-filter');
  const yearFilter = document.getElementById('year-filter');
  const resultsCount = document.getElementById('results-count');
  const itemsGrid = document.getElementById('items-grid');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const pageInput = document.getElementById('page-input');
  const pageGo = document.getElementById('page-go');
  const totalPagesEl = document.getElementById('total-pages');
  const resetBtn = document.getElementById('reset-filters');
  const itemsPerPageLabel = document.getElementById('items-per-page');

  pageInfo.textContent = `Page ${state.pageIdx}`;

  // prepare genres
  const genresData = await tmdbFetch(`${type}/genre/list`,{language:'en-US'}).catch(()=>({genres:[]}));
  genreFilter.innerHTML = '<option value="">All</option>' + genresData.genres.map(g=>`<option value="${g.id}">${g.name}</option>`).join('');

  // years
  const yearOptions = Array.from({length:40}).map((_,i)=>{const y = new Date().getFullYear()-i;return `<option value="${y}">${y}</option>`}).join('');
  yearFilter.innerHTML = '<option value="">All</option>'+yearOptions;

  // services (basic list)
  const SERVICES = {'Netflix':8,'Hulu':15,'Amazon Prime Video':119,'Disney+':337};
  serviceFilter.innerHTML = '<option value="">All</option>' + Object.keys(SERVICES).map(k=>`<option value="${SERVICES[k]}">${k}</option>`).join('');

  const PER_PAGE = 100; // show 100 items per app page
  const TMDB_PER_PAGE = 20; // TMDB returns 20 items per page
  const TMDB_PAGES_PER_APP_PAGE = PER_PAGE / TMDB_PER_PAGE; // 5

  async function loadPage(){
    itemsGrid.innerHTML = '<p>Loading...</p>';
    resultsCount.textContent = 'Loading...';

    const items = [];
    const sortParam = sortBy.value + (orderBy.value === 'asc' ? '.asc' : '.desc');

    try{
      // compute which TMDB pages we need for the current app page
      const startTmdbPage = (state.pageIdx - 1) * TMDB_PAGES_PER_APP_PAGE + 1;
      const requests = [];
      for(let i=0;i<TMDB_PAGES_PER_APP_PAGE;i++){
        const p = startTmdbPage + i;
        requests.push(tmdbFetch(`discover/${type}`,{language:'en-US',page:p,sort_by:sortParam,with_genres:genreFilter.value||undefined,primary_release_year: yearFilter.value||undefined,first_air_date_year: yearFilter.value||undefined,with_watch_providers: serviceFilter.value||undefined,watch_region:'US'}).catch(()=>({results:[],total_results:0})));
      }

      const pages = await Promise.all(requests);
      pages.forEach((pg)=>items.push(...(pg.results||[])));

      // use total_results from the first page to know total available
      const totalResults = pages[0] && (pages[0].total_results || pages[0].total_results === 0) ? pages[0].total_results : items.length;
      const totalPages = Math.max(1, Math.ceil(totalResults / PER_PAGE));

      // slice to exactly PER_PAGE just in case
      const final = items.slice(0, PER_PAGE);

      resultsCount.textContent = `${totalResults} results — showing ${final.length} (100 per page)`;
      // Update page indicators
      totalPagesEl.textContent = totalPages;
      pageInput.value = state.pageIdx;

      itemsGrid.innerHTML = '';
      final.forEach(it=>{
        const poster = it.poster_path ? `${IMAGE_BASE}${it.poster_path}` : '';
        const card = el(`<div class="card"><img src="${poster}" alt="${it.title||it.name}" data-id="${it.id}" data-type="${type}" class="poster-thumb"/><div><small>${it.title||it.name}</small></div></div>`);
        itemsGrid.appendChild(card);
      });
      document.querySelectorAll('.poster-thumb').forEach(img=>img.addEventListener('click',()=>openDetails(img.dataset.type,img.dataset.id)));

      // update buttons
      prevBtn.disabled = state.pageIdx <= 1;
      nextBtn.disabled = state.pageIdx >= totalPages;

    }catch(e){itemsGrid.innerHTML='<p>Failed to load</p>';resultsCount.textContent='Failed';console.error(e)}
  }

  [sortBy, orderBy, genreFilter, serviceFilter, yearFilter].forEach(i=>i.addEventListener('change',()=>{state.pageIdx=1;loadPage();}));
  prevBtn.addEventListener('click',()=>{if(state.pageIdx>1){state.pageIdx--; loadPage();}});
  nextBtn.addEventListener('click',()=>{state.pageIdx++; loadPage();});

  // Jump-to-page support
  pageGo.addEventListener('click',()=>{
    const val = parseInt(pageInput.value || '1',10);
    if(isNaN(val) || val < 1) return alert('Please enter a valid page >= 1');
    state.pageIdx = Math.min(Math.max(1, val), parseInt(totalPagesEl.textContent||'1',10));
    loadPage();
  });
  pageInput.addEventListener('keyup',(e)=>{ if(e.key === 'Enter') pageGo.click(); });

  resetBtn.addEventListener('click',()=>{
    // reset filters to show all movies/shows
    sortBy.value = 'popularity.desc';
    orderBy.value = 'desc';
    genreFilter.value = '';
    serviceFilter.value = '';
    yearFilter.value = '';
    state.pageIdx = 1;
    loadPage();
  });

  itemsPerPageLabel.textContent = '100 per page';

  loadPage();
}

async function openDetails(type,id){
  // fetch details, providers, reviews
  const modalNode = templateDetails.content.cloneNode(true);
  document.body.appendChild(modalNode);
  const modal = document.getElementById('details-modal');
  const close = document.getElementById('close-details');
  close.addEventListener('click',()=>modal.remove());

  const details = await tmdbFetch(`${type}/${id}`,{language:'en-US'}).catch(()=>null);
  const prov = await tmdbFetch(`${type}/${id}/watch/providers`).catch(()=>({}));
  const rev = await tmdbFetch(`${type}/${id}/reviews`,{language:'en-US'}).catch(()=>({results:[]}));
  if(!details){document.getElementById('details-title').textContent='Not found';return}

  document.getElementById('details-backdrop').style.backgroundImage = details.backdrop_path ? `url(${IMAGE_BASE}${details.backdrop_path})` : '';
  document.getElementById('details-poster').src = details.poster_path ? `${IMAGE_BASE}${details.poster_path}` : '';
  document.getElementById('details-title').textContent = details.title || details.name;
  document.getElementById('details-overview').textContent = details.overview || '';
  document.getElementById('details-release').textContent = details.release_date || details.first_air_date || 'N/A';
  document.getElementById('details-genres').textContent = (details.genres||[]).map(g=>g.name).join(', ');

  // providers (US)
  const providers = (prov.results && prov.results.US && (prov.results.US.flatrate||prov.results.US.rent||prov.results.US.buy)) ? [].concat(prov.results.US.flatrate||[],prov.results.US.rent||[],prov.results.US.buy||[]).map(p=>p.provider_name) : [];
  document.getElementById('details-providers').textContent = providers.join(', ') || 'None listed';

  const reviewsEl = document.getElementById('details-reviews');
  reviewsEl.innerHTML = rev.results.length ? rev.results.map(r=>`<div class="card"><strong>${r.author}</strong><p>${r.content.slice(0,280)}</p></div>`).join('') : '<p>No reviews yet</p>';

  // account actions
  const actions = document.getElementById('account-actions');
  actions.innerHTML = '';
  const user = currentUser();
  function mkBtn(txt,cls,cb){const b=document.createElement('button');b.textContent=txt;b.className=cls;b.addEventListener('click',cb);actions.appendChild(b);}
  if(user){
    mkBtn('Mark as watched','',()=>{toggleUserList(user,'watched',type,id,details.title||details.name);alert('Marked watched');});
    mkBtn('Like','',()=>{toggleUserList(user,'likes',type,id,details.title||details.name);alert('Liked');});
    mkBtn('Add to watchlist','',()=>{toggleUserList(user,'watchlist',type,id,details.title||details.name);alert('Added to watchlist');});
    mkBtn('Write a review','',()=>{const t=prompt('Your review'); if(t) addReviewToUser(user,id,type,t);});
    mkBtn('Add to list','',()=>{const lname = prompt('List name'); if(lname) addToNamedList(user,lname,type,id,details.title||details.name);});
  }else{
    actions.innerHTML = '<small><a href="#/login">Log in</a> to save actions</small>';
  }
}

function toggleUserList(username,key,type,id,title){
  const users = JSON.parse(localStorage.getItem('tumble_users')||'{}');
  users[username] = users[username]||{watchlist:[],likes:[],watched:[],lists:{},reviews:[]};
  const list = users[username][key];
  const idx = list.findIndex(i=>i.id==id && i.type==type);
  if(idx>=0) list.splice(idx,1); else list.push({id,type,title});
  localStorage.setItem('tumble_users',JSON.stringify(users));
}
function addToNamedList(username,listName,type,id,title){
  const users = JSON.parse(localStorage.getItem('tumble_users')||'{}');
  users[username] = users[username]||{watchlist:[],likes:[],watched:[],lists:{},reviews:[]};
  users[username].lists[listName] = users[username].lists[listName]||[];
  users[username].lists[listName].push({id,type,title});
  localStorage.setItem('tumble_users',JSON.stringify(users));
}
function addReviewToUser(username,id,type,content){
  const users = JSON.parse(localStorage.getItem('tumble_users')||'{}');
  users[username] = users[username]||{watchlist:[],likes:[],watched:[],lists:{},reviews:[]};
  users[username].reviews.push({id,type,content,date:new Date().toISOString()});
  localStorage.setItem('tumble_users',JSON.stringify(users));
}

// Auth
function renderAuth(mode){APP.innerHTML=''; const node = templateAuth.content.cloneNode(true); APP.appendChild(node); document.getElementById('auth-title').textContent = mode==='register'? 'Create new account' : 'Login';
  const form = document.getElementById('auth-form'); form.addEventListener('submit',(e)=>{e.preventDefault(); const u=document.getElementById('auth-username').value; const p=document.getElementById('auth-password').value; if(mode==='register'){register(u,p)}else{login(u,p)}});
}
function register(username,password){ if(!username) return alert('Username required'); const users = JSON.parse(localStorage.getItem('tumble_users')||'{}'); if(users[username]) return alert('User exists'); users[username]={password,watchlist:[],likes:[],watched:[],lists:{},reviews:[]}; localStorage.setItem('tumble_users',JSON.stringify(users)); login(username,password); }
function login(username,password){ const users = JSON.parse(localStorage.getItem('tumble_users')||'{}'); if(!users[username]||users[username].password!==password) return alert('Invalid'); localStorage.setItem('tumble_session',username); updateNav(); location.hash='#/library'; }
function currentUser(){return localStorage.getItem('tumble_session');}
function updateNav(){const u = currentUser(); if(u){document.getElementById('nav-login').style.display='none';document.getElementById('nav-register').style.display='none';document.getElementById('nav-library').style.display='inline-block'}else{document.getElementById('nav-login').style.display='inline-block';document.getElementById('nav-register').style.display='inline-block';document.getElementById('nav-library').style.display='none'}}

function renderLibrary(){APP.innerHTML=''; const u = currentUser(); if(!u) {APP.innerHTML='<p>Please <a href="#/login">log in</a> to view your library.</p>';return}
  const users = JSON.parse(localStorage.getItem('tumble_users')||'{}'); const data = users[u]||{};
  const html = `<section><h2>${u}\'s Library</h2><div class="library-sections">
    <h3>Watchlist</h3><div id="lib-watchlist" class="cards-grid"></div>
    <h3>Likes</h3><div id="lib-likes" class="cards-grid"></div>
    <h3>Watched</h3><div id="lib-watched" class="cards-grid"></div>
    <h3>Lists</h3><div id="lib-lists"></div>
    <h3>Reviews</h3><div id="lib-reviews"></div>
  </div></section>`;
  APP.innerHTML = html;
  function renderListItems(elId,list){const el = document.getElementById(elId); el.innerHTML = ''; (list||[]).forEach(i=>{const card = el(`<div class="card"><img src="https://image.tmdb.org/t/p/w200${i.poster_path||''}" alt="${i.title||i.name}" /><div><small>${i.title||i.name||i.title}</small></div></div>`); el.appendChild(card)});
  }
  // we only have id/type/title saved. Fetch details to show posters.
  ['watchlist','likes','watched'].forEach(async(key)=>{
    const list = data[key]||[];
    const containers = {watchlist:'lib-watchlist',likes:'lib-likes',watched:'lib-watched'};
    const out = document.getElementById(containers[key]); out.innerHTML = '<p>Loading...</p>';
    const items = [];
    for(const it of list){ try{ const d = await tmdbFetch(`${it.type}/${it.id}`,{language:'en-US'}); items.push(d);}catch(e){}}
    out.innerHTML = '';
    items.forEach(d=>{const c = el(`<div class="card"><img src="${d.poster_path?IMAGE_BASE+d.poster_path:''}"/><div><small>${d.title||d.name}</small></div></div>`); c.querySelector('img').addEventListener('click',()=>openDetails(d.media_type||(d.title? 'movie':'tv'),d.id)); out.appendChild(c)});
  });

  // lists
  const listsEl = document.getElementById('lib-lists'); listsEl.innerHTML=''; for(const L in data.lists||{}){ const items = data.lists[L]; const section = el(`<div><h4>${L}</h4><div class="cards-grid" id="list-${L}"></div></div>`); listsEl.appendChild(section); const target = section.querySelector('.cards-grid'); items.forEach(async(i)=>{ try{const d=await tmdbFetch(`${i.type}/${i.id}`); const c = el(`<div class="card"><img src="${d.poster_path?IMAGE_BASE+d.poster_path:''}"/><div><small>${d.title||d.name}</small></div></div>`); c.querySelector('img').addEventListener('click',()=>openDetails(i.type,i.id)); target.appendChild(c);}catch(e){} }); }

  const reviewsEl = document.getElementById('lib-reviews'); reviewsEl.innerHTML = (data.reviews||[]).map(r=>`<div class="card"><strong>${r.type} #${r.id}</strong><p>${r.content}</p></div>`).join('') || '<p>No reviews</p>';
}

// static pages
function renderAbout(){APP.innerHTML=`<section><h2>About</h2><h3>FAQ</h3><p>Q: What is Tumble.tv? A: A lightweight tracker/demo built with TMDB APIs.</p></section>`}
function renderPro(){APP.innerHTML=`<section><h2>Pro</h2><p>Upgrade to Pro to unlock advanced features (this is a demo).</p></section>`}
function renderTerms(){APP.innerHTML=`<section><h2>Terms</h2><p>Terms of service: demo content only.</p></section>`}
function renderContact(){APP.innerHTML=`<section><h2>Contact</h2><p>Email: hello@tumble.tv</p></section>`}
function renderPrivacy(){APP.innerHTML=`<section><h2>Privacy</h2><p>Privacy: demo only. We store local data in browser localStorage.</p></section>`}

// Search
const searchInput = document.getElementById('search-input'); const searchBtn = document.getElementById('search-btn');
searchBtn.addEventListener('click',async()=>{const q = searchInput.value.trim(); if(!q) return; APP.innerHTML='<p>Searching...</p>'; const [m,t] = await Promise.all([tmdbFetch('search/movie',{query:q}),tmdbFetch('search/tv',{query:q})]); const results = (m.results||[]).slice(0,50).map(r=>({...r,type:'movie'})).concat((t.results||[]).slice(0,50).map(r=>({...r,type:'tv'})));
  APP.innerHTML = `<section><h2>Search results for "${q}" (${results.length})</h2><div class="cards-grid" id="search-grid"></div></section>`;
  const grid = document.getElementById('search-grid'); results.forEach(it=>{const p = it.poster_path?IMAGE_BASE+it.poster_path:''; const c = el(`<div class="card"><img src="${p}" data-id="${it.id}" data-type="${it.type}" class="poster-thumb"/><div><small>${it.title||it.name}</small></div></div>`); grid.appendChild(c)});
  document.querySelectorAll('.poster-thumb').forEach(img=>img.addEventListener('click',()=>openDetails(img.dataset.type,img.dataset.id)));
});

// init
window.addEventListener('hashchange',router); updateNav(); router();

// bind logo
document.getElementById('logo-link').addEventListener('click',e=>{location.hash='/';e.preventDefault();router();});
