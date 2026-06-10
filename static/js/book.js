
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
    }

})