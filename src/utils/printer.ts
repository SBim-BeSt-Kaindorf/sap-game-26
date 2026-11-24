import type {ReceiptPrintPayload} from '../types/game';

const PRINT_SERVER_URL = 'http://localhost:3001/print';

export async function triggerReceiptPrint(payload: ReceiptPrintPayload): Promise<boolean> {
    console.log('🖨️ Sende Druckauftrag an lokales Backend:', payload);

    try {
        const response = await fetch(PRINT_SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('❌ Druckserver-Fehler:', errText);
            return false;
        }

        console.log('✅ Bon erfolgreich an POS-80C gesendet!');
        return true;
    } catch (error) {
        console.error('❌ Druckserver nicht erreichbar (läuft server.py auf Port 3001?):', error);
        return false;
    }
}