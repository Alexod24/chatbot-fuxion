
const dynamicAudioRegex = /\[\s*(?:ENVIAR_AUDIO|AUDIO)\s*:\s*([^\]]+)\s*\]/i;

const testCases = [
    "[AUDIO:llamada]",
    "[ENVIAR_AUDIO:llamada]",
    "[ AUDIO : bienvenida ]",
    "Some text [AUDIO:test] more text",
    "No tag here"
];

testCases.forEach(test => {
    const match = test.match(dynamicAudioRegex);
    console.log(`Test: "${test}"`);
    if (match) {
        console.log(`  - Match found! Name: "${match[1]}"`);
        console.log(`  - Text after removal: "${test.replace(dynamicAudioRegex, '').trim()}"`);
    } else {
        console.log("  - No match.");
    }
});
