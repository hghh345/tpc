const Stripe = require("stripe");

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY
);


module.exports = async (req, res) => {

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    try {

        const {
            priceId,
            email,
            photoSessionId,
            packSize,
            delivery
        } = req.body;


        /*
           Make sure we have everything we need.
        */

        if (
            !priceId ||
            !email ||
            !photoSessionId ||
            !packSize ||
            !delivery
        ) {

            return res.status(400).json({
                error:
                    "Missing order information"
            });

        }


        /*
           Only allow our two beta
           one-time prices.
        */

        const allowedPrices = [

            "price_1UHqVsA5iFvf2pvFl4gaGU94",

            "price_1UHqWOA5iFvf2pvFnO3hENH8"

        ];


        if (
            !allowedPrices.includes(priceId)
        ) {

            return res.status(400).json({
                error: "Invalid price"
            });

        }


        /*
           Make sure the pack size matches
           the Stripe price.
        */

        const expectedPrice =
            packSize === 36
                ? "price_1UHqWOA5iFvf2pvFnO3hENH8"
                : "price_1UHqVsA5iFvf2pvFl4gaGU94";


        if (
            priceId !== expectedPrice
        ) {

            return res.status(400).json({
                error: "Price does not match pack size"
            });

        }


        /*
           Only allow the three delivery
           methods offered by the beta.
        */

        const allowedDeliveries = [

            "gallery",

            "nosmallphotos",

            "mail"

        ];


        if (
            !allowedDeliveries.includes(delivery)
        ) {

            return res.status(400).json({
                error: "Invalid delivery method"
            });

        }


        /*
           Create the line items.
           
           The print package is the main item.
           Mail adds a €2 one-time fee.
        */

        const lineItems = [

            {

                price:
                    priceId,

                quantity:
                    1

            }

        ];


        if (
            delivery === "mail"
        ) {

            lineItems.push({

                price_data: {

                    currency:
                        "eur",

                    product_data: {

                        name:
                            "Portugal postage"

                    },

                    unit_amount:
                        200

                },

                quantity:
                    1

            });

        }


        /*
           Create Stripe Checkout Session.
        */

        const session =
            await stripe.checkout.sessions.create({

                mode:
                    "payment",

                customer_email:
                    email,


                metadata: {

                    order_type:
                        "summer_experiment",

                    pack_size:
                        String(packSize),

                    price_id:
                        priceId,

                    delivery:
                        delivery,

                    photoSessionId:
                        photoSessionId

                },


                line_items:
                    lineItems,


                /*
                   Only request a shipping address
                   when the customer chooses mail.
                */

                ...(delivery === "mail"
                    ? {

                        shipping_address_collection: {

                            allowed_countries: [
                                "PT"
                            ]

                        }

                    }
                    : {}),


                success_url:
                    "https://tinyphoto.club/success.html?session_id={CHECKOUT_SESSION_ID}",

                cancel_url:
                    "https://tinyphoto.club/checkout.html"

            });


        return res.status(200).json({

            url:
                session.url

        });


    }

    catch (error) {

        console.error(error);


        return res.status(500).json({

            error:
                "Unable to create beta checkout session"

        });

    }

};