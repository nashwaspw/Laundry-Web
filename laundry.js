/* ================================================================
   FRESHWAVE LAUNDRY — JAVASCRIPT GABUNGAN
   File: laundry.js

   BAGIAN:
     1.  Data Paket
     2.  State Aplikasi
     3.  Navigasi Halaman
     4.  Halaman Paket
     5.  BOOKING BARU: multi-paket, diskon, pembayaran, WA
     6.  Modal Login/Register (UPDATED VALIDATION MOCK)
     7.  Login & Register (UPDATED WITH VALIDATION & DB SIMULATION)
     8.  loginSuccess() & logout()
     9.  Tracking (update multi-paket)
     10. afterBooking()
     11. Inisialisasi
================================================================ */


/* ================================================================
   1. DATA PAKET
================================================================ */
const packages = {
  basic:   { name:'Basic Wash',        price:'Rp 7.000/kg',       tag:'Paket Standar',   title:'Basic Wash',        sub:'Solusi ekonomis untuk cucian harian berkualitas',                          priceStr:'Rp 7.000 <span>/ kg</span>',       priceNum:7000,   unit:'kg',    emoji:'🧺' },
  express: { name:'Express Wash',      price:'Rp 12.000/kg',      tag:'Paket Terpopuler',title:'Express Wash',      sub:'Layanan cuci kilat profesional untuk kebutuhan mendesak Anda',             priceStr:'Rp 12.000 <span>/ kg</span>',      priceNum:12000,  unit:'kg',    emoji:'⚡' },
  premium: { name:'Premium Care',      price:'Rp 25.000/item',    tag:'Paket Premium',   title:'Premium Care',      sub:'Perawatan terbaik untuk pakaian istimewa Anda',                            priceStr:'Rp 25.000 <span>/ item</span>',    priceNum:25000,  unit:'item',  emoji:'👔' },
  sepatu:  { name:'Cuci Sepatu',       price:'Rp 35.000/pasang',  tag:'Layanan Spesial', title:'Cuci Sepatu',       sub:'Kembalikan kilap sepatu kesayangan Anda',                                  priceStr:'Rp 35.000 <span>/ pasang</span>',  priceNum:35000,  unit:'pasang',emoji:'👟' },
  bed:     { name:'Bed & Bath',        price:'Rp 20.000/item',    tag:'Layanan Khusus',  title:'Bed & Bath',        sub:'Perawatan sprei, selimut, dan perlengkapan kamar mandi',                   priceStr:'Rp 20.000 <span>/ item</span>',    priceNum:20000,  unit:'item',  emoji:'🛏️'},
  monthly: { name:'Langganan Bulanan', price:'Rp 200.000/bulan',  tag:'Paket Hemat',     title:'Langganan Bulanan', sub:'Nikmati kemudahan laundry setiap bulan dengan harga terjangkau',           priceStr:'Rp 200.000 <span>/ bulan</span>',  priceNum:200000, unit:'bulan', emoji:'🗓️'}
};


/* ================================================================
   2. STATE APLIKASI
================================================================ */
let currentUser     = null;      /* null = belum login */
let selectedPkg     = 'express'; /* paket terakhir diklik */
let pendingAction   = null;      /* aksi tertunda sebelum login */
let currentOrderId  = null;      /* nomor order terakhir */
let isNewUser       = true;      /* true = dapat diskon 30% */
let cartItems       = {};        /* { pkgId: { qty, checked } } */
let selectedPayment = '';        /* metode pembayaran */

/* Simulasi database lokal untuk menyimpan user yang terdaftar */
let userDatabase = [
  { name: 'Budi Santoso', email: 'budi@gmail.com', phone: '081234567890', pass: 'password123' }
];


/* ================================================================
   3. NAVIGASI HALAMAN
================================================================ */
function goto(page) {
  const target = document.getElementById('page-' + page);
  if (!target) return;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  target.classList.add('active');

  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navMap = { home:'nav-home', packages:'nav-packages', tracking:'nav-tracking' };
  if (navMap[page]) { const el = document.getElementById(navMap[page]); if (el) el.classList.add('active'); }

  window.scrollTo(0, 0);
  if (page === 'booking') renderPkgChecklist();
}


/* ================================================================
   4. HALAMAN PAKET
================================================================ */
function viewDetail(pkgId) {
  selectedPkg = pkgId;
  const p = packages[pkgId]; if (!p) return;
  document.getElementById('detail-tag').textContent   = p.tag;
  document.getElementById('detail-title').textContent = p.title;
  document.getElementById('detail-sub').textContent   = p.sub;
  document.getElementById('detail-price').innerHTML   = p.priceStr;
  goto('detail');
}

function selectPackage(pkgId) {
  selectedPkg = pkgId;
  if (!currentUser) { pendingAction = 'booking'; openModal('login'); return; }
  addToCart(pkgId);
  goto('booking');
}

function bookFromDetail() {
  if (!currentUser) { pendingAction = 'booking'; openModal('login'); return; }
  addToCart(selectedPkg);
  goto('booking');
}

function addToCart(pkgId) {
  if (!cartItems[pkgId]) cartItems[pkgId] = { qty:1, checked:true };
  else cartItems[pkgId].checked = true;
}


/* ================================================================
   5. BOOKING BARU
================================================================ */

/* 5a. Render daftar checklist paket */
function renderPkgChecklist() {
  const container = document.getElementById('pkg-checklist');
  if (!container) return;
  container.innerHTML = '';

  Object.keys(packages).forEach(pkgId => {
    const p        = packages[pkgId];
    const isActive = cartItems[pkgId] && cartItems[pkgId].checked;
    const qty      = (cartItems[pkgId] && cartItems[pkgId].qty) || 1;

    const row = document.createElement('div');
    row.className = 'pkg-check-item' + (isActive ? ' active' : '');
    row.id        = 'pkgrow-' + pkgId;
    row.innerHTML = `
      <div class="pkg-checkbox">${isActive ? '✓' : ''}</div>
      <div class="pkg-check-emoji">${p.emoji}</div>
      <div class="pkg-check-info">
        <div class="pkg-check-name">${p.name}</div>
        <div class="pkg-check-price">${formatRp(p.priceNum)} / ${p.unit}</div>
      </div>
      <div class="pkg-qty-wrap">
        <input class="pkg-qty-input" type="number" min="0.5" step="0.5"
          value="${qty}" id="qty-${pkgId}"
          onclick="event.stopPropagation()"
          oninput="onQtyChange('${pkgId}', this.value)"
          placeholder="1">
        <span class="pkg-qty-unit">${p.unit}</span>
      </div>`;
    row.addEventListener('click', () => togglePkg(pkgId));
    container.appendChild(row);
  });

  updateSummary();

  /* Pre-fill nama & nomor telepon jika user sudah login */
  if (currentUser) {
    const nm = document.getElementById('book-name');
    if (nm && !nm.value) nm.value = currentUser.name || '';
    const ph = document.getElementById('book-phone');
    if (ph && !ph.value) ph.value = currentUser.phone || '';
  }
}

/* 5b. Toggle centang paket */
function togglePkg(pkgId) {
  if (!cartItems[pkgId]) cartItems[pkgId] = { qty:1, checked:false };
  cartItems[pkgId].checked = !cartItems[pkgId].checked;

  const row = document.getElementById('pkgrow-' + pkgId);
  const cb  = row ? row.querySelector('.pkg-checkbox') : null;
  if (cartItems[pkgId].checked) {
    if (row) row.classList.add('active');
    if (cb)  cb.textContent = '✓';
  } else {
    if (row) row.classList.remove('active');
    if (cb)  cb.textContent = '';
  }
  updateSummary();
}

/* 5c. Update qty */
function onQtyChange(pkgId, val) {
  const num = parseFloat(val);
  if (!isNaN(num) && num > 0) {
    if (!cartItems[pkgId]) cartItems[pkgId] = { qty:num, checked:true };
    else cartItems[pkgId].qty = num;
  }
  updateSummary();
}

/* 5d. Hitung & tampilkan ringkasan */
function updateSummary() {
  const siEl   = document.getElementById('summary-items');
  const stEl   = document.getElementById('summary-subtotal');
  const sdEl   = document.getElementById('summary-discount');
  const sttEl  = document.getElementById('summary-total');
  const drEl   = document.getElementById('discount-row');
  const nbEl   = document.getElementById('new-user-badge');
  if (!siEl) return;

  const active = Object.keys(cartItems).filter(id => cartItems[id].checked);

  if (active.length === 0) {
    siEl.innerHTML = '<div class="summary-empty">Belum ada paket dipilih</div>';
    if (stEl)  stEl.textContent  = formatRp(0);
    if (sttEl) sttEl.textContent = formatRp(0);
    if (drEl)  drEl.style.display  = 'none';
    if (nbEl)  nbEl.style.display  = 'none';
    return;
  }

  let subtotal = 0;
  let html = '';
  active.forEach(id => {
    const p   = packages[id];
    const qty = cartItems[id].qty || 1;
    const sub = p.priceNum * qty;
    subtotal += sub;
    html += `<div class="summary-item-row">
      <div>
        <div class="si-name">${p.emoji} ${p.name}</div>
        <div class="si-detail">${qty} ${p.unit} × ${formatRp(p.priceNum)}</div>
      </div>
      <div class="si-price">${formatRp(sub)}</div>
    </div>`;
  });
  siEl.innerHTML = html;
  if (stEl) stEl.textContent = formatRp(subtotal);

  let total = subtotal;
  if (isNewUser && subtotal > 0) {
    const disc = Math.round(subtotal * 0.3);
    total = subtotal - disc;
    if (drEl)  drEl.style.display  = 'flex';
    if (nbEl)  nbEl.style.display  = 'block';
    if (sdEl)  sdEl.textContent    = '- ' + formatRp(disc);
  } else {
    if (drEl)  drEl.style.display  = 'none';
    if (nbEl)  nbEl.style.display  = 'none';
  }
  if (sttEl) sttEl.textContent = formatRp(total);
}

/* Format Rupiah */
function formatRp(num) {
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

/* 5e. Pilih metode pembayaran */
function selectPayment(radio) {
  selectedPayment = radio.value;
  document.querySelectorAll('.pay-option').forEach(el => el.classList.remove('active'));
  const parent = radio.closest ? radio.closest('.pay-option') : null;
  if (parent) parent.classList.add('active');
}

/* 5f. Submit booking → validasi → kirim WA */
function submitBooking() {
  /* 1. cek paket */
  const active = Object.keys(cartItems).filter(id => cartItems[id].checked);
  if (active.length === 0) { alert('Pilih minimal 1 paket terlebih dahulu.'); return; }

  /* 2. cek data diri */
  const name    = (document.getElementById('book-name')    || {}).value || '';
  const phone   = (document.getElementById('book-phone')   || {}).value || '';
  const address = (document.getElementById('book-address') || {}).value || '';
  const date    = (document.getElementById('book-date')    || {}).value || '';
  const time    = (document.getElementById('book-time')    || {}).value || '';
  const catatan = (document.getElementById('book-notes')   || {}).value || '';

  if (!name.trim())    { alert('Masukkan nama lengkap.'); return; }
  if (!phone.trim())   { alert('Masukkan nomor WhatsApp.'); return; }
  if (!address.trim()) { alert('Masukkan alamat penjemputan.'); return; }
  if (!date)           { alert('Pilih tanggal penjemputan.'); return; }
  if (!time)           { alert('Pilih waktu penjemputan.'); return; }
  if (!selectedPayment){ alert('Pilih metode pembayaran.'); return; }

  /* 3. hitung total */
  let subtotal = 0;
  active.forEach(id => { subtotal += packages[id].priceNum * (cartItems[id].qty || 1); });
  const discount = isNewUser ? Math.round(subtotal * 0.3) : 0;
  const total    = subtotal - discount;

  /* 4. buat nomor order sementara */
  const oid = 'FW-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random()*9000)+1000);
  currentOrderId = oid;

  /* 5. simpan ke trackData agar bisa dilacak */
  const namaPaketList = active.map(id => `${packages[id].name} (${cartItems[id].qty||1} ${packages[id].unit})`);
  trackData[oid.toUpperCase()] = {
    name:    namaPaketList.length === 1 ? namaPaketList[0] : namaPaketList.length + ' Paket',
    pkgList: namaPaketList,
    status:  'Menunggu Konfirmasi Admin',
    step:    0,
    multi:   namaPaketList.length > 1
  };

  /* 6. bangun pesan WA */
  const lines = [
    'Halo Admin FreshWave! 👋',
    '',
    'Saya ingin melakukan booking laundry:',
    '',
    '📋 *DETAIL PESANAN*',
    'No. Order Sementara: ' + oid,
    '',
    '🧺 *Paket yang Dipesan:*',
    ...active.map(id => {
      const p = packages[id]; const qty = cartItems[id].qty||1;
      return `• ${p.name}: ${qty} ${p.unit} × ${formatRp(p.priceNum)} = ${formatRp(p.priceNum*qty)}`;
    }),
    '',
    '💰 Subtotal: ' + formatRp(subtotal),
    ...(isNewUser ? ['🎉 Diskon Pengguna Baru (30%): - ' + formatRp(discount)] : []),
    '✅ *Total Bayar: ' + formatRp(total) + '*',
    '💳 Pembayaran: ' + selectedPayment,
    '',
    '👤 *Data Penjemputan:*',
    'Nama    : ' + name.trim(),
    'WA      : ' + phone.trim(),
    'Alamat  : ' + address.trim(),
    'Tanggal : ' + date,
    'Waktu   : ' + time,
    ...(catatan.trim() ? ['Catatan : ' + catatan.trim()] : []),
    '',
    'Mohon konfirmasi dan kirimkan kode tracking resminya ya, terima kasih! 🙏'
  ];

  const waEncoded = encodeURIComponent(lines.join('\n'));
  const adminWA   = '6281271310014'; /* ← ganti nomor WA admin FreshWave */
  const waURL     = 'https://wa.me/' + adminWA + '?text=' + waEncoded;

  /* 7. isi modal sukses */
  const oidEl = document.getElementById('order-id-display');
  if (oidEl) oidEl.textContent = oid;
  const waBtn = document.getElementById('wa-open-btn');
  if (waBtn) waBtn.href = waURL;

  /* 8. tampilkan modal sukses */
  const overlay = document.getElementById('success-overlay');
  if (overlay) overlay.classList.add('open');

  /* 9. setelah booking pertama, bukan pengguna baru lagi */
  isNewUser = false;
}


/* ================================================================
   6. MODAL LOGIN/REGISTER
================================================================ */
function openModal(tab) {
  tab = tab || 'login';
  switchTab(tab);
  const m = document.getElementById('auth-modal');
  if (m) m.classList.add('open');
  const e = document.getElementById('modal-error');
  if (e) e.classList.remove('show');
}

function closeModal() {
  const m = document.getElementById('auth-modal');
  if (m) m.classList.remove('open');
}

function switchTab(tab) {
  const fl = document.getElementById('form-login');
  const fr = document.getElementById('form-register');
  const tl = document.getElementById('tab-login');
  const tr = document.getElementById('tab-register');
  const mt = document.getElementById('modal-title');
  const ms = document.getElementById('modal-sub');
  const me = document.getElementById('modal-error');

  if (fl) fl.style.display = tab==='login' ? 'block':'none';
  if (fr) fr.style.display = tab==='register'?'block':'none';
  if (tl) tl.classList.toggle('active', tab==='login');
  if (tr) tr.classList.toggle('active', tab==='register');
  if (mt) mt.textContent = tab==='login'?'Selamat Datang':'Buat Akun';
  if (ms) ms.textContent = tab==='login'?'Masuk untuk melanjutkan booking Anda':'Daftar gratis dan dapatkan diskon 30%';
  if (me) me.classList.remove('show');
}

/* Helper internal untuk validasi format regex email dan angka telepon */
function validateEmailFormat(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function validatePhoneFormat(phone) {
  const re = /^[0-9]+$/;
  return re.test(phone) && phone.length >= 10 && phone.length <= 13;
}


/* ================================================================
   7. LOGIN & REGISTER
================================================================ */
function doLogin() {
  const email = (document.getElementById('login-email')||{}).value||'';
  const pass  = (document.getElementById('login-password')||{}).value||'';
  const errEl = document.getElementById('modal-error');
  
  if (!errEl) return;

  // 1. Validasi Input Kosong
  if (!email.trim() || !pass) { 
    errEl.textContent = 'Mohon isi email dan password.'; 
    errEl.classList.add('show'); 
    return; 
  }

  // 2. Validasi Format Email
  if (!validateEmailFormat(email.trim())) {
    errEl.textContent = 'Format email salah! Pastikan menggunakan format alamat email yang benar (contoh: user@gmail.com).';
    errEl.classList.add('show');
    return;
  }

  // 3. Validasi Keberadaan Akun di Database Mock
  const user = userDatabase.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    errEl.textContent = 'Akun tidak terdaftar! Silakan klik tab "Daftar" di atas untuk membuat akun baru terlebih dahulu.';
    errEl.classList.add('show');
    return;
  }

  // 4. Validasi Password Berdasarkan Database Mock
  if (user.pass !== pass) {
    errEl.textContent = 'Password yang Anda masukkan salah. Silakan coba lagi.';
    errEl.classList.add('show');
    return;
  }

  // Jika sukses lolos semua validasi
  isNewUser = false; // Sesuai aturan app asli, user lama tidak langsung memicu diskon baru kecuali dari register ulang
  loginSuccess({ name: user.name, email: user.email, phone: user.phone });
}

function doRegister() {
  const name  = (document.getElementById('reg-name')||{}).value||'';
  const phone = (document.getElementById('reg-phone')||{}).value||'';
  const email = (document.getElementById('reg-email')||{}).value||'';
  const pass  = (document.getElementById('reg-password')||{}).value||'';
  const errEl = document.getElementById('modal-error');
  
  if (!errEl) return;

  // 1. Validasi Input Kosong
  if (!name.trim() || !phone.trim() || !email.trim() || !pass) { 
    errEl.textContent = 'Mohon lengkapi semua data.'; 
    errEl.classList.add('show'); 
    return; 
  }

  // 2. Validasi Format Email
  if (!validateEmailFormat(email.trim())) {
    errEl.textContent = 'Format email salah! Harus menyertakan "@" dan domain yang valid (contoh: nama@gmail.com).';
    errEl.classList.add('show');
    return;
  }

  // 3. Validasi Format & Panjang Nomor Telepon
  if (!validatePhoneFormat(phone.trim())) {
    errEl.textContent = 'Nomor telepon tidak valid! Harus berupa angka saja dan berjumlah antara 10-13 digit.';
    errEl.classList.add('show');
    return;
  }

  // 4. Validasi Panjang Minimal Password
  if (pass.length < 8) { 
    errEl.textContent = 'Password minimal 8 karakter.'; 
    errEl.classList.add('show'); 
    return; 
  }

  // 5. Cek apakah Email Sudah Pernah Terdaftar sebelumnya
  const isExist = userDatabase.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (isExist) {
    errEl.textContent = 'Email ini sudah terdaftar. Silakan beralih ke tab Login untuk masuk.';
    errEl.classList.add('show');
    return;
  }

  // Simpan data pendaftaran baru ke dalam database lokal sistem sementara
  const newUserObj = { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), pass: pass };
  userDatabase.push(newUserObj);

  isNewUser = true; /* pengguna baru = dapat diskon 30% */
  loginSuccess({ name: newUserObj.name, email: newUserObj.email, phone: newUserObj.phone });
}

function handlePromoClick() {
  if (!currentUser) openModal('register');
  else goto('packages');
}


/* ================================================================
   8. LOGIN BERHASIL & LOGOUT
================================================================ */
function loginSuccess(user) {
  currentUser = user;
  closeModal();

  const na = document.getElementById('nav-auth');
  const nu = document.getElementById('nav-user');
  const av = document.getElementById('user-avatar');
  const nm = document.getElementById('user-name');
  if (na) na.style.display = 'none';
  if (nu) nu.style.display = 'flex';
  if (av) av.textContent   = user.name.charAt(0).toUpperCase();
  if (nm) nm.textContent   = user.name.split(' ')[0];

  const pb = document.getElementById('promo-btn');
  if (pb) pb.textContent = 'Booking Sekarang';

  if (pendingAction === 'booking') {
    pendingAction = null;
    goto('booking');
  }
}

function logout() {
  currentUser = null; pendingAction = null;
  cartItems = {}; selectedPayment = '';

  const na = document.getElementById('nav-auth');
  const nu = document.getElementById('nav-user');
  if (na) na.style.display = 'block';
  if (nu) nu.style.display = 'none';

  const pb = document.getElementById('promo-btn');
  if (pb) pb.textContent = 'Daftar Gratis';

  goto('home');
}


/* ================================================================
   9. TRACKING — doTrack()
   Multi-paket: tampilkan daftar paket di bawah nama pesanan
================================================================ */
const trackData = {
  'FW-2024-0001': { name:'Express Wash — 3.5 kg',                              status:'Dalam Proses',           step:3, multi:false },
  'FW-2024-0002': { name:'Basic Wash — 5 kg',                                  status:'Selesai ✓',              step:5, done:true, multi:false },
  'FW-2024-0003': { name:'3 Paket', pkgList:['Basic Wash (3 kg)','Cuci Sepatu (2 pasang)','Bed & Bath (1 item)'], status:'Sortir & Pengecekan', step:2, multi:true }
};

function doTrack() {
  const inputEl  = document.getElementById('track-input');
  const resultEl = document.getElementById('track-result');
  if (!inputEl || !resultEl) return;

  const id   = inputEl.value.trim().toUpperCase();
  const data = trackData[id] || (currentOrderId && id===currentOrderId.toUpperCase() ? trackData[currentOrderId.toUpperCase()] : null);

  if (!data) {
    resultEl.style.display = 'none';
    alert('Nomor pesanan tidak ditemukan.\nCoba: FW-2024-0001, FW-2024-0002, atau FW-2024-0003');
    return;
  }

  /* Header kartu */
  const trId   = document.getElementById('tr-id');
  const trName = document.getElementById('tr-name');
  if (trId)   trId.textContent   = id;
  if (trName) trName.textContent = data.name;

  /* Daftar paket multi */
  const pkgListEl = document.getElementById('tr-pkg-list');
  if (pkgListEl) {
    if (data.multi && data.pkgList && data.pkgList.length > 0) {
      pkgListEl.style.display = 'flex';
      pkgListEl.innerHTML = data.pkgList.map(p => `<div class="tr-pkg-item">${p}</div>`).join('');
    } else {
      pkgListEl.style.display = 'none';
      pkgListEl.innerHTML = '';
    }
  }

  /* Badge status */
  const sb = document.getElementById('tr-status');
  if (sb) { sb.textContent = data.status; sb.className = 'status-badge'+(data.done?' done':''); }

  /* Reset timeline */
  for (let i=1;i<=5;i++) {
    const d = document.getElementById('tl'+i+'-dot');
    const l = document.getElementById('tl'+i+'-line');
    if (d) d.className = 'tl-dot';
    if (l) l.className = 'tl-line';
  }

  /* Tandai step */
  if (data.step > 0) {
    for (let i=1;i<=data.step;i++) {
      const d = document.getElementById('tl'+i+'-dot');
      if (!d) continue;
      d.className = (i===data.step && !data.done) ? 'tl-dot active' : 'tl-dot done';
      const l = document.getElementById('tl'+i+'-line');
      if (l && i<data.step) l.className = 'tl-line done';
    }
  }

  resultEl.style.display = 'block';
}


/* ================================================================
   10. SETELAH BOOKING BERHASIL
================================================================ */
function afterBooking() {
  const overlay = document.getElementById('success-overlay');
  if (overlay) overlay.classList.remove('open');

  const ti = document.getElementById('track-input');
  if (ti) ti.value = currentOrderId || 'FW-2024-0001';

  goto('tracking');
  setTimeout(doTrack, 300);

  /* Reset cart */
  cartItems = {}; selectedPayment = '';
}


/* ================================================================
   11. INISIALISASI
================================================================ */
(function init() {
  const today = new Date().toISOString().split('T')[0];
  const di    = document.getElementById('book-date');
  if (di) { di.min = today; di.value = today; }
})();