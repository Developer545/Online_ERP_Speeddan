async function testLogin() {
    const url = 'https://speeddansys.vercel.app/api/seguridad/login';
    const payload = {
        username: "admin",
        password: "123"
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log(`HTTP ${res.status}:`, text);
    } catch (e) {
        console.error("Fetch error:", e);
    }
}
testLogin();
