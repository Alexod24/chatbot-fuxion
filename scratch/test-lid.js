const { whatsappManager, initializeWhatsApp } = require('../src/lib/whatsapp');

async function run() {
    console.log("Starting test-lid...");
    await initializeWhatsApp();
    
    const client = whatsappManager.getClient('default');
    
    client.on('ready', async () => {
        console.log("Client is ready!");
        const testLids = ['256281185128601@lid', '153231699218599@lid'];
        
        for (const lid of testLids) {
            console.log(`\n--- Testing for: ${lid} ---`);
            try {
                const lidPhoneList = await client.getContactLidAndPhone([lid]);
                console.log("getContactLidAndPhone response:", JSON.stringify(lidPhoneList, null, 2));
            } catch (err) {
                console.error("getContactLidAndPhone error:", err);
            }
            
            try {
                const contact = await client.getContactById(lid);
                console.log("getContactById details:");
                console.log("- id:", contact.id);
                console.log("- number:", contact.number);
                console.log("- name:", contact.name);
                console.log("- pushname:", contact.pushname);
                console.log("- number property directly:", contact.number);
                const formatted = await contact.getFormattedNumber();
                console.log("- formatted number:", formatted);
            } catch (err) {
                console.error("getContactById error:", err);
            }

            try {
                // Test direct evaluation inside Puppeteer to inspect the window.Store.Contact object
                const rawContact = await client.pupPage.evaluate(async (idStr) => {
                    const wid = window.Store.WidFactory.createWid(idStr);
                    const contact = await window.Store.Contact.find(wid);
                    return {
                        id: contact.id ? contact.id._serialized : null,
                        phoneNumber: contact.phoneNumber ? contact.phoneNumber._serialized : null,
                        userid: contact.userid,
                        pushname: contact.pushname,
                        name: contact.name,
                        isLid: contact.isLid,
                        isUser: contact.isUser,
                        keys: Object.keys(contact)
                    };
                }, lid);
                console.log("Raw contact info from page.evaluate:", JSON.stringify(rawContact, null, 2));
            } catch (err) {
                console.error("Raw contact page.evaluate error:", err);
            }
        }
        
        console.log("\nFinished testing, exiting in 5s...");
        setTimeout(() => process.exit(0), 5000);
    });

    client.on('qr', (qr) => {
        console.log("QR code received, please scan first if not authenticated!");
    });
}

run().catch(err => console.error("Run error:", err));
