const url = 'http://localhost:3001/api/whatsapp/init';
const body = { userId: 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a' };

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
})
.then(res => {
    console.log('Status Code:', res.status);
    return res.json();
})
.then(data => {
    console.log('Init Response:', data);
    process.exit(0);
})
.catch(err => {
    console.error('Init Error:', err);
    process.exit(1);
});
