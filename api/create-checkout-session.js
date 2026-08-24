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
        */

      const allowedPrices = [
    "price_1U82TOA5iFvf2pvF4uGCTXSS",
    "price_1U82U6A5iFvf2pvFr1MFGx4U"
    ];

        if (!allowedPrices.includes(priceId)) {
            return res.status(400).json({
                error: "Invalid price"
            });
        }


        /*
           Decide which Tiny Photo Club plan was selected.
        */

        const plan =
            priceId === "price_1U5umPA5iFvf2pvF3lnKlghA"
                ? "monthly"
                : "three_months";


        const session = await stripe.checkout.sessions.create({

            mode: "subscription",

            customer_email: email,

            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],

            /*
               This information travels with the
               Stripe Checkout Session and will be
               available to our webhook.
            */

            metadata: {
                plan: plan,
                price_id: priceId
            },

            subscription_data: {
                metadata: {
                    plan: plan,
                    price_id: priceId
                }
            },

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