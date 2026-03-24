const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// CONFIGURAÇÕES DE SEGURANÇA
const SPEED_SECRET_KEY = process.env.SPEED_KEY || 'sk_live_mn3wt9l7s1kdMyrFmn4l0ifheOrI2911mn4l0ifhVeG42iWw';
const LIMITE_SATS_SAQUE = 1000; // Limite máximo por transação para sua segurança

app.get('/', (req, res) => {
    res.send('Servidor CarlosVisoClash Miner está ONLINE e em modo REAL!');
});

app.post('/api/saque-real', async (req, res) => {
    const { address, amountSats } = req.body;

    console.log(`--- Tentativa de Saque: ${amountSats} sats para ${address} ---`);

    // 1. Validação de Limite de Segurança
    if (amountSats > LIMITE_SATS_SAQUE) {
        console.warn(`Tentativa de saque bloqueada: ${amountSats} excede o limite de ${LIMITE_SATS_SAQUE}`);
        return res.status(403).json({
            success: false,
            error: `O limite máximo por saque é de ${LIMITE_SATS_SAQUE} sats.`
        });
    }

    // 2. Validação básica de dados
    if (!address || !amountSats) {
        return res.status(400).json({ success: false, error: "Dados incompletos." });
    }

    try {
        const response = await axios.post('https://api.tryspeed.com/v1/payouts', {
            destination: address,
            source_details: {
                amount: amountSats,
                currency: 'sats'
            },
            description: "Saque CarlosVisoClash Miner - Real"
        }, {
            headers: {
                'Authorization': `Basic ${Buffer.from(SPEED_SECRET_KEY + ':').toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("Sucesso Speed ID:", response.data.id);
        res.json({ success: true, data: response.data });

    } catch (error) {
        const errorMsg = error.response ? error.response.data.message : error.message;
        console.error("Erro Speed Detalhado:", error.response ? error.response.data : error.message);

        res.status(500).json({
            success: false,
            error: errorMsg || "Erro ao processar saque na Speed"
        });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));