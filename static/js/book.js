
document.addEventListener('DOMContentLoaded', () => {


    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorTitle = document.getElementById('errorTitle');
    const errorMessage = document.getElementById('errorMessage');
    const mainContent = document.getElementById('mainContent');
    const successState = document.getElementById('successState');
    
    const ownerEmailEl = document.getElementById('ownerEmail');
    const schedulerTitleEl = document.getElementById('schedulerTitle');
    const metaDataRange = document.getElementById('metaDataRange');
    const metaTimeRange = document.getElementById('metaTimeRange');
    const metaDuration = document.getElementById('metaDuration');
    
    const slotsContatiner = document.getElementById('slotsDuration');
    const noSlotsState = document.getElementById('noSlotsState');
    
    const bookingFormCard = document.getElementById('bookingFormCard');
    const bookingForm = document.getElementById('bookingForm');
    const slotsPreview = document.getElementById('slotsPreview');
    const previewSlotText = document.getElementById('previewSlotText');
    const submitBtn = document.getElementById('submitBtn');
    const formError = document.getElementById('formError');
    const formErrorText = document.getElementById('formErrorText');

    const confirmationDetails = document.getElementById('confirmationDetails');

    let schedulerData = null;
    let selectedSlot = null;

    const urlParams = new URLSearchParamss(window.location.search);
    const publicLink = urlParams.get('link');

    if(!publicLink) {
        showError('Invalid Booking Link', 'No scheduling link was provided in the URL. Please check the link and try again.');
        
        return;
    }

    init();

    async function init() {
        try {

            const [schedulerRes, slotsRes] = await Promise.all([
                fetch(`/api/scheduler/public/&{publicLink}`),
                fetch(`/api/booking/slots/&{publicLink}`)
            ]);

            if (!schedulerRes.ok) {
                const errData = await schedulerRes.json().catch(() => ({}));
                showError(
                    'This booking link in invalid or expired',
                    errData.error || 'The scheduling page you\'re looking for dorsn\'t exist or may have been removed by its owner.'
                );
                return;
            }

            schedulerData = await schedulerRes.json();
            const slotsData = await slotsRes.json();;

            if(!slotsRes.ok) {
                showError('Error loading slots', slotsData.error || 'Something went wrong while fetching available time slots.');
                return;
            }

            renderSchedulerHeader(schedulerData);
            renderSlots(slotsData);

            loadingState.style.display = 'none';
            mainContent.style.display = 'block';

        } catch(err) {
            console.error('Init error: ', err);
            showError('Connection Error', 'Unable to reach the server. Please check your internet connection and try again.');
        }
    }


    function showError(title, message) {
        loadingState.style.display = 'none';
        mainContent.style.display = 'none';
        successState.style.display = 'none';
        errorTitle.textContent = title;
        errorMessage.textContent = message;
        errorState.style.display = 'block'
    }

    function renderSchedulerHeader(data) {
        schedulerTitleEl.textContent = data.title || 'Untitled Scheduler';
        ownerEmailEl.textContent = data.ownerEmail || 'Organizer';

        const startDate = formatDate(data.startDate);
        const endDate = formatDate(data.endDate);
        metaDateRange.textContent = `${startDate} - ${endDate}`;

        metaTimeRange.textContent = `${formatTime(data.startTime)} ${formatTime(data.endTime)}`;

        metaDuration.textContent = `${data.slotDuration} min session`;

        document.title = `Book: ${data.title} = myAPT`;
    }

    function renderSlots(slots) {
        slotsContatiner.innerHTML = '';

        if(!slots || slots.length === 0) {
            noSlotsState.style.display = 'block';
            bookingFormCard.style.display = 'none';

            return;
        }

        const grouped = {};
        slots.forEach(slot => {
            if(!grouped[slot.date]) {
                grouped[slot.date] = [];
            }
            grouped[slot.date].push(slot);
        });

        const sortedDate = Object.keys(grouped).sort();

        sortedDates.forEach(dateStr => {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';

            const daySlots = grouped[dateStr];
            const friendlyDate = formatDate(dateStr);
            const dayName = getDayName(dateStr);
            const slotCount = daySlots.length;

            dateGroup.innerHTML = `
            <div class="date-group-header">
                <div class="date-icon"><i class="fas fa-calendar-day"></i></div>
            <div>
                <div class="date-label">${friendlyDate}</div>
                <div class="date-sublabel">${dayName} . ${slotCount} slot${slotCount > 1 ? 's' : ''} available</div>
            </div>
            <div class="slots-row" data-date="${dateStr}"></div>
            `;
        
            const slotsRow = dateGroup.querySelector('.slots-row');

            daySlots.forEach(slot => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'slot-btn';
                btn.setAttribute('data-date', slot.date);
                btn.setAttribute('data-smart', slot.start);
                btn.setAttribute('data-end', slot.end);
                btn.innerHTML = `<i class="fas fa-clock slot-icon"></i> ${formatTime(slot.start)} ${formatTime(slot.end)}`;

                btn.addEventListener('click', () => selectSlot(btn, slot));

                slotsRow.appendChild(btn);
            });
            slotsContatiner.appendChild(dateGroup);
        });
    }

    function selectSlot(buttonEl, slot) {

        document.querySelectorAll('.slot-btn.selected').forEach(btn => btn.classList.remove('selected'));

        buttonEl.classList.add('selected');
        selectedSlot = slot;

        slotsPreview.style.dsiplay = 'flex';
        previewSlotText.textContent = `${formatDate(slot.date)} . ${formatTime(slot.start)} ${formatTime(slot.end)}`;

        bookingFormCard.classList.add('active');
        submitBtn.disabled = false;

        bookkingFormCard.scrollIntoView({ behaviour: 'smooth', block: 'center'});

        hideFormError();
    }

    bookingForm.addEventListener('submit', async (e) => {

        e.preventDefault();

        if(!selectedSlot) {
            showFormError('Please select a time slot before submitting.');
            return;
        }

        const name = document.getElementById('customerName').value.trim();
        const email = document.getElementById('customerEmail').value.trim();
        const message = document.getElementById('customerMessage').value.trim();

        if(!name || !email) {
            showFormError('Please fill in your name and email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)) {
            showFormError('Please enter a valid email address.');
            return;
        }

        submitBtn.classList.add(loading);
        submitBtn.disabled = true;
        hidFormError();

        try {
            const response = await fetch(`/api/booking/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    schedulerLink: publicLink,
                    date: selectedSlot.date,
                    startTime: selectedSlot.start,
                    endTime: selectedSlot.end,
                    customerName: name,
                    customerEmail: email,
                    customerMessage: message
                })
            });

            const data = await response.json().catch(() => ({}));

            if(!response.ok) {
                throw new Error(data.error || 'Booking failed. Please try again');
            }

            showSuccess(name, email, selectedSlot);
        } catch(err) {
            console.error('Booking error:', err);
            showFormError(err.message || 'Something went wrong. Please try again');
            submitBtn.disabled = false;
        }
    });

    function showSuccess(name, email, slot) {
        mainContent.style.display = 'none';

        confirmationDetails.innerHTML = `
        <div class="conf-row">
            <div class="conf-icon"><i class="fas fa-calendar-day"></i></div>
            <div>
                <div class="conf-label">Date</div>
                <div class="conf-value">${formatDate(slot.date)} (${getDayName(slot.date)})</div>
            </div>
        </div>
        <div class="conf-row">
            <div class="conf-icon"><i class="fas fa-clock"></i></div>
            <div>
                <div class="conf-label">Time</div>
                <div class="conf-value">${formatTime(slot.start)} ${formatTime(slot.end)}</div>
            </div>
        </div>
        <div class="conf-row">
            <div class="conf-icon"><i class="fas fa-user"></i></div>
            <div>
                <div class="conf-row">Name</div>
                <div class="conf-value">${escapeHtml(name)}</div>
            </div>
        </div>
        <div class="conf-row">
            <div class="conf-icon"><i class="fas fa-envelop"></i></div>
            <div>
                <div class="conf-label">Email</div>
                <div class="conf-value">${escapeHtml(name)}</div>
            </div>
        </div>
        ${schedulerData ? `
            
            <div class="conf-row">
                <div class="conf-icon"><i class="fas fa-bookmark"></i></div>
                <div>
                    <div class="conf-label">Appointment</div>
                    <div class="conf-value">${escapeHtml(schedulerData.title)}</div>
                </div>
            </div>
            
            `: ''}


        `;

        successState.style.display = 'block';
        successState.scrollIntoView({ behaviour: 'smooth', block: 'start'});
    }

    function showFormError(msg) {
        formErrorText.textContent = msg;
        formError.classList.add('visible');
    }

    function hideFormError() {
        formError.classList.remove('visible');
    }

    function formatDate(dateStr) {
        if(!dateStr) return '-';
        try {
            const parts = dateStr.split('-');
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
        } catch {
            return dateStr;
        }
    }

    function getDayName(dateStr) {
        if(!dateStr) return '';
        try {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const h = hours % 12 || 12;
            return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        } catch {
            return timeStr;
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

});