import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/games_hub';

// Admin seed configuration (env overrides allowed)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'superadmin@games_hub.com';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Super Admin';
const ADMIN_CPF = process.env.ADMIN_CPF || '07401490323';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '85999848131';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '0f5pMWmGJndLb43pf9gsG7b4uncOcG';

async function connectWithRetry(uri, retries = 20, delayMs = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(uri);
            return;
        } catch (e) {
            if (attempt === retries) throw e;
            console.log(`Mongo indisponível (tentativa ${attempt}/${retries}). Aguardando...`);
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
}

async function main() {
    await connectWithRetry(MONGO_URI);
    // Remove any previous conflicting records to allow recreation
    const removed = await User.deleteMany({
        $or: [
            { email: ADMIN_EMAIL },
            { cpf: ADMIN_CPF },
            { phone: ADMIN_PHONE },
        ],
    });
    if (removed.deletedCount) {
        console.log(`Registros antigos removidos: ${removed.deletedCount}`);
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const admin = await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        cpf: ADMIN_CPF,
        phone: ADMIN_PHONE,
        passwordHash,
        role: 'admin',
    });
    console.log('Admin criado:', admin.email);
    await mongoose.disconnect();
}

main().catch((e) => {
    console.error('Seed falhou', e);
    process.exit(1);
});
