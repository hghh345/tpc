const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");


const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY
);


const supabase = createClient(
    "https://cvuyybeihtvhygxukbuj.supabase.co/",
    process.env.SUPABASE_SECRET_KEY
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
            packSize,
            delivery
        } = req.body;


        /* -------------------------- */
        /* Validate request */
        /* -------------------------- */

        if (
            !priceId ||
            !email ||
            !packSize ||
            !delivery
        ) {

            return res.status(400).json({
                error:
                    "Missing order information"
            });

        }


        /* -------------------------- */
        /* Validate pack */
        /* -------------------------- */

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


        const expectedPrice =
            packSize === 36
                ? "price_1UHqWOA5iFvf2pvFnO3hENH8"
                : "price_1UHqVsA5iFvf2pvFl4gaGU94";


        if (
            priceId !== expectedPrice
        ) {

            return res.status(400).json({
                error:
                    "Price does not match pack size"
            });

        }


        /* -------------------------- */
        /* Validate delivery */
        /* -------------------------- */

        const allowedDeliveries = [

            "gallery",

            "nosmallphotos",

            "mail"

        ];


        if (
            !allowedDeliveries.includes(delivery)
        ) {

            return res.status(400).json({
                error:
                    "Invalid delivery method"
            });

        }


        /* -------------------------- */
        /* Calculate amount */
        /* -------------------------- */

        let amount =
            packSize === 36
                ? 3600
                : 1800;


        if (
            delivery === "mail"
        ) {

            amount += 200;

        }


        /* -------------------------- */
        /* Create beta order */
        /* -------------------------- */

        const {
            data: betaOrder,
            error: betaOrderError
        } =
            await supabase
                .from("beta_orders")
                .insert({

                    email:
                        email,

                    pack_size:
                        packSize,

                    delivery:
                        delivery,

                    amount:
                        amount,

                    status:
                        "pending"

                })
                .select()
                .single();


        if (betaOrderError) {

            throw betaOrderError;

        }


        /* -------------------------- */
        /* Create Stripe line items */
        /* -------------------------- */

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


        /* -------------------------- */
        /* Create Stripe Checkout */
        /* -------------------------- */

        const session =
            await stripe.checkout.sessions.create({

                mode:
                    "payment",

                customer_email:
                    email,


                metadata: {

                    order_type:
                        "summer_experiment",

                    beta_order_id:
                        betaOrder.id,

                    pack_size:
                        String(packSize),

                    delivery:
                        delivery

                },


                line_items:
                    lineItems,


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


        /* -------------------------- */
        /* Save Stripe session ID */
        /* -------------------------- */

        const {
            error: updateError
        } =
            await supabase
                .from("beta_orders")
                .update({

                    stripe_session_id:
                        session.id

                })
                .eq(
                    "id",
                    betaOrder.id
                );


        if (updateError) {

            throw updateError;

        }


        /* -------------------------- */
        /* Return checkout URL */
        /* -------------------------- */

        return res.status(200).json({

            url:
                session.url

        });

    }


    catch (error) {

        console.error(
            "Beta checkout error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to create beta checkout session"

        });

    }

};