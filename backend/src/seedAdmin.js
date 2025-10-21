import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/games_hub';

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
    const email = 'superadmin@games_hub.com';
    const defaultPassword = '0f5pMWmGJndLb43pf9gsG7b4uncOcG';

    const existing = await User.findOne({ email });
    if (existing) {
        console.log('Admin já existe:', existing.email);
        await mongoose.disconnect();
        return;
    }
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const admin = await User.create({
        firstName: 'super',
        lastName: 'admin',
        email: 'superadmin@games_hub.com',
        cpf: '07401490323',
        phone: '85999848131',
        passwordHash,
        role: 'admin'
    });
    console.log('Admin criado:', admin.email);
    await mongoose.disconnect();
}

main().catch((e) => {
    console.error('Seed falhou', e);
    process.exit(1);
});
