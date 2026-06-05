
document.addEvenetListner('DOMContentLoaded', () => {
    const cardsGrid = document.getElementById('scheduler-cards-grid');
    const loadingIndicator = document.getElementById('loading-indicator');
    const emptyState = document.getElementById('empty-state');
    const errorBox = document.getElementById('dashboard-error');
    const logoutBtn = document.getElementById('logout-btn');
    const userGreeting = document.getElementById('user-display-email');


    if(typeof firebase !== 'undefined' && firebase.auth){
        firebase.auth().onAuthStateChanged(user => {
            if( user && userGreeting) {
                userGreeting.textContent = user.email || user.displayName || "Active Host";
            }
        });
    }

    async function loadDashboardSchedulers(){

        if(loadingIndicator) loadingIndicator.style.display = 'flex';
        if(cardsGrid) cardsGrid.style.display = 'none';
        if(emptyState) emptyState.style.display = 'none';
        if(errorBox) {
            errorBox.style.display = 'none';
            errorBox.textContent = '';
        }

        try{

            const schedulers = await api.fetchWithAuth('/api/scheduler/my');
            console.log("Fetched user schedulers list:", schedulers);

            if(loadingIndicator) loadingIndicator.style.display = 'none';

            if(!schedulers || schedulers.length === 0){
                if(emptyState) emptyState.style.display = 'flex';
                return;
            }

            if(cardsGrid) {
                cardsGrid.innerHTML = '';

                schedulers.forEach(scheduler => {
                    const card = createSchedulerCard(scheduler);
                    cardsGrid.appendChild(card);
                });

                cardsGrid.style.display = 'grid';
                bindCardCopyButtons();
            }

        } catch(error) {
            console.error("Dashboard fetch error:", error);
            if(loadingIndicator) loadingIndicator.style.display = 'none';

            if(errorBox){ 
                errorBox.style.display = 'block';
                errorBox.textContent = error.message || "Failed to load scheduling pages. Please refresh and try again";
            }
        }
    } 

    function createSchedulerCard(scheduler) {
        const publicBookingUrl = `${window.location.protocol}//${window.loacation.host}/book.html?link=${scheduler.publicLink}`;

        const formatTime = (timeStr) => {
            if(!timeStr) return '';
            const [hours, minutes] = timeStr.split(':');
            const h = parseInt(hours);
            const suffix = h >= 12 ? 'PM' : 'AM';
            const displayHour = h % 12 || 12;
            return `${displayHour}:${minutes} ${suffix}`;
        };

        const card = document.createElement('div');
        card.className = 'scheduler-card';
        card.innerHTML =`
        <div class="card-badge"><i class="fa-regular fa-clock"></i> ${scheduler.slotDuration} Min</div>
        <h3 class="card-title">${escapeHTML(scheduler.title)}</h3>
        
        <div class="card-details">
            <div class="detail-item">
                <i class="fa-regular fa-calendar-days"></i>
                <span>${scheduler.startDate} to ${scheduler.endDate}</span>
            </div>
            <div class="detail-item">
                <i class="fa-regular fa-clock"></i>
                <span>Daily: ${formatTime(scheduler.startTime)} - ${formatTime(scheduler.endTime)}</span>
            </div>
        </div>
        
        <div class="card-link-box">
            <span class="link-label">Booking URL</span>
            <div class="link-action-row">
                <a href="${publicBookingUrl}" target="_blank" class="booking-link" title="Open booking page in new tab">
                    ${scheduler.publicLink} <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
                <button class="btn btn-outline btn-sm card-copy-btn" data-links="${publicBookingUrl}">
                    <i class="fa-regular fa-copy"></i>
                </button>
            </div>
        </div
        `;
        return card;
    }

    function escapeHTML(str){
        return str.replace(/[&<>'"]/g,
            tag =>({
                '&': '$amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function bindCardCopyButton(){
        const copyBtns = document.querySelectorAll('.card-copy-btn');
        copyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const link = btn.getAttribute('data-link');
                navigator.clipboard.writeText(link)
                .then(() =>{
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = `<i class="fa-solid fa-check" style="color: #059669;"></i>`;
                    btn.classList.add('btn-success-light');
                }, 2000);
            })
            .catch(err =>{
                console.error("Copy failed: ", err);
            });
        });
    }

    if(logoutBtn){
        logoutBtn.addEventListener('click', () =>{
            if (confirm("Are you sure you want to log out?")) {
                firebase.auth().signOut()
                .then(() => {
                    window.location.href = '/login';
                })
                .catch(err => {
                    console.error("Logout failed:", err);
                });
            }
        });
    }

    loadDashboardSchedulers();

});