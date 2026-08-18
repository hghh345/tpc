const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
    "https://cvuyybeihtvhygxukbuj.supabase.co/",
    process.env.SUPABASE_SECRET_KEY
);

module.exports = async (req, res) => {

    if (req.method !== "POST") {
        return res.status(405).send("Method not allowed");
    }

    try {

        const signature = req.headers["stripe-signature"];

        /*
           Vercel gives us the raw request body
           when we disable its automatic body parser.
        */

        const event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log("Stripe event:", event.type);

        /*
           For now, we only care about successful
           Checkout payments.
        */

        if (event.type === "checkout.session.completed") {

            const session = event.data.object;

            const email =
                session.customer_details?.email ||
                session.customer_email;

            console.log(
                "Successful checkout:",
                email
            );

            /*
               Create the Supabase user.
            */

            const {
                data: userData,
                error: userError
            } = await supabase.auth.admin.createUser({

                email: email,

                email_confirm: true

            });

            if (userError) {

                console.error(
                    "Supabase user error:",
                    userError
                );

                return res.status(500).json({
                    error: "Could not create user"
                });

            }

            console.log(
                "Created Supabase user:",
                userData.user.id
            );

        }

        return res.status(200).json({
            received: true
        });

    } catch (error) {

        console.error(
            "Webhook error:",
            error
        );

        return res.status(400).json({
            error: "Webhook failed"
        });

    }
};


/*
   IMPORTANT:
   Stripe needs the raw request body
   for signature verification.
*/

module.exports.config = {
    api: {
        bodyParser: false
    }
};