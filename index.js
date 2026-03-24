const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

const SPEED_SECRET_KEY = process.env.SPEED_KEY || 'rk_live_mn3wt9l7s1kdMyrFmn4n16mlCchqqdhAmn4n16mmUHjWNbXr';
const MINIMO_SATS = 25;
const LIMITE_SATS_SAQUE = 10000;

app.get('/', (req, res) => {
    res.send('Servidor CarlosViso Miner ON - Min: 25 sats');
});

app.post('/api/saque-real', async (req, res) => {
    const { address, amountSats } = req.body;

    console.log(`Solicitação: ${amountSats} sats para ${address}`);

    if (amountSats < MINIMO_SATS || amountSats > LIMITE_SATS_SAQUE) {
        return res.status(400).json({ success: false, error: `Valor fora do limite (25 - ${LIMITE_SATS_SAQUE} sats).` });
    }

    const isInvoice = address.toLowerCase().startsWith('lnbc');
    let payoutData = {};

    if (isInvoice) {
        payoutData = {
            payment_request: address.trim(),
            description: "Saque CarlosViso Miner"
        };
    } else {
        // ESTRUTURA CORRIGIDA PARA LIGHTNING ADDRESS
        payoutData = {
            destination: address.trim(),
            amount: amountSats,
            currency: 'sats',
            description: "Saque CarlosViso Miner",
            source_details: { source_type: 'wallet' }
        };
    }

    try {
        const response = await axios.post('https://api.tryspeed.com/v1/payouts', payoutData, {
            headers: {
                'Authorization': `Basic ${Buffer.from(SPEED_SECRET_KEY + ':').toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("Erro Speed:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || "Erro na Speed. Verifique saldo/verificação."
        });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));