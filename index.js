const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 NUNCA coloque chave direto no código
const SPEED_SECRET_KEY = process.env.SPEED_KEY;

const MINIMO_SATS = 25;
const LIMITE_SATS_SAQUE = 10000;

app.get('/', (req, res) => {
    res.send('Servidor CarlosViso Miner ON');
});

app.post('/api/saque-real', async (req, res) => {
    const { address, amountSats } = req.body;

    console.log("==== NOVO SAQUE ====");
    console.log("Address:", address);
    console.log("Sats:", amountSats);

    // 🔎 validações
    if (!address) {
        return res.status(400).json({ success: false, error: "Endereço vazio" });
    }

    if (amountSats < MINIMO_SATS || amountSats > LIMITE_SATS_SAQUE) {
        return res.status(400).json({
            success: false,
            error: `Valor inválido (mín ${MINIMO_SATS}, máx ${LIMITE_SATS_SAQUE})`
        });
    }

    try {
        // 🔥 CONVERSÃO CORRETA
        const amountBTC = amountSats / 100000000;

        const payload = {
            destination: address.trim(),
            amount: amountBTC,
            currency: 'BTC',
            description: 'Saque CarlosViso Miner'
        };

        console.log("Payload enviado:", payload);

        const response = await axios.post(
            'https://api.tryspeed.com/v1/payouts',
            payload,
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(SPEED_SECRET_KEY + ':').toString('base64')}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log("RESPOSTA SPEED:", response.data);

        return res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error("ERRO COMPLETO:", error.response?.data || error.message);

        return res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`🚀 Rodando na porta ${PORT}`);
});