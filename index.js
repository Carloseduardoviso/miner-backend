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
// A chave sk_live está aqui, mas o ideal no Render é usar Environment Variables
const SPEED_SECRET_KEY = process.env.SPEED_KEY || 'rk_live_mn3wt9l7s1kdMyrFmn4n16mlCchqqdhAmn4n16mmUHjWNbXr';
const LIMITE_SATS_SAQUE = 10000; // Limite de segurança por transação

app.get('/', (req, res) => {
    res.send('Servidor CarlosVisoClash Miner está ONLINE e com LOGS DETALHADOS!');
});

app.post('/api/saque-real', async (req, res) => {
    const { address, amountSats } = req.body;

    console.log(`\n--- NOVA TENTATIVA DE SAQUE ---`);
    console.log(`Destino: ${address}`);
    console.log(`Quantidade solicitada no App: ${amountSats} sats`);

    // 1. Validação de Limite
    if (amountSats > LIMITE_SATS_SAQUE) {
        console.warn("Bloqueado: Valor acima do limite de segurança.");
        return res.status(403).json({
            success: false,
            error: `Limite de segurança: máx ${LIMITE_SATS_SAQUE} sats.`
        });
    }

    // 2. Verificação do tipo de endereço
    const isInvoice = address.toLowerCase().startsWith('lnbc');

    // Montagem dinâmica dos dados para a Speed
    let payoutData = {};

    if (isInvoice) {
        // Se for INVOICE (lnbc...), a Speed exige apenas o payment_request
        // O valor já está embutido no código da fatura
        payoutData = {
            payment_request: address.trim(),
            description: "Saque Invoice CarlosViso Miner"
        };
        console.log("Detectado: Lightning Invoice (lnbc)");
    } else {
        // Se for Lightning Address (usuario@speed.app), precisa de destination + amount
        payoutData = {
            destination: address.trim(),
            source_details: {
                amount: amountSats,
                currency: 'sats'
            },
            description: "Saque Direto CarlosViso Miner"
        };
        console.log("Detectado: Lightning Address (fixo)");
    }

    try {
        const response = await axios.post('https://api.tryspeed.com/v1/payouts', payoutData, {
            headers: {
                'Authorization': `Basic ${Buffer.from(SPEED_SECRET_KEY + ':').toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ SUCESSO! ID da Transação:", response.data.id);
        res.json({ success: true, data: response.data });

    } catch (error) {
        console.error("❌ ERRO NA API DA SPEED:");

        if (error.response) {
            // O servidor da Speed respondeu com erro (400, 401, 500...)
            const speedData = error.response.data;
            console.error("Status:", error.response.status);
            console.error("Detalhes:", JSON.stringify(speedData, null, 2));

            // Retorna a mensagem exata da Speed para o seu App (Snack)
            const msg = speedData.message || "Erro desconhecido";
            const code = speedData.code || "api_error";

            res.status(error.response.status).json({
                success: false,
                error: `Speed diz: ${msg} [${code}]`
            });
        } else {
            // Erro de conexão ou timeout
            console.error("Erro de Rede:", error.message);
            res.status(500).json({
                success: false,
                error: "Erro de conexão com a Speed. Tente novamente."
            });
        }
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
