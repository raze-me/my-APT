document.addEventListener('DOMContentLoaded', () => {
    const cardsGrid = document.getElementById('scheduler-cards-grid');
    const loadingIndicator = document.getElementById('loading-indicator');
    const emptyState = document.getElementById('empty-state');
    const errorBox = document.getElementById('dashboard-error');
    const logoutBtn = document.getElementById('logout-btn');
    const userGreeting = document.getElementById('user-display-email');

    const bookingsSection = document.getElementById('booking-section');
    const bookingsLoading = document.getElementById('booking-loading');
    const bookingsList = document.getElementById('bookings-list');
    const bookingsEmpty = document.getElementById('bookings-empty');
    const bookingsStats = document.getElementById('bookings-stats');

    let allSchedulers = [];
    let allBookings = [];

    if (typeof firebase !== 'undefined' && firebase.auth && firebase.apps && firebase.apps.length > 0) {
        firebase.auth().onAuthStateChanged(user => {
            if (user && userGreeting) {
                userGreeting.textContent = user.email || user.displayName || "Active Host";
            }
        });
    } else {
        const savedUser = localStorage.getItem('myapt_user');
        if (savedUser && userGreeting) {
            try {
                const user = JSON.parse(savedUser);
                userGreeting.textContent = user.email || "Active Host";
            } catch (e) {
                userGreeting.textContent = "Active Host";
            }
        }
    }

    async function loadDashboard() {
        
        if (loadingIndicator) loadingIndicator.style.display = 'flex';
        if (cardsGrid) cardsGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        if (bookingsSection) bookingsSection.style.display = 'none';
        if (errorBox) {
            errorBox.style.display = 'none';
            errorBox.textContent = '';
        }

        try {
            const [schedulers, bookings] = await Promise.all([
                api.fetchWithAuth('/api/scheduler/my'),
                api.fetchWithAuth('/api/booking/my')
            ]);

            console.log("Fetched schedulers:", schedulers);
            console.log("Fetched bookings:", bookings);

            allSchedulers = schedulers || [];
            allBookings = bookings || [];

            if (loadingIndicator) loadingIndicator.style.display = 'none';

            if (allSchedulers.length === 0) {
                if (emptyState) emptyState.style.display = 'flex';
                return;
            }

            const bookingCountMap = {};
            allBookings.forEach(b => {
                const link = b.schedulerLink;
                bookingCountMap[link] = (bookingCountMap[link] || 0) + 1;
            });

            if (cardsGrid) {
                cardsGrid.innerHTML = '';
                allSchedulers.forEach(scheduler => {
                    const count = bookingCountMap[scheduler.publicLink] || 0;
                    const card = createSchedulerCard(scheduler, count);
                    cardsGrid.appendChild(card);
                });
                cardsGrid.style.display = 'grid';
                bindCardCopyButtons();
            }

            renderBookingsSection();

        } catch (error) {
            console.error("Dashboard fetch error:", error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';

            if (errorBox) {
                errorBox.style.display = 'block';
                errorBox.textContent = error.message || "Failed to load scheduling pages. Please refresh and try again.";
            }
        }
    }

     
    function createSchedulerCard(scheduler, bookingCount) {
        const publicBookingUrl = `${window.location.protocol}//${window.location.host}/book?link=${scheduler.publicLink}`;

        const card = document.createElement('div');
        card.className = 'scheduler-card';

        const countClass = bookingCount === 0 ? 'zero' : '';
        const countIcon = bookingCount > 0 ? 'fa-solid fa-users' : 'fa-regular fa-clock';
        const countText = bookingCount > 0
            ? `${bookingCount} booking${bookingCount > 1 ? 's' : ''}`
            : 'No bookings yet';

        card.innerHTML = `
            <div class="card-badge"><i class="fa-regular fa-clock"></i> ${scheduler.slotDuration} Min</div>
            <h3 class="card-title">${escapeHTML(scheduler.title)}</h3>
            
            <div class="card-details">
                <div class="detail-item">
                    <i class="fa-regular fa-calendar-days"></i>
                    <span>${formatDate(scheduler.startDate)} — ${formatDate(scheduler.endDate)}</span>
                </div>
                <div class="detail-item">
                    <i class="fa-regular fa-clock"></i>
                    <span>Daily: ${formatTime(scheduler.startTime)} – ${formatTime(scheduler.endTime)}</span>
                </div>
                <div class="card-booking-count ${countClass}">
                    <i class="${countIcon}"></i>
                    <span>${countText}</span>
                </div>
            </div>

            <div class="card-link-box">
                <span class="link-label">Booking URL</span>
                <div class="link-action-row">
                    <a href="${publicBookingUrl}" target="_blank" class="booking-link" title="Open booking page in new tab">
                        ${scheduler.publicLink} <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                    <button class="btn btn-outline btn-sm card-copy-btn" data-link="${publicBookingUrl}">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
        return card;
    }

    
    function renderBookingsSection() {
        if (!bookingsSection) return;

        bookingsSection.style.display = 'block';
        if (bookingsLoading) bookingsLoading.style.display = 'none';

        if (allBookings.length === 0) {
            if (bookingsList) bookingsList.style.display = 'none';
            if (bookingsEmpty) bookingsEmpty.style.display = 'block';
            if (bookingsStats) bookingsStats.innerHTML = '';
            return;
        }

        const today = getTodayStr();
        let upcomingCount = 0;
        let pastCount = 0;
        let todayCount = 0;

        allBookings.forEach(b => {
            const status = getBookingStatus(b.date, today);
            if (status === 'today') { todayCount++; upcomingCount++; }
            else if (status === 'upcoming') upcomingCount++;
            else pastCount++;
        });

        if (bookingsStats) {
            bookingsStats.innerHTML = `
                <div class="stat-chip total">
                    <span class="stat-number">${allBookings.length}</span> Total
                </div>
                ${upcomingCount > 0 ? `
                <div class="stat-chip upcoming">
                    <span class="stat-number">${upcomingCount}</span> Upcoming
                </div>` : ''}
                ${todayCount > 0 ? `
                <div class="stat-chip" style="background-color: #fef3c7; border-color: #fde68a; color: #92400e;">
                    <span class="stat-number">${todayCount}</span> Today
                </div>` : ''}
                ${pastCount > 0 ? `
                <div class="stat-chip past">
                    <span class="stat-number">${pastCount}</span> Past
                </div>` : ''}
            `;
        }

        
        const schedulerTitleMap = {};
        allSchedulers.forEach(s => {
            schedulerTitleMap[s.publicLink] = s.title;
        });

        const sortedBookings = [...allBookings].sort((a, b) => {
            const statusA = getBookingStatus(a.date, today);
            const statusB = getBookingStatus(b.date, today);
            const orderMap = { today: 0, upcoming: 1, past: 2 };
            const orderDiff = (orderMap[statusA] || 2) - (orderMap[statusB] || 2);
            if (orderDiff !== 0) return orderDiff;
            return (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || '');
        });

        if (bookingsList) {
            bookingsList.innerHTML = '';

            sortedBookings.forEach(booking => {
                const card = createBookingCard(booking, schedulerTitleMap, today);
                bookingsList.appendChild(card);
            });

            bookingsList.style.display = 'flex';
        }
        if (bookingsEmpty) bookingsEmpty.style.display = 'none';
    }

    
    function createBookingCard(booking, schedulerTitleMap, today) {
        const card = document.createElement('div');
        const status = getBookingStatus(booking.date, today);
        card.className = `booking-card ${status === 'past' ? 'past-booking' : ''}`;

        
        const name = booking.customerName || 'Guest';
        const initials = name.split(' ').map(w => w.charAt(0)).slice(0, 2).join('');

        
        const schedulerTitle = schedulerTitleMap[booking.schedulerLink] || booking.schedulerLink;

        
        let statusLabel = '';
        if (status === 'today') {
            statusLabel = '<span class="booking-status today">Today</span>';
        } else if (status === 'upcoming') {
            statusLabel = '<span class="booking-status upcoming">Upcoming</span>';
        } else {
            statusLabel = '<span class="booking-status past">Past</span>';
        }

        
        const messageHtml = booking.customerMessage
            ? `<div class="booking-message"><i class="fa-regular fa-comment"></i> "${escapeHTML(booking.customerMessage)}"</div>`
            : '';

        card.innerHTML = `
            <div class="booking-avatar">${escapeHTML(initials)}</div>
            <div class="booking-info">
                <div class="booking-customer-name">${escapeHTML(name)}</div>
                <div class="booking-details-row">
                    <span class="booking-detail">
                        <i class="fa-regular fa-calendar"></i> ${formatDate(booking.date)}
                    </span>
                    <span class="booking-detail">
                        <i class="fa-regular fa-clock"></i> ${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}
                    </span>
                    <span class="booking-detail">
                        <i class="fa-regular fa-envelope"></i> ${escapeHTML(booking.customerEmail || '')}
                    </span>
                </div>
                ${messageHtml}
            </div>
            <div class="booking-scheduler-tag" title="${escapeHTML(schedulerTitle)}">${escapeHTML(schedulerTitle)}</div>
            ${statusLabel}
        `;
        return card;
    }


      function getBookingStatus(dateStr, todayStr) {
        if (!dateStr) return 'past';
        if (dateStr === todayStr) return 'today';
        return dateStr > todayStr ? 'upcoming' : 'past';
    }

    function getTodayStr() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            const parts = dateStr.split('-');
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    }

    function formatTime(timeStr) {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const suffix = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 || 12;
        return `${displayHour}:${minutes} ${suffix}`;
    }


        function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function bindCardCopyButtons() {
        const copyBtns = document.querySelectorAll('.card-copy-btn');
        copyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const link = btn.getAttribute('data-link');
                navigator.clipboard.writeText(link)
                    .then(() => {
                        const originalHtml = btn.innerHTML;
                        btn.innerHTML = `<i class="fa-solid fa-check" style="color: #059669;"></i>`;
                        btn.classList.add('btn-success-light');

                        setTimeout(() => {
                            btn.innerHTML = originalHtml;
                            btn.classList.remove('btn-success-light');
                        }, 2000);
                    })
                    .catch(err => {
                        console.error("Copy failed: ", err);
                    });
            });
        });
    }


    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to log out?")) {
                localStorage.removeItem('myapt_user');
                if (typeof firebase !== 'undefined' && firebase.auth && firebase.apps && firebase.apps.length > 0) {
                    firebase.auth().signOut()
                        .then(() => {
                            window.location.href = '/login';
                        })
                        .catch(err => {
                            console.error("Logout failed:", err);
                            window.location.href = '/login';
                        });
                } else {
                    window.location.href = '/login';
                }
            }
        });
    }

    loadDashboard();
});

