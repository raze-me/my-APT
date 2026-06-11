
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('myapt_user') && (window.location.pathname === '/' || window.location.pathname === '/index.html')) {
        window.location.href = '/dashboard';
        return;
    }

    const menuToggle = document.getElementById('menu-toggle-btn');
    const navMenu = document.getElementById('navigation-menu');
    const header = document.querySelector('.navbar');

    if( menuToggle && navMenu) {
        menuToggle.addEventListener('click', () =>{
            navMenu.classList.toggle('open');
            const icon = menuToggle.querySelector('i');
            if(icon){
                if( navMenu.classList.contains('open')) {
                    icon.className = 'fa-solid fa-xmark';
                } else{
                    icon.className = 'fa-solid fa-bars';
                }
            }
        });
    }

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if(navMenu && navMenu.classList.contains('open')){
                navMenu.classList.remove('open');
                const icon = menuToggle.querySelector('i');
                if(icon) icon.className = 'fa-solid fa-bars';
            }
        });
    });

    window.addEventListener('scroll', () => {
        if(header){
            if(window.scrollY > 20){
                header.style.boxShadow = 'var(--shadow-md)';
                header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            }else{
                header.style.boxShadow = 'var(--shadow-sm)';
                header.style.backgroundColor = 'var(--bg-glass)';
            }
        }
    });

       const availabilityData = {
        '1': {
            dayName: 'Monday',
            dateString: 'Monday, June 1',
            slots: ['09:00 AM', '10:30 AM', '01:00 PM', '03:30 PM']
        },
        '10': {
            dayName: 'Wednesday',
            dateString: 'Wednesday, June 10',
            slots: ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM', '05:00 PM']
        },
        '16': {
            dayName: 'Tuesday',
            dateString: 'Tuesday, June 16',
            slots: ['08:30 AM', '09:30 AM', '11:00 AM', '01:30 PM', '03:00 PM']
        },
        '23': {
            dayName: 'Tuesday',
            dateString: 'Tuesday, June 23',
            slots: ['09:00 AM', '11:30 AM', '12:30 PM', '02:00 PM']
        }
    };

    const calendarGrid = document.getElementById('calendar-days-grid');
    const timeSlotsList = document.getElementById('time-slots-list');
    const selectedDateText = document.getElementById('selected-date-text');
    const floatingMeetingToast = document.getElementById('meeting-card-toast');

    if(calendarGrid && timeSlotsList && selectedDateText){
        calendarGrid.addEventListener('click', (e) => {
            const dayBtn = e.target.closest('.calendar-day');
            if(!dayBtn) return;

            const day = dayBtn.getAttribute('data-day');

            document.querySelectorAll('.calendar-day').forEach(btn => {
                btn.classList.remove('selected');
            });
            dayBtn.classList.add('selected');

            if(availabilityData[day]) {
                const data = availabilityData[day];
                selectedDateText.textContent = data.dateString;

                timeSlotsList.innerHTML = '';
                data.slots.forEach(slot => {
                    const btn = document.createElement('button');
                    btn.className = 'time-slot';
                    btn.setAttribute('data-time', slot);
                    btn.textContent = slot;
                    timeSlotsList.appendChild(btn);
                });
            } else{
                const dayInt = parseInt(day);
                const daySuffix = getDaySuffix(dayInt);
                selectedDateText.textContent = `June ${dayInt}${daySuffix} (No Availability)`;

                timeSlotsList.innerHTML = `
                <div style="font-size: 0.8rem; color: var(--text-light); text-align: center; padding: 20px 10px;">
                        <i class="fa-solid fa-calendar-xmark" style="font-size: 1.5rem; margin-bottom: 8px; color: var(--grey-medium); display: block;"></i>
                        No slots available on this day.
                    </div>
                `;
            }
        });

        timeSlotsList.addEventListener('click', (e) => {
            const slotBtn = e.target.closest('.time-slot');
            if(!slotBtn) return;

            document.querySelectorAll('.time-slot').forEach(btn => {
                btn.classList.remove('selected');
            });
            slotBtn.classList.add('selected');

            const selectedTime = slotBtn.getAttribute('data-time');
            const activeDayBtn = document.querySelector('.calendar-day.selected') || document.querySelector('.calendar-day.active');
            let selectedDay = '1';
            if(activeDayBtn){
                selectedDay = activeDayBtn.getAttribute('data-day');
            }

            if(floatingMeetingToast && availabilityData[selectedDay]){
                const details = availabilityData[selectedDay];

                const timeSpan = floatingMeetingToast.querySelector('.meeting-time');
                const labelSpan = floatingMeetingToast.querySelector('.meeting-label');

                if(timeSpan && labelSpan){
                    labelSpan.textContent = "Booked Session";
                    timeSpan.textContent = `${selectedTime}, June ${selectedDay}${getDaySuffix(parseInt(selectedDay))}.`;

                    floatingMeetingToast.style.borderColor = 'var(--primary)';
                    floatingMeetingToast.style.boxShadow = 'var(--shadow-premium)';

                    setTimeout(() => {
                        floatingMeetingToast.style.borderColor = 'rgba(0, 0, 0, 0.06)';
                        floatingMeetingToast.style.boxShadow = 'var(--shadow-lg)';
                    }, 4000);
                }
            }
        });

        function getDaySuffix(day){
            if(day >= 11 && day <= 13){
                return 'th';
            }
            switch(day%10){
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        }

        const firstActiveDay = document.querySelector('.calendar-day.active');
        if( firstActiveDay){
            firstActiveDay.classList.add('selected');
        }

    const animatedElements = document.querySelectorAll('.feature-card, .step-card, .pricing-card');

    if('IntersectionObserver' in window && animatedElements.length > 0){
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease-out, transform 0.6s, ease-out';
        });

        const observeOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries, observer) =>{
            entries.forEach(entry => {
                if( entry.isIntersecting){
                    const el = entry.target;
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                    observer.unobserve(el);
                }
            });
        }, observeOptions);

        animatedElements.forEach(el => {
            observer.observe(el);
        });
    }
    }

    const updateNavbarAuth = () => {
        const navActions = document.getElementById('navigation-actions');
        if(!navActions) return;

        const savedUser = localStorage.getItem('myapt_user');
        if(savedUser){
            try{
                const user = JSON.parse(savedUser);
                const name = user.displayName || user.email.split('@')[0];
                navActions.innerHTML = `
                    <span class="user-greeting" style="font-weight: 600; font-size: 0.95rem; color: var(--text-main); display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-circle-user" style="color: var(--primary); font-size: 1.25rem;"></i>
                        Hi, <strong>${name}</strong>
                    </span>
                    <button id="logout-btn" class="btn btn-secondary btn-sm" style="padding: 6px 12px; font-size: 0.8rem; margin-left: 8px;">Logout</button>
                `;

                const logoutBtn = document.getElementById('logout-btn');
                if(logoutBtn){
                    logoutBtn.addEventListener('click', () => {
                        localStorage.removeItem('myapt_user');
                        window.location.reload();
                    });
                }
            } catch(e) {
                console.error("Error parsing user from localStorage:", e);
            }
        }
    };

    updateNavbarAuth();
});