const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Defina suas chaves e limites aqui no topo
const SPEED_SECRET_KEY = process.env.SPEED_KEY || 'sk_live_mn3wt9l7s1kdMyrFmn4l0ifheOrI2911mn4l0ifhVeG42iWw';
const MINIMO_SATS = 25;
const LIMITE_SATS_SAQUE = 10000;

// 2. A implementação vai EXATAMENTE aqui dentro:
app.post('/api/saque-real', async (req, res) => {
    const { address, amountSats } = req.body;

    // Validação básica de limites
    if (!amountSats || amountSats < MINIMO_SATS || amountSats > LIMITE_SATS_SAQUE) {
        return res.status(400).json({ success: false, error: `Limite: ${MINIMO_SATS} a ${LIMITE_SATS_SAQUE} sats.` });
    }

    const isLNAddress = address.includes('@');

    // --- AQUI ENTRA O CÓDIGO QUE VOCÊ PERGUNTOU ---
    const payoutData = {
        amount: Math.round(amountSats),           // Valor em SATS (inteiro)
        currency: 'sats',                         // Moeda de destino
        description: "Saque Carlos Miner App",
        method: isLNAddress ? 'lightning_address' : 'bolt11', // Tipo de endereço
        destination: address.trim()               // O endereço ou invoice lnbc...
    };

    try {
        const response = await axios.post('https://api.tryspeed.com/v1/payouts', payoutData, {
            headers: {
                // A Speed exige Basic Auth (Chave:Vazio) convertido para Base64
                'Authorization': `Basic ${Buffer.from(SPEED_SECRET_KEY + ':').toString('base64')}`,
                'Content-Type': 'application/json',
                'speed-version': '2022-10-15'
            }
        });

        // Se chegar aqui, o saque deu certo na Speed
        res.json({ success: true, data: response.data });

    } catch (error) {
        // Se der erro (falta de saldo, endereço errado, etc)
        console.error("Erro Speed:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || "Erro na Speed. Verifique saldo ou endereço."
        });
    }
    // --- FIM DO CÓDIGO DE SAQUE ---
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));