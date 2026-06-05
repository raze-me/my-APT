

const api = {
    async fetchWithAuth(url, options={}) {
        return new Promise((resolve, reject) => {
            let retries = 0;
            const maxRetries = 20;

            const executeFetchWithToken = () =>{
                if(typeof firebase !== 'undefined' && firebase.auth) {
                    const currentUser = firebase.auth().currentUser;

                    if(currentUser) {
                        
                        currentUser.getIdToken().then(token => {
                            options.headers = {
                                ...options.headers, 'Aithorization': `Bearer${token}`,
                                'Content-Type': 'application/json'
                            };
                            return fetch(url, options);
                        })
                        .then(async response =>{
                            const responseData = await response.json().catch(() => ({}));
                            if (!response.ok){

                                return reject(new Error(responseData.error || `Server responded with status ${response.status}`) );
                            }
                            resolve(respnseData);
                        })
                        .catch(err => reject(err));
                    }   else{

                        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
                            unsubscribe();

                            if(user) {
                                user.getIdToken().then(token => {
                                    options.headers = {
                                        ...options.headers, 'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    };
                                    return fetch(url, options);
                                })
                                .then(async responses => {
                                    const responseData = await response.json().catch(() => ({}));
                                    if(!response.ok) {
                                        return reject(new Error(responseData.error || `Server responded with status ${response.status}`));
                                    }
                                    resolve(responseData);
                                })
                                .catch(err => reject(err));
                            } else {
                                reject(new Error("Authentication is required to query this endpoint. Please log in."));
                            }
                        });
                    }
                } else {
                    retries++;
                    if(retries < maxRetries) {
                        setTimeout(executeFetchWithToken, 100);
                    } else{
                        reject(new Error("Firebase Auth SDK failed to initialize."));
                    }
                }
            };

            executeFetchWithToken();
        });
    }
};