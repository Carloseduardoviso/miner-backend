const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Puxa a chave direto do Render para maior segurança
const SPEED_SECRET_KEY = process.env.SPEED_KEY || 'sk_test_mn3wt9l7s1kdMyrFmn3wwffgnTE2iUZBmn3wwffjNcbKv46F';

app.post('/api/saque-real', async (req, res) => {
    const { address, amountSats } = req.body;

    try {
        const response = await axios.post('https://api.tryspeed.com/v1/payouts', {
            // AJUSTE AQUI: A Speed exige esse formato para pagamentos
            destination: address,
            source_details: {
                amount: amountSats, // Valor em Satoshis
                currency: 'sats'    // Use 'sats' para evitar erros de conversão
            }
        }, {
            headers: {
                'Authorization': `Basic ${Buffer.from(SPEED_SECRET_KEY + ':').toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        // Exibe o erro real da Speed no log do Render para você ver
        console.error("Erro Speed:", error.response ? error.response.data : error.message);
        res.status(500).json({
            success: false,
            error: error.response ? error.response.data.message : error.message
        });
    }
});

const PORT = process.env.PORT || 10000; // O Render usa a porta 10000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));