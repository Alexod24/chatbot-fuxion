const agendarRegex = /\[\s*AGENDAR\s*:\s*([^,\]]+)\s*,\s*([^\]]+)\s*\]/i;

const testCases = [
    {
        input: "excelente, te llamo en un momento para darte una mejor atencion. [AGENDAR: 15 minutos, Prunex 1]",
        expectedClean: "excelente, te llamo en un momento para darte una mejor atencion.",
        expectedHora: "15 minutos",
        expectedProducto: "Prunex 1"
    },
    {
        input: "genial, te llamo a las 3:00 pm a este número. [AGENDAR: 3:00 pm, Rexet]",
        expectedClean: "genial, te llamo a las 3:00 pm a este número.",
        expectedHora: "3:00 pm",
        expectedProducto: "Rexet"
    }
];

testCases.forEach((tc, idx) => {
    console.log(`\n--- Test Case ${idx + 1} ---`);
    const match = tc.input.match(agendarRegex);
    if (!match) {
        console.error("FAIL: No match found");
        return;
    }
    const clean = tc.input.replace(agendarRegex, '').trim();
    const hora = match[1].trim();
    const producto = match[2].trim();
    
    console.log(`Input: "${tc.input}"`);
    console.log(`Clean: "${clean}" (Expected: "${tc.expectedClean}")`);
    console.log(`Hora: "${hora}" (Expected: "${tc.expectedHora}")`);
    console.log(`Producto: "${producto}" (Expected: "${tc.expectedProducto}")`);
    
    if (clean === tc.expectedClean && hora === tc.expectedHora && producto === tc.expectedProducto) {
        console.log("SUCCESS");
    } else {
        console.error("FAIL: Mismatch in expected results");
    }
});
