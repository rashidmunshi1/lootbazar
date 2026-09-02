const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// In-memory registry of sessions
const sessions = new Map();

// Helper to generate a 6-digit dynamic OTP
const generateSecureOtp = () => {
    return crypto.randomInt(100000, 999999).toString();
};

const createOrGetSession = (sessionId = 'account-1', sessionName = 'Primary Gateway') => {
    if (sessions.has(sessionId)) {
        return sessions.get(sessionId);
    }

    const sessionData = {
        sessionId,
        sessionName,
        client: null,
        isReady: false,
        qrCode: '',
        phone: '',
        createdAt: new Date()
    };

    // Ensure dedicated isolated directory for each session
    const sessionPath = path.join(process.cwd(), 'whatsapp-sessions', sessionId);
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: sessionId,
            dataPath: path.join(process.cwd(), 'whatsapp-sessions')
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    });

    client.on('qr', async (qr) => {
        console.log(`>>> [WhatsApp Service] QR Code emitted for Session: ${sessionId} <<<`);
        try {
            sessionData.qrCode = await QRCode.toDataURL(qr, {
                width: 260,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            sessionData.isReady = false;
        } catch (err) {
            console.error(`Error encoding QR for ${sessionId}:`, err);
        }
    });

    client.on('ready', () => {
        console.log(`>>> [WhatsApp Service] Session ${sessionId} is ONLINE <<<`);
        sessionData.isReady = true;
        sessionData.qrCode = '';
        sessionData.phone = client.info?.wid?.user || 'Connected';
    });

    client.on('authenticated', () => {
        console.log(`>>> [WhatsApp Service] Session ${sessionId} authenticated successfully <<<`);
    });

    client.on('auth_failure', (msg) => {
        console.error(`>>> [WhatsApp Service] Session ${sessionId} auth failure:`, msg);
        sessionData.isReady = false;
        sessionData.qrCode = '';
    });

    client.on('disconnected', (reason) => {
        console.warn(`>>> [WhatsApp Service] Session ${sessionId} disconnected:`, reason);
        sessionData.isReady = false;
        sessionData.qrCode = '';
        sessionData.phone = '';
    });

    sessionData.client = client;
    sessions.set(sessionId, sessionData);

    client.initialize().catch((err) => {
        console.error(`>>> [WhatsApp Service] Initialization failed for ${sessionId}:`, err);
    });

    return sessionData;
};

// Start default primary account on startup
createOrGetSession('account-1', 'Main Gateway');

const getAllSessions = () => {
    const list = [];
    sessions.forEach((s) => {
        list.push({
            sessionId: s.sessionId,
            sessionName: s.sessionName,
            isReady: s.isReady,
            qrCode: s.qrCode,
            phone: s.phone,
            createdAt: s.createdAt
        });
    });
    return list;
};

const sendDynamicOtp = async (sessionId, targetPhone) => {
    const session = sessions.get(sessionId);

    if (!session || !session.isReady) {
        throw new Error('The selected WhatsApp account is not ready or offline. Please scan QR first.');
    }

    let cleanPhone = targetPhone.toString().replace(/\D/g, '');
    if (cleanPhone.length === 10) {
        cleanPhone = `91${cleanPhone}`;
    }
    const chatId = `${cleanPhone}@c.us`;

    const generatedOtp = generateSecureOtp();

    const staticMessageTemplate = 
`*LootBaazar Security Verification*

Your one-time verification code is:
*${generatedOtp}*

_This code is valid for 5 minutes. Do not share this OTP with anyone._

Thank you for choosing *LootBaazar*!`;

    await session.client.sendMessage(chatId, staticMessageTemplate);

    return {
        success: true,
        sessionId,
        fromPhone: session.phone,
        toPhone: cleanPhone,
        otp: generatedOtp,
        timestamp: new Date().toISOString()
    };
};

const delinkSession = async (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) {
        throw new Error('Session not found');
    }

    try {
        if (session.client) {
            await session.client.logout();
            await session.client.destroy();
        }
    } catch (err) {
        console.warn(`Error during logout/destroy for ${sessionId}:`, err.message);
    }

    sessions.delete(sessionId);

    // Clean up local storage folder for this session
    try {
        const sessionPath = path.join(process.cwd(), 'whatsapp-sessions', `session-${sessionId}`);
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
        }
    } catch (cleanErr) {
        console.warn(`Failed to delete session folder for ${sessionId}:`, cleanErr.message);
    }

    return { success: true, message: `Account ${sessionId} delinked successfully` };
};

module.exports = {
    createOrGetSession,
    getAllSessions,
    sendDynamicOtp,
    delinkSession
};