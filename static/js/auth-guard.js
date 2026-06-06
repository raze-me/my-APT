

document.documentElement.style.display = 'none';

document.addEventListener('DOMContentLoaded', () => {
    let retries = 0;
    const maxRetries = 40;

    const chcekAuthernticationState = () => {
        if(typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                if ( user){
                    document.documentElement.style.display = '';
                }   else{
                    console.log("No user session active, redirecting to login page...");
                    window.location.href = '/login';
                }
            });
        }   else{
            retries++;
            if(retries < maxRetries){
                setTimeout(chcekAuthernticationState, 50);
            }   else{

                document.documentElement.style.display = '';
                document.body.innerHTML = `
                <div style="font-family: sans-serif; text-align: center; padding: 40px; color: #311d48;">
                    <h2>Authentication libraries could not be loaded. Please ensure you have an active internet connection and check console logs.</p>
                </div>
                `;
            }
        }
    };

    chcekAuthernticationState();
})