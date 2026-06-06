document.documentElement.style.display = 'none';

document.addEventListener('DOMContentLoaded', () => {
    let retries = 0;
    const maxRetries = 40;

    const checkAuthenticationState = () => {
        const savedUser = localStorage.getItem('myapt_user');

        if(typeof firebase !== 'undefined' && firebase.auth && firebase.apps && firebase.apps.length > 0) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user || savedUser) {
                    document.documentElement.style.display = '';
                } else {
                    console.log("No user session active, redirecting to login page...");
                    window.location.href = '/login';
                }
            });
        } else {
            if (savedUser) {
                document.documentElement.style.display = '';
                return;
            }

            retries++;
            if(retries < maxRetries){
                setTimeout(checkAuthenticationState, 50);
            } else {
                document.documentElement.style.display = '';
                document.body.innerHTML = `
                <div style="font-family: sans-serif; text-align: center; padding: 40px; color: #be123c;">
                    <h2>Authentication SDK Not Loaded</h2>
                    <p>Please check your internet connection or configure Firebase.</p>
                </div>
                `;
            }
        }
    };

    checkAuthenticationState();
});