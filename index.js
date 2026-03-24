const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const SPEED_SECRET_KEY = 'sk_test_mn3wt9l7s1kdMyrFmn3wwffgnTE2iUZBmn3wwffjNcbKv46F'; 

app.post('/api/saque-real', async (req, res) => {
    const { address, amountSats } = req.body;
    try {
        const response = await axios.post('https://api.tryspeed.com/v1/payouts', {
            amount: amountSats, 
            currency: 'btc',
            destination: address,
            network: 'lightning'
        }, {
            headers: { 'Authorization': `Bearer ${SPEED_SECRET_KEY}` }
        });
        res.json({ success: true, data: response.data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));