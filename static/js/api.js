const api = {
    async fetchWithAuth(url, options={}) {
        return new Promise((resolve, reject) => {
            const savedUser = localStorage.getItem('myapt_user');
            
            const performFetch = (token) => {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
                fetch(url, options)
                    .then(async response => {
                        const responseData = await response.json().catch(() => ({}));
                        if (!response.ok) {
                            return reject(new Error(responseData.error || `Server responded with status ${response.status}`));
                        }
                        resolve(responseData);
                    })
                    .catch(err => reject(err));
            };

            if (typeof firebase !== 'undefined' && firebase.auth && firebase.apps && firebase.apps.length > 0) {
                const currentUser = firebase.auth().currentUser;
                if (currentUser) {
                    currentUser.getIdToken().then(token => {
                        performFetch(token);
                    }).catch(err => reject(err));
                } else {
                    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
                        unsubscribe();
                        if (user) {
                            user.getIdToken().then(token => {
                                performFetch(token);
                            }).catch(err => reject(err));
                        } else if (savedUser) {
                            performFetch("mock_token_demo");
                        } else {
                            reject(new Error("Authentication is required to query this endpoint. Please log in."));
                        }
                    });
                }
            } else if (savedUser) {
                performFetch("mock_token_demo");
            } else {
                reject(new Error("Authentication is required. Please log in."));
            }
        });
    }
};