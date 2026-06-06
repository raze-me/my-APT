

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('scheduler-form');
    const submitBtn = document.getElementById('submit-Btn');
    const errorBox = document.getElementById('form-error-msg');
    const successBox = document.getElementById('success-box');
    const publicLinkInput = document.getElementById('public-link-url');
    const copyBtn = document.getElementById('copy-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if(errorBox){
                errorBox.style.display = 'none';
                errorBox.textContent = '';
            }

            const title = document.getElementById('title').value.trim();
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const startTime = document.getElementById('startTime').value;
            const endTime = document.getElementById('endTime');
            const slotDuration = document.getElementById('slotDuration');

            if(new Date(startDate) > new Date(endDate)) {
                
                showError("Active End Date must be after or equal to the Start Date.");
                return;
            }

            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating Page...`;

            try{

                const response = await api.fetchWithAuth('/api/scheduler/create',  {
                    method: 'POST',
                    body: JSON.stringify ({

                        title,
                        startDate,
                        endDate,
                        startTime,
                        endTime,
                        slotDuration
                    })
                });

                console.log("Scheduler API Success response", response);

                const publicLink = response.publicLink;

                const publicBookingUrl = `${window.location.protocol}//${window.location.host}/book.html?link=${publicLink}`;

                if(publicLinkInput) {
                    publicLinkInput.value = publicBookingUrl;
                }

                form.style.display = 'none';
                if(successBox){
                    successBox.style.display = 'block';
                }

            } catch(error){
                console.error("Failed to create scheduler:", error);
                showError(error.message || "An unexpected error occured while saving the scheduler page.");

                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }

        });
    }

    function showError(message){
        if (errorBox){
            errorBox.style.display = 'block';
            errorBox.textContent = message;
        }
    }

    if(copyBtn && publicLinkInput){
        copyBtn.addEventListener('click', () => {
            const linkText = publicLinkInput.value;

            navigator.clipboard.writeText(linkText)
            .then(() => {
                const originalText = copyBtn.innerHTML;

                copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
                copyBtn.classList.add('btn-success');


                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('btn-success');

                }, 2000);
            })
            .catch(err => {
                console.error("Failed to copy link: ", err);
                alert("Could not copy link automatically. Please select the text box and copy manual.");
            });
        });
    }

    if(logoutBtn){
        logoutBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to  log out?")) {
                firebase.auth().signOut()
                .then(() => {
                    window.location.href = '/login';
                })
                .catch(err => {
                    console.error("Logout failed: ", err);
                    alert("Sign out failed: " + err.message);
                });
            }
        });
    }
});