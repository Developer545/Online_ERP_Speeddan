async function testProvision() {
    const url = 'https://speeddansys.vercel.app/api/seguridad/provision-internal';
    const key = 'speeddansys-internal-key-2026-xiAkQ7mzLpR9';

    const payload = {
        empresa_nombre: "Bit of heave",
        empresa_nit: "0615-181215-102-5",
        subdominio: "heave4",
        username: "heave4",
        password: "Heaven123!",
        plan: "corporativo_cloud",
        modulos: { "cxc": true, "cxp": true, "gastos": true, "clientes": true, "proveedores": true, "inventarios": true, "facturacion": true, "reportes": true },
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Key': key
            },
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        try {
            console.log(`HTTP ${res.status}:`, JSON.stringify(JSON.parse(text), null, 2));
        } catch (e) {
            console.log(`HTTP ${res.status}:`, text);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

testProvision();
