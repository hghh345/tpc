const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { priceId, email } = req.body;

        if (!priceId || !email) {
            return res.status(400).json({
                error: "Missing price or email"
            });
        }


        /*
           Only allow our two Tiny Photo Club prices.
           This prevents someone from sending a random
           Stripe Price ID to your endpoint.
        */

        const allowedPrices = [
            "price_1U5umPA5iFvf2pvF3lnKlghA",
            "price_1U5un7A5iFvf2pvFsiwTmiSF"
        ];

        if (!allowedPrices.includes(priceId)) {
            return res.status(400).json({
                error: "Invalid price"
            });
        }


        const session = await stripe.checkout.sessions.create({

            mode: "subscription",

            customer_email: email,

            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],

            shipping_address_collection: {
                allowed_countries: [
                    "PT"
                ]
            },

            success_url:
                "https://tinyphoto.club/success.html",

            cancel_url:
                "https://tinyphoto.club/checkout.html"

        });


        return res.status(200).json({
            url: session.url
        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Unable to create checkout session"
        });

    }

};