const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// A chave sk_test deve ser configurada nas Environment Variables do Render para segurança
const SPEED_SECRET_KEY = process.env.SPEED_KEY || 'sk_test_mn3wt9l7s1kdMyrFmn3wwffgnTE2iUZBmn3wwffjNcbKv46F';

// Rota de teste para verificar se o servidor está online
app.get('/', (req, res) => {
    res.send('Servidor CarlosVisoClash Miner está ONLINE!');
});

app.post('/api/saque-real', async (req, res) => {
    const { address, amountSats } = req.body;

    console.log(`--- Tentativa de Saque: ${amountSats} sats para ${address} ---`);

    try {
        const response = await axios.post('https://api.tryspeed.com/v1/payouts', {
            destination: address,
            source_details: {
                amount: amountSats,
                currency: 'sats'
            },
            description: "Saque CarlosVisoClash Miner"
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