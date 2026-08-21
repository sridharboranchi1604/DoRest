/* DoRest Owner Dashboard v22 */
(function () {
  const cfg = window.dorestFirebaseConfig || {
    apiKey: 'AIzaSyDFXViUUIyuX8rP2T8kqziGasWmZQr1u6Y',
    authDomain: 'dorest-6ec1d.firebaseapp.com',
    projectId: 'dorest-6ec1d',
    storageBucket: 'dorest-6ec1d.firebasestorage.app',
    messagingSenderId: '377857417432',
    appId: '1:377857417432:web:b5be6af618ce853fbb37ad'
  };

  if (!firebase.apps.length) firebase.initializeApp(cfg);

  const auth = firebase.auth();
  const db = firebase.firestore();

  let currentUser = null;
  let orders = [];
  let partners = [];
  let activeFilter = 'all';
  let unsubscribeOrders = null;
  let unsubscribePartners = null;

  const $ = id => document.getElementById(id);

  const money = n =>
    `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const esc = v =>
    String(v ?? '').replace(/[&<>'"]/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[c]));

  const dateText = o =>
    o.date
      ? new Date(`${o.date}T00:00:00`).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      : '—';

  const statusLabel = s => ({
    pending: 'Pending',
    accepted: 'Accepted',
    assigned: 'Assigned',
    partner_confirmed: 'Partner confirmed',
    on_the_way: 'On the way',
    started: 'Started',
    completed: 'Completed',
    rejected: 'Rejected',
    cancelled: 'Cancelled'
  }[s] || s || 'Pending');

  const statusClass = s =>
    [
      'pending',
      'accepted',
      'assigned',
      'partner_confirmed',
      'on_the_way',
      'started',
      'completed',
      'rejected',
      'cancelled'
    ].includes(s)
      ? s
      : 'pending';


  /* =========================
     AUTHENTICATION
  ========================= */

  auth.onAuthStateChanged(async user => {
    if (!user) {
      showLogin();
      return;
    }

    currentUser = user;

    try {
      const adminDoc = await db
        .collection('admins')
        .doc(user.uid)
        .get();

      if (
        !adminDoc.exists ||
        adminDoc.data().active !== true
      ) {
        await auth.signOut();

        throw new Error(
          'This account is not authorized as a DoRest owner.'
        );
      }

      $('ownerEmail').textContent =
        user.email || 'Owner';

      $('ownerName').textContent =
        adminDoc.data().name || 'Owner';

      $('ownerAvatar').textContent =
        (
          adminDoc.data().name ||
          user.email ||
          'O'
        )
          .charAt(0)
          .toUpperCase();

      showApp();
      startListeners();

    } catch (e) {
      $('loginError').textContent = e.message;
      showLogin();
    }
  });


  /* =========================
     LOGIN
  ========================= */

  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault();

    $('loginError').textContent = '';
    $('loginBtn').disabled = true;
    $('loginBtn').innerHTML = 'Signing in...';

    try {
      await auth.signInWithEmailAndPassword(
        $('email').value.trim(),
        $('password').value
      );

    } catch (e) {
      $('loginError').textContent =
        e.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : (e.message || 'Login failed.');

    } finally {
      $('loginBtn').disabled = false;
      $('loginBtn').innerHTML =
        'Sign in <span>→</span>';
    }
  });


  /* =========================
     BASIC CONTROLS
  ========================= */

  $('logoutBtn').onclick = () =>
    auth.signOut();

  $('refreshBtn').onclick = () => {
    loadOrdersOnce();
    loadPartnersOnce();
    toast('Dashboard refreshed');
  };

  $('partnerForm').addEventListener(
    'submit',
    createPartner
  );


  /* =========================
     NAVIGATION
  ========================= */

  document
    .querySelectorAll('.nav-item')
    .forEach(b => {
      b.onclick = () =>
        showSection(b.dataset.section);
    });


  /* =========================
     ORDER FILTERS
     FIXED
  ========================= */

  document
    .querySelectorAll('.filter')
    .forEach(b => {

      b.addEventListener('click', () => {

        document
          .querySelectorAll('.filter')
          .forEach(x =>
            x.classList.remove('active')
          );

        b.classList.add('active');

        activeFilter =
          (b.dataset.filter || 'all')
            .trim()
            .toLowerCase();

        renderOrders();
      });

    });


  /* =========================
     VIEW CONTROL
  ========================= */

  function showLogin() {
    $('loginView').classList.remove('hidden');
    $('appView').classList.add('hidden');
  }

  function showApp() {
    $('loginView').classList.add('hidden');
    $('appView').classList.remove('hidden');
  }

  window.showSection = function (name) {

    document
      .querySelectorAll('.section')
      .forEach(s =>
        s.classList.remove('active')
      );

    $(name + 'Section')
      .classList.add('active');

    document
      .querySelectorAll('.nav-item')
      .forEach(b =>
        b.classList.toggle(
          'active',
          b.dataset.section === name
        )
      );

    $('pageTitle').textContent =
      name[0].toUpperCase() +
      name.slice(1);

    if (name === 'orders')
      renderOrders();

    if (name === 'partners')
      renderPartners();
  };


  /* =========================
     FIREBASE LISTENERS
  ========================= */

  function startListeners() {

    if (unsubscribeOrders)
      unsubscribeOrders();

    if (unsubscribePartners)
      unsubscribePartners();

    unsubscribeOrders =
      db.collection('bookings')
        .onSnapshot(
          snap => {

            orders = snap.docs.map(d => ({
              id: d.id,
              ...d.data()
            }));

            orders.sort(
              (a, b) =>
                timeValue(b.createdAt) -
                timeValue(a.createdAt)
            );

            renderAll();
          },

          err =>
            toast(
              'Orders error: ' +
              err.message
            )
        );


    unsubscribePartners =
      db.collection('partners')
        .onSnapshot(
          snap => {

            partners = snap.docs.map(d => ({
              id: d.id,
              ...d.data()
            }));

            renderPartners();
          },

          err =>
            console.warn(err)
        );
  }


  async function loadOrdersOnce() {

    try {

      const s =
        await db
          .collection('bookings')
          .get();

      orders = s.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      orders.sort(
        (a, b) =>
          timeValue(b.createdAt) -
          timeValue(a.createdAt)
      );

      renderAll();

    } catch (e) {
      toast(e.message);
    }
  }


  async function loadPartnersOnce() {

    try {

      const s =
        await db
          .collection('partners')
          .get();

      partners = s.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      renderPartners();

    } catch (e) {
      toast(e.message);
    }
  }


  function timeValue(x) {

    if (!x) return 0;

    if (typeof x.toMillis === 'function')
      return x.toMillis();

    if (x.seconds)
      return x.seconds * 1000;

    return new Date(x).getTime() || 0;
  }


  /* =========================
     RENDER ALL
  ========================= */

  function renderAll() {
    renderStats();
    renderLatest();
    renderOrders();
  }


  /* =========================
     STATISTICS
  ========================= */

  function renderStats() {

    const c = s =>
      orders.filter(
        o => o.status === s
      ).length;

    $('statPending').textContent =
      c('pending');

    $('statAccepted').textContent =
      c('accepted');

    $('statActive').textContent =
      orders.filter(o =>
        [
          'assigned',
          'partner_confirmed',
          'on_the_way',
          'started'
        ].includes(o.status)
      ).length;

    $('statCompleted').textContent =
      c('completed');

    $('pendingBadge').textContent =
      c('pending');
  }


  /* =========================
     LATEST ORDERS
  ========================= */

  function orderCard(o) {

    return `
      <div class="order-row">

        <div class="order-icon">
          ${esc(o.icon || '🛠️')}
        </div>

        <div class="order-main">
          <strong>
            ${esc(o.serviceName || 'Service')}
          </strong>

          <span>
            ${esc(o.id)}
            ·
            ${dateText(o)}
            ·
            ${esc(o.time || '—')}
          </span>
        </div>

        <div class="order-price">
          ${money(o.total)}
        </div>

        <span class="status ${statusClass(o.status)}">
          ${statusLabel(o.status)}
        </span>

        <button
          class="small-btn"
          onclick="openOrder('${esc(o.id)}')">
          View
        </button>

      </div>
    `;
  }


  function renderLatest() {

    const list =
      orders
        .filter(o => o.status === 'pending')
        .slice(0, 5);

    $('latestOrders').innerHTML =
      list.length
        ? list.map(orderCard).join('')
        : '<div class="empty">No pending orders right now.</div>';
  }


  /* =========================
     ORDERS TABLE
  ========================= */

  function renderOrders() {

    const filtered =
      activeFilter === 'all'
        ? orders
        : orders.filter(
          o =>
            String(o.status || '')
              .trim()
              .toLowerCase() ===
            activeFilter
        );


    if (!filtered.length) {

      $('ordersList').innerHTML =
        '<div class="empty big">No orders found for this filter.</div>';

      return;
    }


    $('ordersList').innerHTML = `

      <div class="table-head">

        <span>Booking</span>
        <span>Customer</span>
        <span>Schedule</span>
        <span>Total</span>
        <span>Status</span>
        <span></span>

      </div>

      ${filtered
        .map(o => `

            <div class="table-row">

              <div>
                <strong>
                  ${esc(
          o.serviceName ||
          'Service'
        )}
                </strong>

                <small>
                  ${esc(o.id)}
                </small>
              </div>


              <div>

                <strong>
                  ${esc(
          o.customerName ||
          o.customerEmail ||
          'Customer'
        )}
                </strong>

                <small>
                  ${esc(
          o.customerPhone || ''
        )}
                </small>

              </div>


              <div>

                <strong>
                  ${dateText(o)}
                </strong>

                <small>
                  ${esc(o.time || '—')}
                </small>

              </div>


              <strong>
                ${money(o.total)}
              </strong>


              <span
                class="status ${statusClass(o.status)}">

                ${statusLabel(o.status)}

              </span>


              <button
                class="small-btn"
                onclick="openOrder('${esc(o.id)}')">

                Manage

              </button>

            </div>

          `)
        .join('')
      }

    `;
  }


  /* =========================
     ORDER MODAL
  ========================= */

  window.openOrder = function (id) {

    const o =
      orders.find(
        x => x.id === id
      );

    if (!o) return;


    $('modalOrderTitle').textContent =
      o.serviceName || 'Booking';


    $('orderDetails').innerHTML = `

      <div class="detail-grid">

        <div>
          <span>Booking ID</span>
          <strong>
            ${esc(o.id)}
          </strong>
        </div>

        <div>
          <span>Status</span>
          <strong class="status ${statusClass(o.status)}">
            ${statusLabel(o.status)}
          </strong>
        </div>

        <div>
          <span>Customer</span>
          <strong>
            ${esc(
      o.customerName ||
      o.customerEmail ||
      'Customer'
    )}
          </strong>
        </div>

        <div>
          <span>Phone</span>
          <strong>
            ${esc(
      o.customerPhone || '—'
    )}
          </strong>
        </div>

        <div>
          <span>Date</span>
          <strong>
            ${dateText(o)}
          </strong>
        </div>

        <div>
          <span>Time</span>
          <strong>
            ${esc(o.time || '—')}
          </strong>
        </div>

        <div>
          <span>Total</span>
          <strong>
            ${money(o.total)}
          </strong>
        </div>

        <div>
          <span>Address</span>
          <strong>
            ${esc(o.address || '—')}
          </strong>
        </div>

      </div>

      ${o.cooking
        ? `
            <div class="extra-box">

              <b>Cooking details</b>

              <p>
                ${esc(o.cooking.type || '')}
                ·
                ${esc(o.cooking.meal || '')}
                ·
                ${esc(o.cooking.cuisine || '')}
                ·
                ${esc(o.cooking.preference || '')}
                ·
                ${esc(o.cooking.people || '')}
              </p>

              <p>
                ${esc(
          o.cooking.instructions || ''
        )}
              </p>

            </div>
          `
        : ''
      }

    `;

    renderOrderActions(o);

    $('orderModal')
      .classList
      .remove('hidden');
  };


  /* =========================
     ORDER ACTIONS
  ========================= */

  function renderOrderActions(o) {

    const status = String(o.status || '')
      .trim()
      .toLowerCase();

    let html = '';

    if (status === 'pending') {

      html = `
      <button
        class="danger"
        onclick="updateOrder('${o.id}', 'rejected')">
        Reject
      </button>

      <button
        class="primary"
        onclick="updateOrder('${o.id}', 'accepted')">
        Accept order <span>✓</span>
      </button>
    `;

    } else if (status === 'accepted') {

      html = `
      <select id="partnerSelect">
        <option value="">Select partner</option>

        ${partners
          .filter(p => p.available !== false)
          .map(p => `
            <option value="${p.id}">
              ${esc(p.name)} — ${esc(p.services || 'General')}
            </option>
          `)
          .join('')}
      </select>

      <button
        class="primary"
        onclick="assignPartner('${o.id}')">
        Assign partner <span>→</span>
      </button>
    `;

    } else if (status === 'assigned') {

      html = `
      <div class="assigned-note">
        Assigned to
        <strong>${esc(o.partnerName || 'Partner')}</strong>
      </div>

      <button
        class="primary"
        onclick="updateOrder('${o.id}', 'completed')">
        Mark as Completed <span>✓</span>
      </button>
    `;

    } else if (status === 'completed') {

      html = `
      <div class="assigned-note">
        Booking completed successfully ✓
      </div>
    `;

    } else {

      html = `
      <button
        class="secondary"
        onclick="closeModal('orderModal')">
        Close
      </button>
    `;
    }

    $('orderActions').innerHTML = html;
  }


  /* =========================
     ACCEPT / REJECT
  ========================= */

  window.updateOrder = async function (
    id,
    status
  ) {

    try {

      await db
        .collection('bookings')
        .doc(id)
        .update({

          status,

          ...(status === 'accepted'
            ? {
              acceptedAt:
                firebase.firestore
                  .FieldValue
                  .serverTimestamp()
            }
            : {
              rejectedAt:
                firebase.firestore
                  .FieldValue
                  .serverTimestamp()
            })

        });


      toast(
        status === 'accepted'
          ? 'Order accepted'
          : 'Order rejected'
      );


      const o =
        orders.find(
          x => x.id === id
        );

      if (o) {

        o.status = status;

        renderAll();
        renderOrderActions(o);
      }


    } catch (e) {

      toast(
        'Update failed: ' +
        e.message
      );
    }
  };


  /* =========================
     ASSIGN PARTNER
  ========================= */

  window.assignPartner =
    async function (id) {

      const sel =
        $('partnerSelect');

      if (!sel || !sel.value) {

        toast(
          'Please select a partner'
        );

        return;
      }


      const p =
        partners.find(
          x => x.id === sel.value
        );


      try {

        await db
          .collection('bookings')
          .doc(id)
          .update({

            status: 'assigned',
            partnerId: p.id,
            partnerName: p.name,
            partnerPhone: p.phone || '',

            assignedAt:
              firebase.firestore
                .FieldValue
                .serverTimestamp()

          });


        toast(
          'Partner assigned successfully'
        );

        closeModal('orderModal');


      } catch (e) {

        toast(
          'Assignment failed: ' +
          e.message
        );
      }
    };


  /* =========================
     PARTNERS
  ========================= */

  function renderPartners() {

    if (!$('partnersList'))
      return;


    if (!partners.length) {

      $('partnersList').innerHTML =
        '<div class="empty big">No partners yet. Add your first professional.</div>';

      return;
    }


    $('partnersList').innerHTML =
      partners
        .map(p => `

          <div class="partner-card">

            <div class="partner-avatar">
              ${esc(
          (p.name || 'P')
            .charAt(0)
            .toUpperCase()
        )}
            </div>

            <div class="partner-info">

              <h3>
                ${esc(
          p.name ||
          'Partner'
        )}
              </h3>

              <p>
                ${esc(
          p.phone || '—'
        )}
              </p>

              <p>
                ${esc(
          p.services ||
          'General services'
        )}
              </p>

            </div>

            <span
              class="availability ${p.available === false
            ? 'off'
            : ''
          }">

              ${p.available === false
            ? 'Unavailable'
            : 'Available'
          }

            </span>

          </div>

        `)
        .join('');
  }


  /* =========================
     ADD PARTNER
  ========================= */

  window.openPartnerModal = () => {

    $('partnerModal')
      .classList
      .remove('hidden');

    $('partnerError').textContent = '';
  };


  window.closeModal = id =>
    $(id)
      .classList
      .add('hidden');


  async function createPartner(e) {

    e.preventDefault();

    $('partnerError').textContent = '';

    try {

      await db
        .collection('partners')
        .add({

          name:
            $('partnerName')
              .value
              .trim(),

          phone:
            $('partnerPhone')
              .value
              .trim(),

          services:
            $('partnerServices')
              .value
              .trim() ||
            'General services',

          rating:
            Number(
              $('partnerRating')
                .value || 5
            ),

          available:
            $('partnerAvailable')
              .checked,

          createdAt:
            firebase.firestore
              .FieldValue
              .serverTimestamp()

        });


      $('partnerForm').reset();

      $('partnerRating').value = 5;

      $('partnerAvailable').checked =
        true;

      closeModal('partnerModal');

      toast('Partner created');


    } catch (err) {

      $('partnerError').textContent =
        err.message;
    }
  }


  window.closeReviewModal = () => { };


  /* =========================
     MODAL CLICK
  ========================= */

  window.addEventListener(
    'click',
    e => {

      if (
        e.target.classList
          .contains('modal')
      ) {
        e.target.classList
          .add('hidden');
      }

    }
  );


  /* =========================
     TOAST
  ========================= */

  function toast(msg) {

    $('toast').textContent =
      msg;

    $('toast')
      .classList
      .add('show');

    clearTimeout(
      window.__toast
    );

    window.__toast =
      setTimeout(
        () =>
          $('toast')
            .classList
            .remove('show'),
        3000
      );
  }

})();