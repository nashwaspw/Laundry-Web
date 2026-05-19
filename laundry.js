/* ================================================================
   FRESHWAVE LAUNDRY — JAVASCRIPT GABUNGAN (UPDATED LOCAL STORAGE)
   File: laundry.js
================================================================ */

/* 1. DATA LAYANAN BARU (BASIC WASH DIHAPUS, DIGANTI OPSI PREMIUM) */
const packages = {
  express: { name:'Fast & Clean',      priceNum:9000,   unit:'kg',    emoji:'⚡', desc:'Cuci kilat higienis 12 jam selesai dengan wangi segar morning dew.' },
  premium: { name:'Luxury Deep Clean', priceNum:18000,  unit:'kg',    emoji:'👑', desc:'Pembersihan noda mendalam dengan setrika uap anti kusut & parfum luxury.' },
  sepatu:  { name:'Leather & Shoes',   priceNum:35000,  unit:'pasang',emoji:'👟', desc:'Pembersihan manual hand-wash premium serta proteksi khusus noda air.' },
  gown:    { name:'Silk & Gown',       priceNum:50000,  unit:'item',  emoji:'👗', desc:'Perawatan eksklusif gaun pesta, kebaya, atau kain sutra berpayet mahal.' },
  bed:     { name:'Bedding Luxury',    priceNum:25000,  unit:'item',  emoji:'🛏️', desc:'Sterilisasi sprei, selimut, dan bedcover besar dari tungau debu.' },
  carpet:  { name:'Curtain & Carpet',  priceNum:40000,  unit:'m²',    emoji:'🏡', desc:'Ekstraksi noda karpet bulu tebal dan gorden berat anti apek.' }
};

/* 2. STATE APLIKASI (LOCAL STORAGE SESSION MANAGEMENT) */
let currentUser     = null;      
let selectedPkg     = 'express'; 
let pendingAction   = null;      
let currentOrderId  = null;      
let isNewUser       = true;      
let cartItems       = {};        
let selectedPayment = '';        

/* Database simulasi akun lokal */
let userDatabase = JSON.parse(localStorage.getItem('fw_user_db')) || [
  { name: 'Budi Santoso', email: 'budi@gmail.com', phone: '081234567890', pass: 'password123', address: 'Jl. Angkatan 45 No. 12, Palembang', avatar: 'B' }
];

/* Menampung database order lokal */
let orderDatabase = JSON.parse(localStorage.getItem('fw_order_db')) || {};

/* 3. NAVIGASI HALAMAN */
function goto(page) {
  const target = document.getElementById('page-' + page);
  if (!target) return;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  target.classList.add('active');

  // PERBAIKAN BUG NAVIGASI NAVBAR LINE SEJAJAR
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navMap = { home:'nav-home', packages:'nav-packages', tracking:'nav-tracking' };
  
  if (navMap[page]) { 
    const el = document.getElementById(navMap[page]); 
    if (el) el.classList.add('active'); 
  } else if (page === 'booking' || page === 'detail') {
    // Jika berada di form booking atau detail, garis bawah tetap stay di 'Paket & Layanan'
    const el = document.getElementById('nav-packages');
    if (el) el.classList.add('active');
  }

  window.scrollTo(0, 0);
  if (page === 'booking') renderPkgChecklist();
  if (page === 'profile') loadProfileDataForm();
}

/* 3b. INTERAKSI FLIP CARD BUTTON */
function toggleCardFlip(cardContainerId) {
  const container = document.getElementById(cardContainerId);
  if (container) {
    container.classList.toggle('flipped');
  }
}

/* 4. HALAMAN PAKET & ADD TO CART */
function selectPackage(pkgId) {
  selectedPkg = pkgId;
  if (!currentUser) { 
    pendingAction = 'booking'; 
    openModal('login'); 
    return; 
  }
  addToCart(pkgId);
  goto('booking');
}

function addToCart(pkgId) {
  // Reset cart lain agar fokus ke paket yang dipilih langsung
  cartItems = {};
  cartItems[pkgId] = { qty: 1, checked: true };
}

/* 5. RENDER FORM CHECKLIST BOOKING */
function renderPkgChecklist() {
  const container = document.getElementById('pkg-checklist');
  if (!container) return;
  container.innerHTML = '';

  Object.keys(packages).forEach(pkgId => {
    const p        = packages[pkgId];
    const isActive = cartItems[pkgId] && cartItems[pkgId].checked;
    const qty      = (cartItems[pkgId] && cartItems[pkgId].qty) || 1;

    const row = document.createElement('div');
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.padding = "10px";
    row.style.background = isActive ? "var(--green-light)" : "var(--white)";
    row.style.border = "1px solid var(--border)";
    row.style.borderRadius = "8px";
    row.style.cursor = "pointer";
    
    row.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-weight:bold; color:var(--green);">${isActive ? '✓ ' : '○ '}</span>
        <span>${p.emoji} <strong>${p.name}</strong></span>
      </div>
      <div>
        <input type="number" min="1" value="${qty}" style="width:50px; text-align:center; padding:4px;" 
          onchange="updateCartQty('${pkgId}', this.value)" onclick="event.stopPropagation()">
        <span style="font-size:0.8rem; color:var(--muted);"> ${p.unit}</span>
      </div>
    `;
    row.onclick = () => {
      if (cartItems[pkgId]) {
        cartItems[pkgId].checked = !cartItems[pkgId].checked;
      } else {
        cartItems[pkgId] = { qty: 1, checked: true };
      }
      renderPkgChecklist();
    };
    container.appendChild(row);
  });

  updateSummary();

  if (currentUser) {
    if(document.getElementById('book-name')) document.getElementById('book-name').value = currentUser.name || '';
    if(document.getElementById('book-phone')) document.getElementById('book-phone').value = currentUser.phone || '';
    if(document.getElementById('book-address')) document.getElementById('book-address').value = currentUser.address || '';
  }
}

function updateCartQty(pkgId, qty) {
  if (!cartItems[pkgId]) cartItems[pkgId] = { qty: 1, checked: true };
  cartItems[pkgId].qty = parseFloat(qty) || 1;
  updateSummary();
}

function updateSummary() {
  const itemsEl = document.getElementById('summary-items');
  if (!itemsEl) return;

  let total = 0;
  let summaryHtml = '<ul style="list-style:none; display:flex; flex-direction:column; gap:8px;">';

  Object.keys(cartItems).forEach(pkgId => {
    if (cartItems[pkgId] && cartItems[pkgId].checked) {
      const p = packages[pkgId];
      const qty = cartItems[pkgId].qty;
      const sub = p.priceNum * qty;
      total += sub;
      summaryHtml += `<li style="display:flex; justify-content:space-between; font-size:0.9rem;">
        <span>${p.name} (x${qty})</span>
        <span>Rp ${sub.toLocaleString('id-ID')}</span>
      </li>`;
    }
  });

  if (isNewUser && total > 0) {
    const diskon = total * 0.3;
    total = total - diskon;
    summaryHtml += `<li style="display:flex; justify-content:space-between; font-size:0.9rem; color:#d93838; font-weight:600;">
      <span>Diskon Member Baru (30%)</span>
      <span>- Rp ${diskon.toLocaleString('id-ID')}</span>
    </li>`;
  }

  summaryHtml += `</ul><div style="margin-top:15px; padding-top:10px; border-top:2px solid var(--border); display:flex; justify-content:space-between; font-weight:700; font-size:1.1rem; color:var(--green);">
    <span>Total Bayar:</span>
    <span>Rp ${total.toLocaleString('id-ID')}</span>
  </div>`;

  itemsEl.innerHTML = total === 0 ? '<div style="color:var(--muted); font-size:0.9rem;">Belum ada item aktif dipilih.</div>' : summaryHtml;
}

/* 6. PROSES SUBMIT BOOKING PENJEMPUTAN */
function submitBooking() {
  const name = document.getElementById('book-name').value;
  const phone = document.getElementById('book-phone').value;
  const date = document.getElementById('book-date').value;
  const time = document.getElementById('book-time').value;
  const address = document.getElementById('book-address').value;

  if (!name || !phone || !date || !address || !selectedPayment) {
    alert('Mohon lengkapi seluruh kolom formulir dan pilih metode pembayaran!');
    return;
  }

  const activePkgs = Object.keys(cartItems).filter(id => cartItems[id].checked);
  if (activePkgs.length === 0) {
    alert('Pilih minimal satu layanan laundry!');
    return;
  }

  // Generate ID Acak Sementara
  const randId = 'FW-' + Math.floor(1000 + Math.random() * 9000);
  currentOrderId = randId;

  // Bangun teks detail pesanan
  let itemString = '';
  activePkgs.forEach(id => {
    itemString += `- ${packages[id].name} (${cartItems[id].qty} ${packages[id].unit})\n`;
  });

  // Simpan data order ke local database lokal
  orderDatabase[randId] = {
    id: randId,
    name: name,
    phone: phone,
    date: date,
    time: time,
    address: address,
    items: itemString,
    payment: selectedPayment,
    status: 'Dalam Antrean Prioritas',
    waSent: document.getElementById('notify-wa').checked
  };
  localStorage.setItem('fw_order_db', JSON.stringify(orderDatabase));

  // Munculkan Modal Sukses
  document.getElementById('display-order-id').textContent = randId;
  
  // Create URL WhatsApp Chat Admin
  const waMessage = `Halo Admin FreshWave! Saya ingin mengonfirmasi booking laundry premium:\n\n*ID Pesanan:* ${randId}\n*Nama:* ${name}\n*No HP:* ${phone}\n*Jadwal Pick-Up:* ${date} [Jam ${time}]\n*Alamat:* ${address}\n\n*Layanan Diorder:*\n${itemString}*Metode Pembayaran:* ${selectedPayment}\n\nMohon segera diproses, terima kasih!`;
  const waUrl = `https://api.whatsapp.com/send?phone=6281234567890&text=${encodeURIComponent(waMessage)}`;
  
  const shareBtn = document.getElementById('wa-share-btn');
  shareBtn.href = waUrl;

  if (document.getElementById('notify-wa').checked) {
    // Jika dicentang, buka jendela baru otomatis
    window.open(waUrl, '_blank');
  }

  document.getElementById('success-overlay').classList.add('open');
}

/* 7. TRACKING SISTEM */
function doTrack() {
  const input = document.getElementById('track-input').value.trim().toUpperCase();
  const resultBox = document.getElementById('track-result');
  const backupArea = document.getElementById('wa-backup-area');

  if (!input) {
    alert('Silakan masukkan ID Pesanan terlebih dahulu!');
    return;
  }

  const order = orderDatabase[input];
  if (!order) {
    alert('ID Pesanan tidak ditemukan. Pastikan kode yang dimasukkan valid (Contoh: FW-1234).');
    resultBox.style.display = 'none';
    return;
  }

  document.getElementById('res-id').textContent = order.id;
  document.getElementById('res-status').textContent = order.status;
  document.getElementById('res-date').textContent = 'Tanggal Pick-up: ' + order.date + ' | Jam: ' + order.time;
  document.getElementById('res-name').textContent = order.name;
  document.getElementById('res-items').innerHTML = order.items.replace(/\n/g, '<br>');

  /* FITUR BARU: JIKA USER TIDAK MEMILIH WA ADMIN DI AWAL, TETAP BISA CHAT DARI MENU TRACKING */
  if (!order.waSent) {
    backupArea.style.display = 'block';
    const waMessage = `Halo Admin! Saya ingin mengirim ulang rincian pesanan saya yang tertunda:\n\n*ID Pesanan:* ${order.id}\n*Nama:* ${order.name}\n*Alamat:* ${order.address}\n\n*Layanan:*\n${order.items}`;
    document.getElementById('wa-backup-btn').onclick = function() {
      order.waSent = true; // Tandai sudah terkirim
      localStorage.setItem('fw_order_db', JSON.stringify(orderDatabase));
      backupArea.style.display = 'none';
      window.open(`https://api.whatsapp.com/send?phone=6281234567890&text=${encodeURIComponent(waMessage)}`, '_blank');
    };
  } else {
    backupArea.style.display = 'none';
  }

  resultBox.style.display = 'block';
}

/* 8. MODAL AUTH SWITCHING */
function openModal(tab = 'login') {
  document.getElementById('auth-modal').classList.add('open');
  switchTab(tab);
}
function closeModal() {
  document.getElementById('auth-modal').classList.remove('open');
}
function switchTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  if (tab === 'login') {
    document.getElementById('tab-login').classList.add('active');
    document.getElementById('form-login').style.display = 'block';
    document.getElementById('form-register').style.display = 'none';
  } else {
    document.getElementById('tab-register').classList.add('active');
    document.getElementById('form-login').style.display = 'none';
    document.getElementById('form-register').style.display = 'block';
  }
}

/* FITUR MATA UNTUK PASWORD */
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if(input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

/* FITUR LUPA PASSWORD MOCKUP */
function triggerForgotPassword() {
  const idf = document.getElementById('login-identifier').value;
  if(!idf) {
    alert('Silakan ketik Email atau No HP Anda terlebih dahulu pada kotak input di atas.');
  } else {
    alert('Link pemulihan / kode reset password premium telah dikirim ke: ' + idf);
  }
}

/* 9. PROSES AUTH LOGIN & REGISTER (PERSISTENCE STATE) */
function doLogin() {
  const idf = document.getElementById('login-identifier').value.trim();
  const pass = document.getElementById('login-password').value;

  if (!idf || !pass) {
    alert('Kolom email/telepon dan password wajib diisi!');
    return;
  }

  const user = userDatabase.find(u => (u.email === idf || u.phone === idf) && u.pass === pass);
  if (user) {
    loginSuccess(user);
  } else {
    alert('Kombinasi akun atau password Anda salah!');
  }
}

/* LOGIN TANPA PASSWORD (MASUK CEPAT HANYA MENGGUNAKAN EMAIL/HP) */
function doLoginWithoutPassword() {
  const idf = document.getElementById('login-identifier').value.trim();
  if (!idf) {
    alert('Silakan isi alamat email atau No Telepon Anda untuk login cepat.');
    return;
  }
  
  let user = userDatabase.find(u => u.email === idf || u.phone === idf);
  if (!user) {
    // Jika belum terdaftar, buat akun instan otomatis
    user = { name: 'Member FreshWave', email: idf.includes('@') ? idf : '', phone: !idf.includes('@') ? idf : '', pass: '123456', address: '', avatar: 'M' };
    userDatabase.push(user);
    localStorage.setItem('fw_user_db', JSON.stringify(userDatabase));
  }
  loginSuccess(user);
}

function doRegister() {
  const name = document.getElementById('reg-name').value;
  const phone = document.getElementById('reg-phone').value;
  const email = document.getElementById('reg-email').value;
  const pass = document.getElementById('reg-password').value;

  if (!name || !phone || !email || !pass) {
    alert('Harap isi semua bidang pendaftaran!');
    return;
  }

  const userExists = userDatabase.some(u => u.email === email || u.phone === phone);
  if (userExists) {
    alert('Email atau nomor telepon tersebut sudah terdaftar sebagai member.');
    return;
  }

  const newUserObj = { name, email, phone, pass, address: '', avatar: name.charAt(0) };
  userDatabase.push(newUserObj);
  localStorage.setItem('fw_user_db', JSON.stringify(userDatabase));

  alert('Pendaftaran berhasil! Silakan nikmati layanan prioritas kami.');
  loginSuccess(newUserObj);
}

function loginSuccess(user) {
  currentUser = user;
  // Simpan session login ke localStorage agar refresh tidak logout
  localStorage.setItem('fw_session_user', JSON.stringify(user));
  isNewUser = false; 

  document.getElementById('nav-auth').style.display = 'none';
  const nu = document.getElementById('nav-user');
  nu.style.display = 'flex';
  
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-avatar').textContent = user.avatar || user.name.charAt(0);

  closeModal();
  if (pendingAction === 'booking') { 
    pendingAction = null; 
    goto('booking'); 
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('fw_session_user');
  document.getElementById('nav-auth').style.display = 'block';
  document.getElementById('nav-user').style.display = 'none';
  goto('home');
}

/* 10. FITUR EDIT PROFIL MEMBER PANEL */
function loadProfileDataForm() {
  if(!currentUser) return;
  document.getElementById('prof-name').value = currentUser.name || '';
  document.getElementById('prof-phone').value = currentUser.phone || '';
  document.getElementById('prof-address').value = currentUser.address || '';
  document.getElementById('profile-avatar-img').textContent = currentUser.avatar || currentUser.name.charAt(0);
}

function saveProfileData() {
  if(!currentUser) return;
  
  const oldEmail = currentUser.email;
  const oldPhone = currentUser.phone;

  currentUser.name = document.getElementById('prof-name').value;
  currentUser.phone = document.getElementById('prof-phone').value;
  currentUser.address = document.getElementById('prof-address').value;
  currentUser.avatar = currentUser.name.charAt(0);

  // Sync / update ke database utama
  const index = userDatabase.findIndex(u => u.email === oldEmail || u.phone === oldPhone);
  if (index !== -1) {
    userDatabase[index] = currentUser;
    localStorage.setItem('fw_user_db', JSON.stringify(userDatabase));
  }
  
  localStorage.setItem('fw_session_user', JSON.stringify(currentUser));
  document.getElementById('user-name').textContent = currentUser.name;
  document.getElementById('user-avatar').textContent = currentUser.avatar;
  
  alert('Data akun profil Anda berhasil diperbarui!');
  goto('home');
}

function handleAvatarChange(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const avatarContainer = document.getElementById('profile-avatar-img');
      avatarContainer.textContent = '';
      avatarContainer.style.background = `url(${e.target.result})`;
      avatarContainer.style.backgroundSize = 'cover';
      avatarContainer.style.backgroundPosition = 'center';
      
      // Update data di navbar secara live
      const navAv = document.getElementById('user-avatar');
      navAv.textContent = '';
      navAv.style.background = `url(${e.target.result})`;
      navAv.style.backgroundSize = 'cover';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function handlePromoClick() {
  if (currentUser) {
    // User sudah login → langsung ke booking dengan diskon aktif
    isNewUser = true; // aktifkan diskon member baru
    goto('packages');
    showToast('promo', '🎉 Diskon 30% Aktif!', 'Pilih paket favoritmu, diskon langsung diterapkan saat checkout.', 5000);
  } else {
    openModal('register');
  }
}

/* ================================================================
   TOAST NOTIFICATION SYSTEM
================================================================ */
function showToast(type, title, message, duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️', promo: '🎉' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" onclick="dismissToast(this.parentElement)">×</button>
    <div class="toast-progress" style="animation-duration:${duration}ms"></div>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => { requestAnimationFrame(() => toast.classList.add('show')); });
  setTimeout(() => dismissToast(toast), duration);
  return toast;
}

function dismissToast(toast) {
  if (!toast || toast.classList.contains('hide')) return;
  toast.classList.add('hide');
  setTimeout(() => toast.remove(), 400);
}

/* ================================================================
   RIPPLE EFFECT ON BUTTONS
================================================================ */
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.btn-primary, .btn-outline, .modal-btn, .nav-cta, .pkg-btn, .promo-cta-btn');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  const wave = document.createElement('span');
  wave.className = 'ripple-wave';
  wave.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
  btn.appendChild(wave);
  setTimeout(() => wave.remove(), 700);
});

/* ================================================================
   UPDATE PROMO BANNER STATE BASED ON LOGIN
================================================================ */
function updatePromoBannerState() {
  const btn = document.getElementById('promo-btn');
  const trustGuest = document.getElementById('promo-trust-guest');
  const trustUser = document.getElementById('promo-trust-user');
  const promoTitle = document.getElementById('promo-title');
  const promoDesc = document.getElementById('promo-desc');
  if (!btn) return;

  if (currentUser) {
    btn.textContent = '🛒 Booking Sekarang';
    btn.classList.add('booking-mode');
    if (trustGuest) trustGuest.style.display = 'none';
    if (trustUser) trustUser.style.display = 'block';
    if (promoTitle) promoTitle.textContent = `Hei, ${currentUser.name.split(' ')[0]}! Diskon 30% siap untukmu 🎉`;
    if (promoDesc) promoDesc.textContent = 'Selamat datang, member FreshWave! Nikmati diskon eksklusif di setiap pesanan perdanamu.';
  } else {
    btn.textContent = 'Daftar Gratis';
    btn.classList.remove('booking-mode');
    if (trustGuest) trustGuest.style.display = 'block';
    if (trustUser) trustUser.style.display = 'none';
    if (promoTitle) promoTitle.textContent = 'Diskon 30% untuk Pelanggan Baru!';
    if (promoDesc) promoDesc.textContent = 'Daftar sekarang menjadi member FreshWave dan dapatkan diskon langsung pada order pertama Anda.';
  }
}

function afterBooking() {
  document.getElementById('success-overlay').classList.remove('open');
  const ti = document.getElementById('track-input');
  if (ti) ti.value = currentOrderId || '';
  goto('tracking');
  setTimeout(doTrack, 300);
}

/* 11. INITIALIZATION CHECK (AUTO LOGIN WHEN REFRESH) */
window.addEventListener('DOMContentLoaded', () => {
  const savedSession = localStorage.getItem('fw_session_user');
  if (savedSession) {
    const parsedUser = JSON.parse(savedSession);
    loginSuccess(parsedUser);
  }
});
