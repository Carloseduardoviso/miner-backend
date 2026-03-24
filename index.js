const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const SPEED_SECRET_KEY = process.env.SPEED_KEY || 'rk_live_mn3wt9l7s1kdMyrFmn4n16mlCchqqdhAmn4n16mmUHjWNbXr';
const MINIMO_SATS = 25;
const LIMITE_SATS_SAQUE = 10000;

app.post('/api/saque-real', async (req, res) => {
    const { address, amountSats } = req.body;

    if (amountSats < MINIMO_SATS || amountSats > LIMITE_SATS_SAQUE) {
        return res.status(400).json({ success: false, error: `Limite: ${MINIMO_SATS} a ${LIMITE_SATS_SAQUE} sats.` });
    }

    // Identifica se é Lightning Address ou Invoice (BOLT11)
    const isLNAddress = address.includes('@');

    // ESTRUTURA PARA SAQUE (PAYOUT)
    const payoutData = {
        amount: amountSats,
        currency: 'sats',
        description: "Saque Miner App",
        // Importante: A API de Payout usa 'method' e 'destination'
        method: isLNAddress ? 'lightning_address' : 'bolt11',
        destination: address.trim()
    };

    try {
        const response = await axios.post('https://api.tryspeed.com/v1/payouts', payoutData, {
            headers: {
                'Authorization': `Basic ${Buffer.from(SPEED_SECRET_KEY + ':').toString('base64')}`,
                'Content-Type': 'application/json',
                'speed-version': '2022-10-15' // Versão atualizada conforme sua imagem
            }
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("Erro Speed:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || "Erro na Speed. Verifique saldo ou endereço."
        });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));