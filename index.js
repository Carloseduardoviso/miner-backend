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
const LIMITE_SATS_SAQUE = 10000;

app.get('/', (req, res) => {
    res.send('Servidor CarlosVisoClash Miner está ONLINE e com DEBUG ATIVO!');
});

app.post('/api/saque-real', async (req, res) => {
    const { address, amountSats } = req.body;

    console.log(`\n--- NOVA TENTATIVA DE SAQUE ---`);
    console.log(`Destino: ${address}`);
    console.log(`Quantidade: ${amountSats} sats`);

    // 1. Validação de Limite
    if (amountSats > LIMITE_SATS_SAQUE) {
        return res.status(403).json({
            success: false,
            error: `Limite de segurança: máx ${LIMITE_SATS_SAQUE} sats.`
        });
    }

    // 2. Montagem do corpo da requisição para a Speed
    // Se começar com lnbc, tratamos como invoice. Se não, como destination normal.
    const isInvoice = address.toLowerCase().startsWith('lnbc');

    const payoutData = {
        source_details: {
            amount: amountSats,
            currency: 'sats'
        },
        description: "Saque CarlosVisoClash Miner"
    };

    if (isInvoice) {
        payoutData.payment_request = address.trim();
    } else {
        payoutData.destination = address.trim();
    }

    try {
        const response = await axios.post('https://api.tryspeed.com/v1/payouts', payoutData, {
            headers: {
                'Authorization': `Basic ${Buffer.from(SPEED_SECRET_KEY + ':').toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ SUCESSO SPEED ID:", response.data.id);
        res.json({ success: true, data: response.data });

    } catch (error) {
        // --- ÁREA DE DEBUG CRÍTICO ---
        console.error("❌ ERRO DETECTADO NA SPEED:");

        if (error.response) {
            // O servidor da Speed respondeu com um erro (ex: 400, 401, 404)
            console.error("Status do Erro:", error.response.status);
            console.error("Dados do Erro:", JSON.stringify(error.response.data, null, 2));

            const speedMessage = error.response.data.message || "Erro desconhecido na API";
            const speedCode = error.response.data.code || "no_code";

            res.status(500).json({
                success: false,
                error: `Speed diz: ${speedMessage} (${speedCode})`
            });
        } else if (error.request) {
            // A requisição foi feita mas não houve resposta
            console.error("Sem resposta da Speed. Verifique a internet do servidor.");
            res.status(500).json({ success: false, error: "A Speed não respondeu ao chamado." });
        } else {
            // Erro na montagem da requisição
            console.error("Erro interno:", error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));