// Unit test for getGoogleCalendarUrl
function getGoogleCalendarUrl(horaPactada, productoInteres, clientNumber, waLink) {
    try {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const peruTime = new Date(utc + (3600000 * -5));
        let eventDate = new Date(peruTime);

        const timeStr = horaPactada.toLowerCase().trim();

        if (timeStr.includes("minutos") || timeStr.includes("min")) {
            const minsMatch = timeStr.match(/(\d+)/);
            if (minsMatch) {
                const mins = parseInt(minsMatch[1], 10);
                eventDate.setMinutes(eventDate.getMinutes() + mins);
            } else {
                eventDate.setMinutes(eventDate.getMinutes() + 15);
            }
        } else if (timeStr.includes("hora") && (timeStr.includes("1") || timeStr.includes("una"))) {
            eventDate.setHours(eventDate.getHours() + 1);
        } else {
            const timeMatch = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)?/);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1], 10);
                const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
                const ampm = timeMatch[3];

                if (ampm === "pm" && hours < 12) {
                    hours += 12;
                } else if (ampm === "am" && hours === 12) {
                    hours = 0;
                }

                eventDate.setHours(hours, minutes, 0, 0);

                if (eventDate < peruTime) {
                    eventDate.setDate(eventDate.getDate() + 1);
                }
            } else {
                eventDate.setMinutes(eventDate.getMinutes() + 15);
            }
        }

        const formatCalendarDate = (date) => {
            const pad = (num) => String(num).padStart(2, '0');
            const yyyy = date.getFullYear();
            const mm = pad(date.getMonth() + 1);
            const dd = pad(date.getDate());
            const hh = pad(date.getHours());
            const min = pad(date.getMinutes());
            const ss = pad(date.getSeconds());
            return `${yyyy}${mm}${dd}T${hh}${min}${ss}`;
        };

        const startDateStr = formatCalendarDate(eventDate);
        const endDate = new Date(eventDate.getTime() + 15 * 60000); // 15 mins duration
        const endDateStr = formatCalendarDate(endDate);

        const cleanPhone = clientNumber.startsWith('+') ? clientNumber : '+' + clientNumber;
        const title = encodeURIComponent(`Llamar a cliente (${cleanPhone}) - Fuxion`);
        const details = encodeURIComponent(`Llamar al cliente para cerrar venta de ${productoInteres}.\n\nWhatsApp del cliente: ${waLink}`);
        
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}`;
    } catch (e) {
        console.error("Error generating Google Calendar URL:", e);
        return null;
    }
}

// Test cases
const tests = [
    { hora: "15 minutos", prod: "Prunex 1", phone: "+51 987654321", wa: "https://wa.me/51987654321" },
    { hora: "5:30 pm", prod: "Rexet", phone: "+51999888777", wa: "https://wa.me/51999888777" },
    { hora: "10 am", prod: "Prunex 1", phone: "51912345678", wa: "https://wa.me/51912345678" }
];

tests.forEach(t => {
    console.log(`\nInput: horaPactada="${t.hora}", producto="${t.prod}", phone="${t.phone}"`);
    const url = getGoogleCalendarUrl(t.hora, t.prod, t.phone, t.wa);
    console.log(`URL: ${url}`);
});
